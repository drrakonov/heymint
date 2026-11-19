import { PrismaClient } from "@prisma/client";
import { Groq } from "groq-sdk";
import { chunkTheTranscription } from "../utils/chunker";

import { meetingTrace } from "../utils/meetingTrace";
import { estimateTokens } from "../utils/transcriptChunks";


const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const FREE_TIER_8K_TPM = {
  singleCallMaxTokens: 4800,  // avoids MapReduce (and 60s waits) for ~25–30 min meetings
  maxWindowTokens: 4800,      // fewer chunks = fewer 60s pacer pauses
  reduceInputMaxTokens: 4200, // slightly lower because JSON tokenizes worse than prose
  maxOutputTokens: 1500,      // plenty for low reasoning (~300-500) + JSON summary (~400)
  tpmBudget: 7200,            // 10% buffer below 8,000 for estimateTokens() drift
};


class TokenPacer {
    private log: {time: number; tokens: number} [] = [];

    constructor(private limitPerMinute: number) {}

    async waitForRoom(tokens: number) {
        while(true) {
            const now = Date.now();

            // Forget anything older than 60 Seconds;
            this.log = this.log.filter((l) => now - l.time < 60_000);

            const used = this.log.reduce((sum, e) => sum + e.tokens, 0);

            // Go ahead if there is room
            if(this.log.length === 0 || used + tokens <= this.limitPerMinute) break;

            // Otherwise wait until the oldest call is more than 60 seconds old
            const waitMs = 60_000 - (now - this.log[0].time) + 200;
            console.log(`Pacer: waiting ${Math.round(waitMs / 1000)}s (used ${used}, need ${tokens})`);
            await new Promise((r) => setTimeout(r, waitMs));

        }

        this.log.push({ time: Date.now(), tokens });
    }
}

// ONE shared pacer for the whole file
const pacer = new TokenPacer(FREE_TIER_8K_TPM.tpmBudget);



const SUMMARY_SYSTEM_PROMPT = `You are a meeting summarizer. You MUST respond with ONLY a valid JSON object (no markdown, no backticks, no extra text). Use this exact structure:
{
  "overview": "2-3 sentence high-level summary of the meeting",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"],
  "decisions": ["decision 1", "decision 2"]
}
Rules:
- Always return valid JSON, nothing else
- If the transcript is very short or unclear, still return the JSON with your best interpretation
- keyPoints should have 3-6 items
- actionItems can be empty array [] if none were discussed
- decisions can be empty array [] if none were made`;

const REDUCE_SYSTEM_PROMPT = `You are a meeting summarizer. You are given multiple partial JSON summaries from consecutive parts of the same meeting.
Merge them into ONE final JSON object using this exact structure:
{
  "overview": "2-3 sentence high-level summary of the entire meeting",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"],
  "decisions": ["decision 1", "decision 2"]
}
Rules:
- Combine the overviews into a single cohesive 2-3 sentence overview
- Deduplicate repeated keyPoints, actionItems, and decisions
- If a later part updates or overrides an earlier decision or deadline, keep the latest one
- keyPoints should have 3-6 items total
- Always return valid JSON, nothing else`;


const withRetry = async <T>(fn: () => Promise<T>, tries = 5): Promise<T> => {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (err: any) {
      const retriable = err?.status === 429 || err?.status >= 500;
      if (!retriable || i >= tries - 1) throw err;

      const h = err?.headers;
      const retryAfter = Number(typeof h?.get === "function" ? h.get("retry-after") : h?.["retry-after"]);
      const wait = retryAfter * 1000 || (err?.status === 429 ? 20_000 : 2 ** i * 1000);
      if (wait > 90_000) throw err; // waiting this long won't help, fail fast

      console.log(`Retry ${i + 1} after ${wait}ms (status ${err?.status})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
};

export const generateAndStoreMeetingSummary = async (
    meetingIdentifier: string,
    transcription: string
) => {
    const meeting = await prisma.meeting.findFirst({
        where: {
            OR: [
                { id: meetingIdentifier },
                { meetingCode: meetingIdentifier }
            ]
        },
        include: { summary: true }
    });

    if (!meeting) {
        throw new Error(`Meeting ${meetingIdentifier} was not found`);
    }

    if (meeting.summary?.transcription === transcription) {
        meetingTrace("summary.reused", { meetingId: meeting.id });
        await chunkTheTranscription(meeting.id);
        return meeting.summary.content;
    }

    meetingTrace("summary.generation_started", { meetingId: meeting.id });

    // Check if the transcription is too long for the model to handle
    const tokenCount = estimateTokens(transcription);
    let content;

    if(tokenCount > FREE_TIER_8K_TPM.singleCallMaxTokens) {
        // Follow the mapReduce Pipeline
        content = await generateMeetingSummaryByUsingMapReduce(transcription);
    } else {
        // Get the final summary
        content = await generateMeetingSummary(`Meeting transcript:\n\n${transcription}`, SUMMARY_SYSTEM_PROMPT);
    }

    
    meetingTrace("summary.generation_finished", { meetingId: meeting.id });

    // Store the content on DB
    await storeGeneratedSummary(content, transcription, meeting);

    await chunkTheTranscription(meeting.id);

    return content;
};


const storeGeneratedSummary = async (content: string, transcription: string, meeting: any) => {
    await prisma.summary.upsert({
        where: { meetingId: meeting.id },
        update: { content, transcription },
        create: {
            content,
            meetingId: meeting.id,
            transcription
        }
    });

    meetingTrace("summary.stored", { meetingId: meeting.id });
}


const generateMeetingSummary = async (userMessage: string, SYSTEM_PROMPT: string) => {
    const cost =
        estimateTokens(SYSTEM_PROMPT) +
        estimateTokens(userMessage) +
        FREE_TIER_8K_TPM.maxOutputTokens;
        
    await pacer.waitForRoom(cost);

    const summary = await withRetry(() =>
        groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            temperature: 0,
            max_completion_tokens: FREE_TIER_8K_TPM.maxOutputTokens,
            reasoning_effort: "low",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage },
            ],
        })
    );


    //const content = summary.choices[0].message.content || "Empty";
    const choice = summary.choices[0];
    const content = choice.message.content;

    if(!content || choice.finish_reason === "length") {
        throw new Error(`Bad summary response (finish_reason=${choice.finish_reason})`);
    }

    console.log("estimated:", estimateTokens(SYSTEM_PROMPT + userMessage), "actual:", summary.usage?.prompt_tokens);

    const cleaned = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    return JSON.stringify(JSON.parse(cleaned));

}



const splitIntoWindows = (text: string, maxWindowTokens: number) => {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const windows: string[] = [];
    let currentWindow: string[] = [];
    let currentTokenCount = 0;

    for(const line of lines) {
        const lineTokenCount = estimateTokens(line) + 1;
        
        // Safety fallback if a single speaker talks non-stop for > 4,000 tokens
        if(lineTokenCount > maxWindowTokens) {
            if(currentWindow.length > 0) {
                windows.push(currentWindow.join("\n"));
                currentWindow = [];
                currentTokenCount = 0;
            }

            const words = line.split(" ");
            let subChunk = "";

            for(const word of words) {
                const candidate = subChunk ? `${subChunk} ${word}` : word;
                
                if(estimateTokens(candidate) > maxWindowTokens) {
                    if(subChunk) windows.push(subChunk);
                    subChunk = word;
                } else {
                    subChunk = candidate
                }
            }

            if(subChunk) windows.push(subChunk);
            continue;
        }


        if(currentWindow.length > 0 && currentTokenCount + lineTokenCount > maxWindowTokens) {
            windows.push(currentWindow.join("\n"));
            currentWindow = [];
            currentTokenCount = 0;
        }

        currentWindow.push(line);
        currentTokenCount += lineTokenCount;

    }

    if(currentWindow.length > 0) {
        windows.push(currentWindow.join("\n"));
    }
    

    return windows;
}

const mergePartialSummaries = async (partialSummary: string[]) => {
    if(partialSummary.length == 1) {
        return partialSummary[0];
    }

    const joined = partialSummary.join("\n");


    // Base Case: All partialSummaries fit inside a single merge Request ( <= 3,500 tokens)
    if(estimateTokens(joined) <= FREE_TIER_8K_TPM.reduceInputMaxTokens) {
        return await generateMeetingSummary(`Partial summaries:\n\n${joined}`, REDUCE_SYSTEM_PROMPT);
    }

    // Recusive Case: Too many partial summaries, merge in smaller groups
    const groups = splitIntoWindows(joined, FREE_TIER_8K_TPM.reduceInputMaxTokens);
    const mergedGroups: string[] = [];
    
    if (groups.length >= partialSummary.length) {
  	    // Can't shrink by grouping. Try one merge if it still fits the real TPM limit.
        const cost =
            estimateTokens(REDUCE_SYSTEM_PROMPT) +
            estimateTokens(joined) +
            FREE_TIER_8K_TPM.maxOutputTokens;
  
        if (cost <= FREE_TIER_8K_TPM.tpmBudget) {
            return await generateMeetingSummary(`Partial summaries:\n\n${joined}`, REDUCE_SYSTEM_PROMPT);
        }
        throw new Error("Summaries too large to merge further");
    }

    for(const group of groups) {
        const groupSummary = await generateMeetingSummary(`Partial summaries:\n\n${group}`, REDUCE_SYSTEM_PROMPT);

        mergedGroups.push(groupSummary)
    }

    return mergePartialSummaries(mergedGroups);
}


const generateMeetingSummaryByUsingMapReduce = async (transcription: string) => {
    // Get chunked transcription into multiple windows.
    const windows = splitIntoWindows(transcription, FREE_TIER_8K_TPM.maxWindowTokens);

    const partialSummary: string[] = [];

    for(let i = 0; i < windows.length; i++) {
        const userPrompt = `Meeting transcript (part ${i + 1} of ${windows.length}):\n\n${windows[i]}`;

        const partial = await generateMeetingSummary(userPrompt, SUMMARY_SYSTEM_PROMPT);
        partialSummary.push(partial);
    }

    return await mergePartialSummaries(partialSummary);
}
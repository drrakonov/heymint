import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "@/lib/router";
import { Sparkles, ArrowUpRight, Upload, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { backend, dateLabel, errorMessage, type Summary } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useMeetings } from "./queries";
import {
  PageHeading,
  Pending,
  EmptyState,
  ErrorState,
  Skeletons,
} from "@/components/heymint/common";
import { AccessGate } from "./AccessGate";
export function InsightsPage({ code }: { code: string }) {
  return (
    <AccessGate key={code} code={code}>
      <InsightsContent code={code} />
    </AccessGate>
  );
}
export function AudioUpload({
  code,
  onSummary,
}: {
  code: string;
  onSummary: (summary: Summary) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !consent || pending) return;
    setPending(true);
    setError("");
    try {
      const summary = await backend.summarize(code, file, file.name);
      onSummary(summary);
      toast.success("Your meeting insights are ready");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="upload-section">
      <h3>Recover insights from audio</h3>
      <p>
        Upload consented meeting audio to generate a summary and saved
        transcription. This sends the selected audio to HeyMint for processing;
        use this as a recovery option if automatic AI notes were unavailable.
      </p>
      <form onSubmit={submit} className="form-stack">
        <label className="field-label">
          Meeting audio
          <input
            type="file"
            accept="audio/*,.webm,.mp3,.wav,.m4a,.ogg"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setError("");
            }}
            disabled={pending}
          />
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={pending}
          />
          <span>
            I have consent from everyone captured in this audio to upload and
            process it.
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error} Your selected file is kept for retry.
          </p>
        )}
        <div>
          <Button disabled={!file || !consent || pending} type="submit">
            {pending ? (
              <Pending>Creating insights</Pending>
            ) : (
              <>
                <Upload />
                {error ? "Retry upload" : "Upload audio"}
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
function InsightsContent({ code }: { code: string }) {
  const { user } = useAuth();
  const meetings = useMeetings();
  const current = meetings.data?.meetings.find((m) => m.meetingCode === code);
  const isHost = current?.createdById === user?.id;
  const query = useQuery({
    queryKey: ["summary", code],
    queryFn: () => backend.insights(code),
    retry: (count, error) =>
      !axios.isAxiosError(error) || error.response?.status !== 404
        ? count < 1
        : false,
  });
  const [generated, setGenerated] = useState<Summary | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { role: "question" | "answer"; text: string }[]
  >([]);
  const [pending, setPending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const ask = async (text: string) => {
    if (pending || !text.trim()) return;
    const q = text.trim();
    if (
      new TextEncoder().encode(JSON.stringify({ question: q })).length > 16000
    ) {
      setChatError("Please keep your question under 16 KB.");
      return;
    }
    setPending(true);
    setChatError("");
    setLastQuestion(q);
    setMessages((m) =>
      m.at(-1)?.role === "question" && m.at(-1)?.text === q
        ? m
        : [...m, { role: "question", text: q }],
    );
    setQuestion("");
    try {
      const answer = await backend.chat(code, q);
      setMessages((m) => [...m, { role: "answer", text: answer }]);
    } catch (e) {
      setChatError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };
  const summary = generated || query.data?.summary;
  const noInsights =
    axios.isAxiosError(query.error) && query.error.response?.status === 404;
  return (
    <>
      <PageHeading
        eyebrow="THE CONVERSATION CONTINUES"
        title={query.data?.title || current?.title || "Meeting insights"}
        description={
          query.data?.date
            ? dateLabel(query.data.date)
            : "Keep the ideas. Carry the momentum."
        }
        action={
          <Button asChild variant="outline">
            <Link to="/meeting/$id" params={{ id: code }}>
              Open room
              <ArrowUpRight />
            </Link>
          </Button>
        }
      />
      <div className="insights-layout">
        <div className="insights-main">
          {query.isPending && !generated ? (
            <Skeletons count={1} />
          ) : query.error && !noInsights && !generated ? (
            <ErrorState
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : summary ? (
            <>
              {summary.raw ? (
                <section className="summary-section">
                  <p className="eyebrow">SAVED SUMMARY</p>
                  <p>{summary.raw}</p>
                </section>
              ) : (
                <>
                  <section className="summary-section">
                    <p className="eyebrow">THE BIG PICTURE</p>
                    <h2>Overview</h2>
                    <p>
                      {summary.overview ||
                        "No overview was included in this summary."}
                    </p>
                  </section>
                  {[
                    { key: "keyPoints", title: "The important moments." },
                    { key: "decisions", title: "What you decided." },
                    { key: "actionItems", title: "What comes next." },
                  ].map((section) => (
                    <section className="summary-section" key={section.key}>
                      <h2>{section.title}</h2>
                      {summary[
                        section.key as "keyPoints" | "decisions" | "actionItems"
                      ].length ? (
                        <ul>
                          {summary[
                            section.key as
                              "keyPoints" | "decisions" | "actionItems"
                          ].map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>
                          No{" "}
                          {section.key === "keyPoints"
                            ? "key points"
                            : section.key === "decisions"
                              ? "decisions"
                              : "action items"}{" "}
                          were included.
                        </p>
                      )}
                    </section>
                  ))}
                </>
              )}
              {query.data?.transcription && (
                <section className="summary-section">
                  <h2>Saved transcription</h2>
                  <div className="transcript">{query.data.transcription}</div>
                </section>
              )}
            </>
          ) : (
            <EmptyState
              title="Good ideas are worth keeping."
              description="There are no saved insights for this conversation yet. If AI notes were enabled, your host needs to keep the call page open until processing finishes. Otherwise, your host can upload consented audio below."
            />
          )}
          {meetings.error && (
            <ErrorState
              error={meetings.error}
              retry={() => void meetings.refetch()}
            />
          )}{" "}
          {isHost && (
            <details className="mt-6">
              <summary className="cursor-pointer">
                {summary
                  ? "Replace insights using an audio file"
                  : "Recover insights using an audio file"}
              </summary>
              {summary && (
                <p className="field-hint">
                  Uploading another recording replaces this meeting’s saved
                  summary and transcript. It does not add to them.
                </p>
              )}
              <AudioUpload
                code={code}
                onSummary={(s) => {
                  setGenerated(s);
                  void query.refetch();
                }}
              />
            </details>
          )}
        </div>
        <aside className="qa-panel">
          <h2>
            <Sparkles />A little more clarity.
          </h2>
          <p>
            Ask a question about this meeting’s saved context. This conversation
            stays in this session only.
          </p>
          <div className="chat-messages" aria-live="polite">
            {messages.length ? (
              messages.map((m, i) => (
                <div key={i} className={`chat-message ${m.role}`}>
                  <strong>{m.role === "question" ? "YOU" : "HEYMINT"}</strong>
                  <p>{m.text}</p>
                </div>
              ))
            ) : (
              <div className="chat-message">
                <strong>YOUR NEXT GOOD QUESTION</strong>
                <p>What would you like to take away from this conversation?</p>
              </div>
            )}
            {pending && <Pending>Finding your answer</Pending>}
          </div>
          {chatError && (
            <div role="alert">
              <p className="form-error">{chatError}</p>
              <Button
                variant="link"
                disabled={pending}
                onClick={() => void ask(lastQuestion)}
              >
                Retry question
              </Button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(question);
            }}
          >
            <label className="sr-only" htmlFor="question">
              Question about this meeting
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={8000}
              placeholder="Ask about this conversation…"
              disabled={pending || (!summary && !query.data)}
            />
            <Button
              type="submit"
              disabled={pending || !question.trim() || !summary}
            >
              {pending ? <Pending /> : <Send />}Ask HeyMint
            </Button>
          </form>
        </aside>
      </div>
    </>
  );
}

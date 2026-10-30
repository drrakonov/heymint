import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ChatSource {
    id: string;
    kind: "summary" | "transcript";
    label: string;
    excerpt: string;
    speakers?: string[];
    startMs?: number;
    endMs?: number;
}

function timestamp(ms: number) {
    const seconds = Math.max(0, Math.floor(ms / 1000));
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
        .map(value => String(value).padStart(2, "0")).join(":");
}

export default function ChatAnswer({ text, sources = [] }: { text: string; sources?: ChatSource[] }) {
    return <div>
        <div className="chat-markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                allowedElements={["p", "br", "strong", "em", "del", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code", "hr", "table", "thead", "tbody", "tr", "th", "td", "a"]}
                components={{
                    // AI-generated destinations are not trusted navigation or image sources.
                    a: ({ children }) => <span>{children}</span>,
                    table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
                }}
            >{text}</ReactMarkdown>
        </div>
        {sources.length > 0 && <div className="mt-4 space-y-2 border-t border-white/10 pt-3" aria-label="Answer sources">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Sources</p>
            {sources.map(source => source.kind === "summary"
                ? <p key={source.id} className="text-xs text-text-secondary">Meeting summary</p>
                : <details key={source.id} className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">
                    <summary className="cursor-pointer text-xs leading-5 text-text-secondary marker:text-primary">
                        <span className="text-text-primary">{source.speakers?.length ? source.speakers.join(", ") : source.label}</span>
                        {typeof source.startMs === "number" && <span className="ml-2 text-primary" title="Time from the first transcribed speech in this meeting">{timestamp(source.startMs)}{typeof source.endMs === "number" && `–${timestamp(source.endMs)}`}</span>}
                    </summary>
                    <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words border-l-2 border-primary/30 pl-3 text-xs leading-6 text-text-secondary">{source.excerpt}</p>
                </details>)}
        </div>}
    </div>;
}

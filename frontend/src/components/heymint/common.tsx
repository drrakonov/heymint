import { Link } from "@/lib/router";
import {
  ArrowUpRight,
  Video,
  Loader2,
  RefreshCw,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="HeyMint home">
      <span className="brand-mark" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <span>
          HeyMint<span className="brand-dot">.</span>
        </span>
      )}
    </Link>
  );
}
export function Avatar({ name, size = "" }: { name: string; size?: string }) {
  return (
    <span className={`avatar ${size}`} aria-label={name}>
      {name
        .split(/[\s@]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
        .toUpperCase() || "H"}
    </span>
  );
}
export function Pending({ children }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="size-4 animate-spin" />
      {children}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
export function Skeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-grid" role="status" aria-label="Loading">
      <span className="sr-only">Loading your data…</span>
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
          <div className="skeleton-line medium" />
        </div>
      ))}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle className="size-5 shrink-0" />
      <div>
        <h3>Let’s try that again.</h3>
        <p>{errorMessage(error)}</p>
        {retry && (
          <Button variant="outline" className="mt-4" onClick={retry}>
            <RefreshCw />
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-art" aria-hidden>
        <span />
        <Video />
        <span />
      </div>
      <p className="eyebrow">ROOM FOR SOMETHING GREAT</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
export function NewMeetingButton() {
  return (
    <Button asChild>
      <Link to="/dashboard/addmeeting">
        <Video />
        New meeting
        <ArrowUpRight />
      </Link>
    </Button>
  );
}
export function CopyButton({
  value,
  label = "Copy link",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error("Copy failed. Select and copy the text manually.");
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  );
}
export function StartLink({
  children = "Get started",
}: {
  children?: ReactNode;
}) {
  return (
    <Button asChild size="lg">
      <Link to="/auth/signup">
        {children}
        <ArrowRight />
      </Link>
    </Button>
  );
}

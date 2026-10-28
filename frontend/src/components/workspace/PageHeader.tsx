import type { ReactNode } from "react";

export default function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="workspace-page-header">
    <div className="min-w-0"><p className="eyebrow">{eyebrow}</p><h1 className="page-heading mt-3">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">{description}</p></div>
    {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
  </header>;
}

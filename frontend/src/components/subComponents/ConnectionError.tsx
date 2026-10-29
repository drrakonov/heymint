export default function ConnectionError({ message, onRetry, onExit }: {
  message: string; onRetry?: () => void; onExit: () => void;
}) {
  return <div className="mint-app-bg flex min-h-dvh items-center justify-center p-6 text-text-primary">
    <div role="alert" className="workspace-panel w-full max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold">Let’s get you connected.</h1>
      <p className="mt-4 text-sm leading-6 text-text-secondary">{message}</p>
      <div className="mt-6 flex justify-center gap-3">
        {onRetry && <button className="mint-button rounded-xl px-5 py-3" onClick={onRetry}>Try again</button>}
        <button className="glass-control rounded-xl px-5 py-3" onClick={onExit}>Go back</button>
      </div>
    </div>
  </div>;
}

import { cn } from "@/lib/utils";

export default function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/heymint-logo.svg"
      alt="HeyMint"
      width={816}
      height={338}
      className={cn("block h-auto w-28 shrink-0", className)}
      draggable={false}
    />
  );
}

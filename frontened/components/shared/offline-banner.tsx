// components/shared/offline-banner.tsx
import { WifiOff } from "lucide-react";

export function OfflineBanner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-2xl bg-warning-tint px-4 py-3 text-sm font-medium text-warning ${className ?? ""}`}
    >
      <WifiOff aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p>You are offline. Some actions are paused until you reconnect.</p>
    </div>
  );
}

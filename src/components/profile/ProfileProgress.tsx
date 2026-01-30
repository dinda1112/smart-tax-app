type Props = {
    percent: number; // 0..100
    label?: string;
  };
  
  export function ProfileProgress({ percent, label = "Profile completion" }: Props) {
    const safe = Math.max(0, Math.min(100, Math.round(percent)));
  
    return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors theme-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">{label}</div>
        <div className="text-xs font-semibold text-[var(--text-primary)]">{safe}%</div>
      </div>

      <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--surface-elevated)]">
        <div
          className="h-1.5 rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${safe}%` }}
          aria-label={`${safe}% completed`}
        />
      </div>
    </div>
    );
  }
  
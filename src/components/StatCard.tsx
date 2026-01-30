type Props = {
    label: string;
    value: string;
    hint?: string;
  };
  
  export function StatCard({ label, value, hint }: Props) {
    return (
      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors theme-shadow">
        <div className="text-xs font-medium text-[var(--text-secondary)]">{label}</div>
        <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{value}</div>
        {hint ? <div className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</div> : null}
      </div>
    );
  }
  
import { Badge } from "@/components/ui/badge";

type Props = {
    title: string;
    subtitle?: string;
    required?: boolean;
    children: React.ReactNode;
  };
  
  export function SectionCard({ title, subtitle, required, children }: Props) {
    return (
      <section className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors theme-shadow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-[var(--text-primary)]">{title}</h2>
              {required ? (
                <Badge variant="required" size="sm">
                  Required
                </Badge>
              ) : null}
            </div>
            {subtitle ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
          </div>
        </div>
  
        <div className="mt-4">{children}</div>
      </section>
    );
  }
  
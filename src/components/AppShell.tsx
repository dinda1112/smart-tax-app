import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { PageTransition } from "./PageTransition";

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)] transition-colors">
      <TopNav />

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 pt-6" style={{ paddingBottom: 'var(--bottom-nav-safe-spacing)' }}>
        <PageTransition>
          {(title || subtitle) && (
            <div className="mb-6">
              {title ? <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{title}</h1> : null}
              {subtitle ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
            </div>
          )}

          {children}
        </PageTransition>
      </main>

      <BottomNav />
    </div>
  );
}

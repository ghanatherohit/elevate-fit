/** Matches DashboardShell chrome so route loading looks like the real page frame. */
export default function LoadingShell({
  children,
  showBack = true,
}: {
  children: React.ReactNode;
  showBack?: boolean;
}) {
  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:px-10">
        {showBack ? (
          <div className="sticky top-4 z-30">
            <div className="skeleton-shimmer h-8 w-[4.5rem] rounded-xl" />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

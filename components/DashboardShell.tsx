type DashboardShellProps = {
  children: React.ReactNode;
};

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 pb-28 pt-6">
        {children}
      </div>
    </div>
  );
}

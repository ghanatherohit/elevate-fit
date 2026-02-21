type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`glass-card rounded-3xl p-4 text-foreground ${className}`}
    >
      {children}
    </div>
  );
}


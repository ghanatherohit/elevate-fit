type ActionButtonProps = {
  label: string;
  note?: string;
};

export default function ActionButton({ label, note }: ActionButtonProps) {
  return (
    <button className="flex w-full items-center justify-between rounded-2xl bg-[color:var(--accent)]/15 px-4 py-3 text-left text-sm font-semibold text-[color:var(--accent)]">
      <span>{label}</span>
      {note ? (
        <span className="text-xs font-medium text-[color:var(--muted)]">
          {note}
        </span>
      ) : null}
    </button>
  );
}

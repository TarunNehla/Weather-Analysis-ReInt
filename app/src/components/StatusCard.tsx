type StatusCardProps = {
  title: string;
  message: string;
};

export function StatusCard({ title, message }: StatusCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.22)]">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
    </div>
  );
}

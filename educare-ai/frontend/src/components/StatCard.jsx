export default function StatCard({ title, value, subtitle, accent = 'border-l-primary-500' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-l-4 ${accent}`}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

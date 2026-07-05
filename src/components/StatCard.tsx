interface StatCardProps {
  label: string
  value: number
  unit?: string
  accent: string
  active?: boolean
  onClick?: () => void
}

export default function StatCard({ label, value, unit = '건', accent, active, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className={`mt-3 text-4xl font-bold ${accent}`}>
        {value}
        <span className="ml-1 text-lg font-medium text-slate-400">{unit}</span>
      </span>
      <span className="mt-2 text-xs font-medium text-slate-400">{active ? '현황 접기 ▲' : '현황 보기 ▼'}</span>
    </button>
  )
}

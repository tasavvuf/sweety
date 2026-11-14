export default function StatCard({ label, value, unit }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
			<p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-slate-900">
				{value ?? '—'}{value !== null && value !== undefined && unit ? ` ${unit}` : ''}
			</p>
		</div>
	);
}

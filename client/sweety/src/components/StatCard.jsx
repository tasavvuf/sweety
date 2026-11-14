export default function StatCard({ label, value, unit }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4">
			<p className="text-sm text-slate-600">{label}</p>
			<p className="mt-1 text-2xl font-semibold text-slate-900">
				{value ?? '—'}{value !== null && value !== undefined && unit ? ` ${unit}` : ''}
			</p>
		</div>
	);
}

export default function StatCard({ label, value, unit }) {
	return (
		<div className="rounded-lg border border-[#32322F] bg-[#242422] p-4">
			<p className="text-xs font-medium uppercase tracking-wide text-[#8E8E8A]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#E4E4E2]">
				{value ?? '—'}{value !== null && value !== undefined && unit ? ` ${unit}` : ''}
			</p>
		</div>
	);
}

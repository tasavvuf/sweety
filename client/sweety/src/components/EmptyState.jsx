export default function EmptyState({ message = 'No readings for this date.' }) {
	return <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">{message}</p>;
}

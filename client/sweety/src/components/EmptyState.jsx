export default function EmptyState({ message = 'No readings for this date.' }) {
	return <p className="rounded-lg border border-dashed border-[#32322F] bg-[#1A1A19] p-6 text-center text-sm text-[#8E8E8A]">{message}</p>;
}

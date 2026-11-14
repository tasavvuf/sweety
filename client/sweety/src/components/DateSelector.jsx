export default function DateSelector({ value, onChange }) {
	return (
		<label className="block rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 shadow-sm">
			Report date
			<input
				className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-700 focus:outline-none"
				type="date"
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
			<span className="mt-1 block text-xs font-normal text-slate-500">Reports update for this date.</span>
		</label>
	);
}

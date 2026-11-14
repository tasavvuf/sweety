export default function DateSelector({ value, onChange }) {
	return (
		<label className="block text-sm font-medium text-slate-700">
			Report date
			<input
				className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-700 focus:outline-none"
				type="date"
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</label>
	);
}

export default function ReadingCard({ reading, onEdit, onDelete, deleting }) {
	return (
		<li className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
			<div>
				<p className="font-medium text-slate-900">{reading.slot}</p>
				<p className="text-sm text-slate-600">{reading.value_mg_dl} mg/dL</p>
			</div>
			<div className="flex gap-2">
				<button onClick={() => onEdit(reading)} className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit</button>
				<button onClick={() => onDelete(reading.id)} disabled={deleting} className="cursor-pointer rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400">
					{deleting ? 'Deleting...' : 'Delete'}
				</button>
			</div>
		</li>
	);
}

import { useState } from 'react';

const slots = ['Morning', 'After breakfast', 'After lunch', 'After dinner'];

export default function ReadingForm({ reading, date, onSave, onCancel }) {
	const [form, setForm] = useState({
		reading_date: reading?.reading_date || date,
		slot: reading?.slot || 'Morning',
		value_mg_dl: reading?.value_mg_dl ?? '',
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	function updateField(event) {
		setForm({ ...form, [event.target.name]: event.target.value });
	}

	async function handleSubmit(event) {
		event.preventDefault();
		const value = Number(form.value_mg_dl);

		if (!form.reading_date || !Number.isInteger(value) || value < 40 || value > 600) {
			setError('Enter a date and a whole number from 40 to 600.');
			return;
		}

		setLoading(true);
		setError('');
		try {
			await onSave({ ...form, value_mg_dl: value });
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
			<h2 className="font-semibold text-slate-900">{reading ? 'Edit reading' : 'Add reading'}</h2>
			<div className="grid gap-3 sm:grid-cols-3">
				<label className="text-sm font-medium text-slate-700">
					Date
					<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="reading_date" type="date" value={form.reading_date} onChange={updateField} />
				</label>
				<label className="text-sm font-medium text-slate-700">
					Slot
					<select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="slot" value={form.slot} onChange={updateField}>
						{slots.map((slot) => <option key={slot}>{slot}</option>)}
					</select>
				</label>
				<label className="text-sm font-medium text-slate-700">
					mg/dL
					<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="value_mg_dl" type="number" min="40" max="600" step="1" value={form.value_mg_dl} onChange={updateField} />
				</label>
			</div>

			{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
			<div className="flex gap-2">
				<button disabled={loading} className="cursor-pointer rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400">
					{loading ? 'Saving...' : reading ? 'Save changes' : 'Add reading'}
				</button>
				{reading && <button type="button" onClick={onCancel} className="cursor-pointer rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>}
			</div>
		</form>
	);
}

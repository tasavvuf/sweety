import { useState } from 'react';
import { toast } from 'react-toastify';

const slots = ['Morning', 'After breakfast', 'After lunch', 'After dinner'];

function todayAsCalendarDate() {
	const date = new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

export default function ReadingForm({ reading, date, onSave, onCancel }) {
	const [form, setForm] = useState({
		reading_date: reading?.reading_date || date,
		slot: reading?.slot || 'Morning',
		value_mg_dl: reading?.value_mg_dl ?? '',
	});
	const [loading, setLoading] = useState(false);

	function updateField(event) {
		setForm({ ...form, [event.target.name]: event.target.value });
	}

	async function handleSubmit(event) {
		event.preventDefault();
		if (!form.reading_date) {
			toast.error('Select a reading date.');
			return;
		}
		if (form.reading_date > todayAsCalendarDate()) {
			toast.error('Reading date cannot be in the future.');
			return;
		}
		if (!slots.includes(form.slot)) {
			toast.error('Choose a valid reading slot.');
			return;
		}
		if (form.value_mg_dl === '') {
			toast.error('Enter a glucose value in mg/dL.');
			return;
		}

		const value = Number(form.value_mg_dl);
		if (!Number.isFinite(value) || !Number.isInteger(value)) {
			toast.error('Glucose value must be a whole number.');
			return;
		}
		if (value < 40) {
			toast.error('Glucose value must be at least 40 mg/dL.');
			return;
		}
		if (value > 600) {
			toast.error('Glucose value cannot be more than 600 mg/dL.');
			return;
		}

		setLoading(true);
		try {
			await onSave({ ...form, value_mg_dl: value });
		} catch (requestError) {
			toast.error(requestError.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<form noValidate onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[#32322F] bg-[#1A1A19] p-5">
			<div>
				<h2 className="font-semibold text-[#E4E4E2]">{reading ? 'Edit reading' : 'Add reading'}</h2>
				<p className="mt-1 text-sm text-[#8E8E8A]">Record one glucose value for a date and time slot.</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-3">
				<label className="text-sm font-medium text-[#E4E4E2]">
					Date
					<input className="mt-1 w-full select-text rounded-md border border-[#32322F] bg-[#242422] px-3 py-2 text-[#E4E4E2] [color-scheme:dark] focus:border-[#B8C764] focus:outline-none" name="reading_date" type="date" value={form.reading_date} onChange={updateField} />
				</label>
				<label className="text-sm font-medium text-[#E4E4E2]">
					Slot
					<select className="mt-1 w-full select-text rounded-md border border-[#32322F] bg-[#242422] px-3 py-2 text-[#E4E4E2] [color-scheme:dark] focus:border-[#B8C764] focus:outline-none" name="slot" value={form.slot} onChange={updateField}>
						{slots.map((slot) => <option key={slot}>{slot}</option>)}
					</select>
				</label>
				<label className="text-sm font-medium text-[#E4E4E2]">
					mg/dL
					<input className="mt-1 w-full select-text rounded-md border border-[#32322F] bg-[#242422] px-3 py-2 text-[#E4E4E2] [color-scheme:dark] focus:border-[#B8C764] focus:outline-none" name="value_mg_dl" type="number" min="40" max="600" step="1" value={form.value_mg_dl} onChange={updateField} />
				</label>
			</div>

			<div className="flex gap-2">
				<button disabled={loading} className="cursor-pointer rounded-md bg-[#B8C764] px-4 py-2 text-sm font-medium text-[#121211] hover:bg-[#9A948C] disabled:cursor-not-allowed disabled:bg-[#32322F] disabled:text-[#8E8E8A]">
					{loading ? 'Saving...' : reading ? 'Save changes' : 'Add reading'}
				</button>
				{reading && <button type="button" onClick={onCancel} className="cursor-pointer rounded-md border border-[#32322F] px-4 py-2 text-sm font-medium text-[#E4E4E2] hover:border-[#9A948C]">Cancel</button>}
			</div>
		</form>
	);
}

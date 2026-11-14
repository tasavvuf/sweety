import { useCallback, useEffect, useState } from 'react';
import DateSelector from '../components/DateSelector';
import EmptyState from '../components/EmptyState';
import Navbar from '../components/Navbar';
import ReadingCard from '../components/ReadingCard';
import ReadingForm from '../components/ReadingForm';
import StatCard from '../components/StatCard';
import { api } from '../services/api';

function today() {
	const date = new Date();
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function Summary({ title, report }) {
	return (
		<section>
			<h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<StatCard label="Highest" value={report?.highest} unit="mg/dL" />
				<StatCard label="Lowest" value={report?.lowest} unit="mg/dL" />
				<StatCard label="Average" value={report?.average} unit="mg/dL" />
				<StatCard label="Readings" value={report?.total_readings} />
			</div>
			{report?.total_readings === 0 && <p className="mt-3 text-sm text-slate-600">No readings in this period.</p>}
		</section>
	);
}

export default function DashboardPage() {
	const [date, setDate] = useState(today);
	const [reports, setReports] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [editing, setEditing] = useState(null);
	const [deletingId, setDeletingId] = useState(null);

	const loadReports = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const [daily, monthToDate, previousMonth] = await Promise.all([
				api.getDailyReport(date),
				api.getMonthToDateReport(date),
				api.getPreviousMonthReport(date),
			]);
			setReports({ daily, monthToDate, previousMonth });
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}, [date]);

	useEffect(() => {
		loadReports();
	}, [loadReports]);

	async function saveReading(reading) {
		if (editing) await api.updateReading(editing.id, reading);
		else await api.createReading(reading);

		setSuccess(editing ? 'Reading updated.' : 'Reading added.');
		setEditing(null);
		if (reading.reading_date !== date) setDate(reading.reading_date);
		else await loadReports();
	}

	async function deleteReading(id) {
		setDeletingId(id);
		setError('');
		try {
			await api.deleteReading(id);
			setSuccess('Reading deleted.');
			await loadReports();
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setDeletingId(null);
		}
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<Navbar />
			<main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold text-slate-900">Glucose dashboard</h1>
						<p className="mt-1 text-sm text-slate-600">View and manage readings by date.</p>
					</div>
					<DateSelector value={date} onChange={setDate} />
				</div>

				{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
				{success && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</p>}

				<ReadingForm key={editing?.id ?? `new-${date}`} reading={editing} date={date} onSave={saveReading} onCancel={() => setEditing(null)} />

				{loading ? <p className="text-slate-600">Loading reports...</p> : <>
					<Summary title="Daily report" report={reports?.daily} />
					<section>
						<h2 className="mb-3 text-lg font-semibold text-slate-900">Readings</h2>
						{reports?.daily?.readings?.length ? (
							<ul className="space-y-3">
								{reports.daily.readings.map((reading) => <ReadingCard key={reading.id} reading={reading} onEdit={setEditing} onDelete={deleteReading} deleting={deletingId === reading.id} />)}
							</ul>
						) : <EmptyState />}
					</section>
					<Summary title="Month to date" report={reports?.monthToDate} />
					<Summary title="Previous month" report={reports?.previousMonth} />
				</>}
			</main>
		</div>
	);
}

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DateSelector from '../components/DateSelector';
import EmptyState from '../components/EmptyState';
import Navbar from '../components/Navbar';
import ReadingCard from '../components/ReadingCard';
import ReadingForm from '../components/ReadingForm';
import StatCard from '../components/StatCard';
import { api } from '../services/api';

const AnalyticsCharts = lazy(() => import('../components/AnalyticsCharts'));

function today() {
	const date = new Date();
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toLocalDate(value) {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(year, month - 1, day);
}

function formatDate(value) {
	return toLocalDate(value).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function formatRange(from, to) {
	return `From ${formatDate(from)} to ${formatDate(to)}`;
}

function reportPeriods(date) {
	const selected = toLocalDate(date);
	const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
	const previousMonthStart = new Date(selected.getFullYear(), selected.getMonth() - 1, 1);
	const previousMonthEnd = new Date(selected.getFullYear(), selected.getMonth(), 0);
	const asValue = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

	return {
		daily: `Selected date: ${formatDate(date)}`,
		monthToDate: formatRange(asValue(monthStart), date),
		previousMonth: formatRange(asValue(previousMonthStart), asValue(previousMonthEnd)),
	};
}

function Summary({ title, period, report }) {
	return (
		<section className="rounded-xl border border-[#32322F] bg-[#1A1A19] p-5">
			<div className="mb-4">
				<h2 className="text-lg font-semibold text-[#E4E4E2]">{title}</h2>
				<p className="mt-1 text-sm text-[#8E8E8A]">{period}</p>
			</div>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<StatCard label="Highest" value={report?.highest} unit="mg/dL" />
				<StatCard label="Lowest" value={report?.lowest} unit="mg/dL" />
				<StatCard label="Average" value={report?.average} unit="mg/dL" />
				<StatCard label="Readings" value={report?.total_readings} />
			</div>
			{report?.total_readings === 0 && <p className="mt-3 text-sm text-[#8E8E8A]">No readings in this period.</p>}
		</section>
	);
}

export default function DashboardPage() {
	const [date, setDate] = useState(today);
	const [reports, setReports] = useState(null);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(null);
	const [deletingId, setDeletingId] = useState(null);

	const loadReports = useCallback(async () => {
		setLoading(true);
		try {
			const [daily, monthToDate, previousMonth] = await Promise.all([
				api.getDailyReport(date),
				api.getMonthToDateReport(date),
				api.getPreviousMonthReport(date),
			]);
			setReports({ daily, monthToDate, previousMonth });
		} catch (requestError) {
			toast.error(requestError.message);
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

		toast.success(editing ? 'Reading updated.' : 'Reading added.');
		setEditing(null);
		if (reading.reading_date !== date) setDate(reading.reading_date);
		else await loadReports();
	}

	async function deleteReading(id) {
		setDeletingId(id);
		try {
			await api.deleteReading(id);
			toast.success('Reading deleted.');
			await loadReports();
		} catch (requestError) {
			toast.error(requestError.message);
		} finally {
			setDeletingId(null);
		}
	}

	return (
		<div className="min-h-screen select-none bg-[#121211]">
			<Navbar />
			<main className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:py-8">
				<div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-[#32322F] bg-[#1A1A19] p-5 sm:p-6">
					<div>
						<p className="text-sm font-medium text-[#B8C764]">Glucose tracking</p>
						<h1 className="mt-1 text-2xl font-semibold text-[#E4E4E2]">Your glucose dashboard</h1>
						<p className="mt-2 text-sm text-[#8E8E8A]">Manage readings and compare clear daily and monthly ranges.</p>
					</div>
					<DateSelector value={date} onChange={setDate} />
				</div>
				<ReadingForm key={editing?.id ?? `new-${date}`} reading={editing} date={date} onSave={saveReading} onCancel={() => setEditing(null)} />

				{loading ? <p className="text-[#8E8E8A]">Loading reports...</p> : <>
					<Summary title="Daily report" period={reportPeriods(date).daily} report={reports?.daily} />
					<section className="rounded-xl border border-[#32322F] bg-[#1A1A19] p-5">
						<div className="mb-4">
							<h2 className="text-lg font-semibold text-[#E4E4E2]">Readings for {formatDate(date)}</h2>
							<p className="mt-1 text-sm text-[#8E8E8A]">Each slot can have one reading.</p>
						</div>
						{reports?.daily?.readings?.length ? (
							<ul className="space-y-3">
								{reports.daily.readings.map((reading) => <ReadingCard key={reading.id} reading={reading} onEdit={setEditing} onDelete={deleteReading} deleting={deletingId === reading.id} />)}
							</ul>
						) : <EmptyState />}
					</section>
					<Summary title="Month to date" period={reportPeriods(date).monthToDate} report={reports?.monthToDate} />
					<Summary title="Previous month" period={reportPeriods(date).previousMonth} report={reports?.previousMonth} />
					<Suspense fallback={<p className="text-[#8E8E8A]">Loading analytics...</p>}>
						<AnalyticsCharts date={date} />
					</Suspense>
				</>}
			</main>
		</div>
	);
}

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../components/EmptyState';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

const slots = ['Morning', 'After breakfast', 'After lunch', 'After dinner'];
const fieldClassName = 'mt-1 w-full select-text rounded-md border border-[#32322F] bg-[#242422] px-3 py-2 text-[#E4E4E2] [color-scheme:dark] focus:border-[#B8C764] focus:outline-none';

export default function HistoryPage() {
	const [filters, setFilters] = useState({ slot: '', from: '', to: '', limit: 10 });
	const [page, setPage] = useState(1);
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	const loadReadings = useCallback(async () => {
		setLoading(true);
		try {
			const result = await api.getReadings({ ...filters, page });
			setData(result);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	}, [filters, page]);

	useEffect(() => {
		loadReadings();
	}, [loadReadings]);

	function updateFilter(event) {
		setFilters({ ...filters, [event.target.name]: event.target.value });
		setPage(1);
	}

	const pagination = data?.pagination;
	const firstRecord = pagination?.totalRecords ? ((pagination.currentPage - 1) * pagination.limit) + 1 : 0;
	const lastRecord = pagination?.totalRecords ? Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords) : 0;

	return (
		<div className="min-h-screen select-none bg-[#121211]">
			<Navbar />
			<main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
				<section className="rounded-xl border border-[#32322F] bg-[#1A1A19] p-5">
					<h1 className="text-2xl font-semibold text-[#E4E4E2]">Reading history</h1>
					<p className="mt-2 text-sm text-[#8E8E8A]">Browse a limited page of readings instead of loading your full history.</p>
					<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<label className="text-sm font-medium text-[#E4E4E2]">
							Slot
							<select className={fieldClassName} name="slot" value={filters.slot} onChange={updateFilter}>
								<option value="">All slots</option>
								{slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
							</select>
						</label>
						<label className="text-sm font-medium text-[#E4E4E2]">
							From
							<input className={fieldClassName} name="from" type="date" value={filters.from} onChange={updateFilter} />
						</label>
						<label className="text-sm font-medium text-[#E4E4E2]">
							To
							<input className={fieldClassName} name="to" type="date" value={filters.to} onChange={updateFilter} />
						</label>
						<label className="text-sm font-medium text-[#E4E4E2]">
							Per page
							<select className={fieldClassName} name="limit" value={filters.limit} onChange={updateFilter}>
								<option value="10">10</option>
								<option value="20">20</option>
								<option value="50">50</option>
							</select>
						</label>
					</div>
				</section>

				{loading ? <p className="text-[#8E8E8A]">Loading readings...</p> : data?.readings?.length ? (
					<section className="rounded-xl border border-[#32322F] bg-[#1A1A19] p-5">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<p className="text-sm text-[#8E8E8A]">Showing {firstRecord}–{lastRecord} of {pagination.totalRecords} readings</p>
							<div className="flex gap-2">
								<button onClick={() => setPage(page - 1)} disabled={!pagination.hasPreviousPage} className="cursor-pointer rounded-md border border-[#32322F] px-3 py-2 text-sm text-[#E4E4E2] hover:border-[#9A948C] disabled:cursor-not-allowed disabled:text-[#8E8E8A]">Previous</button>
								<button onClick={() => setPage(page + 1)} disabled={!pagination.hasNextPage} className="cursor-pointer rounded-md bg-[#B8C764] px-3 py-2 text-sm font-medium text-[#121211] hover:bg-[#9A948C] disabled:cursor-not-allowed disabled:bg-[#32322F] disabled:text-[#8E8E8A]">Next</button>
							</div>
						</div>
						<ul className="space-y-3">
							{data.readings.map((reading) => (
								<li key={reading.id} className="flex items-center justify-between gap-4 rounded-lg border border-[#32322F] bg-[#242422] p-4">
									<div>
										<p className="font-medium text-[#E4E4E2]">{reading.slot}</p>
										<p className="text-sm text-[#8E8E8A]">{reading.reading_date}</p>
									</div>
									<p className="font-semibold text-[#B8C764]">{reading.value_mg_dl} mg/dL</p>
								</li>
							))}
						</ul>
					</section>
				) : <>
					<EmptyState message="No readings match these filters." />
					{pagination?.hasPreviousPage && <button onClick={() => setPage(page - 1)} className="cursor-pointer rounded-md border border-[#32322F] px-3 py-2 text-sm text-[#E4E4E2] hover:border-[#9A948C]">Previous page</button>}
				</>}
			</main>
		</div>
	);
}

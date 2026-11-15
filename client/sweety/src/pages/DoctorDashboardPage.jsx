import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

function today() {
	const date = new Date();
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value) {
	if (!value) return '—';
	const [year, month, day] = value.slice(0, 10).split('-').map(Number);
	return new Date(year, month - 1, day).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function formatValue(value) {
	if (value === null || value === undefined) return '—';
	return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function Metric({ label, value, unit }) {
	return (
		<div className="border-l-2 border-[#B8C764] bg-[#1A1A19] px-4 py-4 sm:px-5">
			<p className="text-xs font-medium uppercase tracking-wide text-[#8E8E8A]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#E4E4E2]">
				{formatValue(value)}{value !== null && value !== undefined && unit ? <span className="ml-1 text-sm font-normal text-[#8E8E8A]">{unit}</span> : null}
			</p>
		</div>
	);
}

function ReportSection({ title, period, report }) {
	return (
		<section className="border-t border-[#32322F] pt-5">
			<div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
				<h3 className="font-semibold text-[#E4E4E2]">{title}</h3>
				<p className="text-sm text-[#8E8E8A]">{period}</p>
			</div>
			<div className="grid grid-cols-2 gap-px overflow-hidden border border-[#32322F] bg-[#32322F] sm:grid-cols-4">
				<Metric label="Average" value={report?.average} unit="mg/dL" />
				<Metric label="Highest" value={report?.highest} unit="mg/dL" />
				<Metric label="Lowest" value={report?.lowest} unit="mg/dL" />
				<Metric label="Readings" value={report?.total_readings} />
			</div>
			{report?.total_readings === 0 && <p className="mt-3 text-sm text-[#8E8E8A]">No readings in this period.</p>}
		</section>
	);
}

export default function DoctorDashboardPage() {
	const [patients, setPatients] = useState([]);
	const [selectedPatientId, setSelectedPatientId] = useState('');
	const [date, setDate] = useState(today);
	const [reports, setReports] = useState(null);
	const [readings, setReadings] = useState([]);
	const [loadingPatients, setLoadingPatients] = useState(true);
	const [loadingRecords, setLoadingRecords] = useState(true);

	const acceptedPatients = useMemo(() => patients.filter((patient) => patient.status === 'accepted'), [patients]);
	const pendingPatients = useMemo(() => patients.filter((patient) => patient.status === 'pending'), [patients]);
	const selectedPatient = acceptedPatients.find((patient) => patient.patient_id === selectedPatientId);

	useEffect(() => {
		let active = true;
		api.getDoctorPatients()
			.then(({ patients: result = [] }) => {
				if (!active) return;
				setPatients(result);
				const firstAccepted = result.find((patient) => patient.status === 'accepted');
				if (firstAccepted) setSelectedPatientId((current) => current || firstAccepted.patient_id);
			})
			.catch((error) => {
				if (active) toast.error(error.message);
			})
			.finally(() => {
				if (active) setLoadingPatients(false);
			});
		return () => { active = false; };
	}, []);

	useEffect(() => {
		if (!selectedPatientId || !acceptedPatients.some((patient) => patient.patient_id === selectedPatientId)) {
			return undefined;
		}

		let active = true;
		Promise.all([
			api.getDoctorPatientReports(selectedPatientId, date),
			api.getDoctorPatientReadings(selectedPatientId),
		]).then(([reportData, readingData]) => {
			if (!active) return;
			setReports(reportData);
			setReadings(readingData.readings ?? []);
		}).catch((error) => {
			if (active) {
				setReports(null);
				setReadings([]);
				toast.error(error.message);
			}
		}).finally(() => {
			if (active) setLoadingRecords(false);
		});
		return () => { active = false; };
	}, [acceptedPatients, date, selectedPatientId]);

	return (
		<div className="min-h-screen bg-[#121211] text-[#E4E4E2]">
			<Navbar />
			<main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
				<header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#32322F] pb-5">
					<div>
						<p className="text-sm font-medium text-[#B8C764]">Clinical overview</p>
						<h1 className="mt-1 text-2xl font-semibold">Patient reports</h1>
						<p className="mt-2 text-sm text-[#8E8E8A]">Review glucose readings for patients who have granted access.</p>
					</div>
					<div className="flex gap-5 text-sm">
						<p><span className="font-semibold text-[#E4E4E2]">{acceptedPatients.length}</span> <span className="text-[#8E8E8A]">active patients</span></p>
						<p><span className="font-semibold text-[#E4E4E2]">{pendingPatients.length}</span> <span className="text-[#8E8E8A]">pending</span></p>
					</div>
				</header>

				<div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
					<aside aria-label="Patient roster">
						<div className="flex items-center justify-between border-b border-[#32322F] pb-3">
							<h2 className="text-sm font-semibold uppercase tracking-wide text-[#8E8E8A]">Patient roster</h2>
							<span className="text-xs text-[#8E8E8A]">{acceptedPatients.length}</span>
						</div>
						{loadingPatients ? <p className="py-5 text-sm text-[#8E8E8A]">Loading patients...</p> : acceptedPatients.length ? (
							<ul className="divide-y divide-[#32322F]">
								{acceptedPatients.map((patient) => {
									const selected = patient.patient_id === selectedPatientId;
									return (
										<li key={patient.id}>
											<button
												type="button"
												onClick={() => {
												setLoadingRecords(true);
												setSelectedPatientId(patient.patient_id);
											}}
												aria-pressed={selected}
												className={`w-full cursor-pointer border-l-2 px-3 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8C764] ${selected ? 'border-[#B8C764] bg-[#1A1A19]' : 'border-transparent hover:bg-[#1A1A19]'}`}
											>
												<span className="block font-medium">{patient.patient_name}</span>
												<span className="mt-1 block truncate text-sm text-[#8E8E8A]">{patient.patient_email}</span>
											</button>
										</li>
									);
								})}
							</ul>
						) : <p className="py-5 text-sm leading-6 text-[#8E8E8A]">No patients have accepted access yet.</p>}

						{pendingPatients.length > 0 && <section className="mt-7 border-t border-[#32322F] pt-4">
							<h3 className="text-xs font-semibold uppercase tracking-wide text-[#8E8E8A]">Awaiting approval</h3>
							<ul className="mt-2 divide-y divide-[#32322F]">
								{pendingPatients.map((patient) => <li key={patient.id} className="py-3">
									<p className="text-sm font-medium text-[#E4E4E2]">{patient.patient_name}</p>
									<p className="mt-1 text-xs text-[#8E8E8A]">Request sent {formatDate(patient.created_at)}</p>
								</li>)}
							</ul>
						</section>}
					</aside>

					<section className="min-w-0" aria-live="polite">
						{selectedPatient ? <>
							<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
								<div>
									<p className="text-sm text-[#8E8E8A]">Patient</p>
									<h2 className="mt-1 text-xl font-semibold">{selectedPatient.patient_name}</h2>
									<p className="mt-1 text-sm text-[#8E8E8A]">{selectedPatient.patient_email}</p>
								</div>
								<label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-[#8E8E8A]">
									Report date
									<input type="date" value={date} max={today()} onChange={(event) => {
										setLoadingRecords(true);
										setDate(event.target.value || today());
									}} className="min-h-11 rounded-md border border-[#32322F] bg-[#1A1A19] px-3 text-sm font-normal normal-case tracking-normal text-[#E4E4E2] focus-visible:outline-2 focus-visible:outline-[#B8C764]" />
								</label>
							</div>

							{loadingRecords ? <p className="py-8 text-sm text-[#8E8E8A]">Loading patient records...</p> : reports ? <div className="space-y-6">
								<ReportSection title="Daily summary" period={formatDate(date)} report={reports.daily} />
								<ReportSection title="Month to date" period={`Through ${formatDate(date)}`} report={reports.month_to_date} />
								<ReportSection title="Previous month" period="Full calendar month" report={reports.previous_month} />
								<section className="border-t border-[#32322F] pt-5">
									<div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
										<h3 className="font-semibold">Recent readings</h3>
										<p className="text-sm text-[#8E8E8A]">Latest {readings.length} records</p>
									</div>
									{readings.length ? <div className="overflow-x-auto border-y border-[#32322F]">
										<table className="w-full min-w-[420px] text-left text-sm">
											<thead className="text-xs uppercase tracking-wide text-[#8E8E8A]">
												<tr><th className="py-3 pr-4 font-medium">Date</th><th className="py-3 pr-4 font-medium">Time slot</th><th className="py-3 text-right font-medium">Glucose</th></tr>
											</thead>
											<tbody className="divide-y divide-[#32322F]">
												{readings.map((reading) => <tr key={reading.id}>
													<td className="py-3 pr-4 text-[#8E8E8A]">{formatDate(reading.reading_date)}</td>
													<td className="py-3 pr-4">{reading.slot}</td>
													<td className="py-3 text-right font-medium">{formatValue(reading.value_mg_dl)} <span className="text-[#8E8E8A]">mg/dL</span></td>
												</tr>)}
											</tbody>
										</table>
									</div> : <p className="border-y border-[#32322F] py-6 text-sm text-[#8E8E8A]">No readings are available for this patient.</p>}
								</section>
							</div> : <p className="py-8 text-sm text-[#8E8E8A]">Patient records could not be loaded.</p>}
						</> : <div className="border-y border-[#32322F] py-10">
							<p className="font-medium text-[#E4E4E2]">No report selected</p>
							<p className="mt-2 max-w-lg text-sm leading-6 text-[#8E8E8A]">Reports become available here after a patient accepts your access request.</p>
						</div>}
					</section>
				</div>
			</main>
		</div>
	);
}
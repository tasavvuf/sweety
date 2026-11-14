import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import EmptyState from './EmptyState';
import { api } from '../services/api';

const chartAxis = { fill: '#8E8E8A', fontSize: 12 };

function monthStart(date) {
	const [year, month] = date.split('-').map(Number);
	return `${year}-${String(month).padStart(2, '0')}-01`;
}

function shortDate(value) {
	const [year, month, day] = value.slice(0, 10).split('-').map(Number);
	return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ChartTooltip({ active, payload, label }) {
	if (!active || !payload?.length) return null;

	return (
		<div className="rounded-md border border-[#32322F] bg-[#242422] px-3 py-2 text-sm text-[#E4E4E2]">
			<p>{label}</p>
			<p className="mt-1 text-[#B8C764]">{payload[0].value} {payload[0].name === 'Readings' ? 'readings' : 'mg/dL'}</p>
		</div>
	);
}

function ChartCard({ title, description, children, empty }) {
	return (
		<section className="rounded-xl border border-[#32322F] bg-[#1A1A19] p-5">
			<h2 className="text-lg font-semibold text-[#E4E4E2]">{title}</h2>
			<p className="mt-1 text-sm text-[#8E8E8A]">{description}</p>
			<div className="mt-5 h-60">{empty ? <EmptyState message="No readings for this chart." /> : children}</div>
		</section>
	);
}

export default function AnalyticsCharts({ date }) {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadAnalytics() {
			setLoading(true);
			try {
				const [daily, monthly, distribution] = await Promise.all([
					api.getDailyAnalytics(date),
					api.getMonthlyAnalytics(date),
					api.getDistributionAnalytics(monthStart(date), date),
				]);
				setData({ daily: daily.readings, monthly: monthly.readings, distribution: distribution.distribution });
			} catch (error) {
				toast.error(error.message);
			} finally {
				setLoading(false);
			}
		}

		loadAnalytics();
	}, [date]);

	if (loading) return <p className="text-[#8E8E8A]">Loading analytics...</p>;

	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-xl font-semibold text-[#E4E4E2]">Health analytics</h2>
				<p className="mt-1 text-sm text-[#8E8E8A]">Charts use all readings in their selected period, not the paginated history list.</p>
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<ChartCard title="Daily glucose trend" description="Readings across the selected day." empty={!data?.daily?.length}>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data?.daily} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
							<CartesianGrid stroke="#32322F" strokeDasharray="3 3" />
							<XAxis dataKey="slot" tick={chartAxis} interval={0} />
							<YAxis tick={chartAxis} />
							<Tooltip content={<ChartTooltip />} />
							<Line type="monotone" dataKey="value" name="Glucose" stroke="#B8C764" strokeWidth={2} dot={{ fill: '#B8C764' }} />
						</LineChart>
					</ResponsiveContainer>
				</ChartCard>

				<ChartCard title="Monthly glucose trend" description="Average glucose for each day this month." empty={!data?.monthly?.length}>
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={data?.monthly} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
							<CartesianGrid stroke="#32322F" strokeDasharray="3 3" />
							<XAxis dataKey="reading_date" tickFormatter={shortDate} tick={chartAxis} />
							<YAxis tick={chartAxis} />
							<Tooltip content={<ChartTooltip />} labelFormatter={shortDate} />
							<Area type="monotone" dataKey="average" name="Average" stroke="#B8C764" fill="#B8C764" fillOpacity={0.2} strokeWidth={2} />
						</AreaChart>
					</ResponsiveContainer>
				</ChartCard>
			</div>

			<ChartCard title="Reading distribution" description="Month-to-date reading counts by visualization range." empty={!data?.distribution?.some((item) => item.total > 0)}>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data?.distribution} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
						<CartesianGrid stroke="#32322F" strokeDasharray="3 3" />
						<XAxis dataKey="label" tick={chartAxis} />
						<YAxis allowDecimals={false} tick={chartAxis} />
						<Tooltip content={<ChartTooltip />} />
						<Bar dataKey="total" name="Readings" fill="#B8C764" radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</ChartCard>
			<p className="text-xs text-[#8E8E8A]">Ranges are visualization buckets, not universal clinical diagnostic categories. Targets depend on timing and clinician guidance.</p>
		</section>
	);
}

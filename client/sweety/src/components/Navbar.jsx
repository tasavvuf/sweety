import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
	const { user, logout } = useAuth();
	const [loading, setLoading] = useState(false);

	async function handleLogout() {
		setLoading(true);
		try {
			await logout();
		} finally {
			setLoading(false);
		}
	}

	return (
		<header className="border-b border-slate-200 bg-white">
			<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
				<div>
					<p className="font-semibold text-slate-900">Sweety</p>
					<p className="text-sm text-slate-600">{user?.name || user?.email}</p>
				</div>
				<button onClick={handleLogout} disabled={loading} className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400">
					{loading ? 'Logging out...' : 'Log out'}
				</button>
			</div>
		</header>
	);
}

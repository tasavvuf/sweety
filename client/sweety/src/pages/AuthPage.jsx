import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputClassName = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-700 focus:outline-none';

export default function AuthPage({ mode }) {
	const isRegister = mode === 'register';
	const { user, login, register } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	if (user) return <Navigate to="/dashboard" replace />;

	function updateField(event) {
		setForm({ ...form, [event.target.name]: event.target.value });
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError('');

		if (isRegister && !form.name.trim()) {
			setError('Name is required');
			return;
		}
		if (!form.email || !form.password) {
			setError('Email and password are required');
			return;
		}
		if (form.password.length < 8) {
			setError('Password must be at least 8 characters');
			return;
		}

		setLoading(true);
		try {
			if (isRegister) await register(form);
			else await login({ email: form.email, password: form.password });
			navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-md items-center px-4">
			<form onSubmit={handleSubmit} className="w-full space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">{isRegister ? 'Create account' : 'Welcome back'}</h1>
					<p className="mt-1 text-sm text-slate-600">Track your glucose readings.</p>
				</div>

				{isRegister && (
					<label className="block text-sm font-medium text-slate-700">
						Name
						<input className={inputClassName} name="name" value={form.name} onChange={updateField} autoComplete="name" />
					</label>
				)}

				<label className="block text-sm font-medium text-slate-700">
					Email
					<input className={inputClassName} name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" />
				</label>

				<label className="block text-sm font-medium text-slate-700">
					Password
					<input className={inputClassName} name="password" type="password" value={form.password} onChange={updateField} autoComplete={isRegister ? 'new-password' : 'current-password'} />
				</label>

				{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

				<button disabled={loading} className="w-full cursor-pointer rounded-md bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400">
					{loading ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
				</button>

				<p className="text-center text-sm text-slate-600">
					{isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
					<Link className="font-medium text-sky-700 hover:underline" to={isRegister ? '/login' : '/register'}>
						{isRegister ? 'Log in' : 'Register'}
					</Link>
				</p>
			</form>
		</main>
	);
}

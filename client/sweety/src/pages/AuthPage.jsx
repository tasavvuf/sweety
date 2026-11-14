import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputClassName = 'mt-1 w-full select-text rounded-md border border-[#32322F] bg-[#1A1A19] px-3 py-2 text-[#E4E4E2] [color-scheme:dark] focus:border-[#B8C764] focus:outline-none';

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
		<main className="flex min-h-screen select-none items-center bg-[#121211] px-4 text-[#E4E4E2]">
			<form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4 rounded-lg border border-[#32322F] bg-[#1A1A19] p-6">
				<div>
					<h1 className="text-2xl font-semibold text-[#E4E4E2]">{isRegister ? 'Create account' : 'Welcome back'}</h1>
					<p className="mt-1 text-sm text-[#8E8E8A]">Track your glucose readings.</p>
				</div>

				{isRegister && (
					<label className="block text-sm font-medium text-[#E4E4E2]">
						Name
						<input className={inputClassName} name="name" value={form.name} onChange={updateField} autoComplete="name" />
					</label>
				)}

				<label className="block text-sm font-medium text-[#E4E4E2]">
					Email
					<input className={inputClassName} name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" />
				</label>

				<label className="block text-sm font-medium text-[#E4E4E2]">
					Password
					<input className={inputClassName} name="password" type="password" value={form.password} onChange={updateField} autoComplete={isRegister ? 'new-password' : 'current-password'} />
				</label>

				{error && <p role="alert" className="rounded-md border border-[#9A948C] bg-[#242422] p-3 text-sm text-[#E4E4E2]">{error}</p>}

				<button disabled={loading} className="w-full cursor-pointer rounded-md bg-[#B8C764] px-4 py-2 font-medium text-[#121211] hover:bg-[#9A948C] disabled:cursor-not-allowed disabled:bg-[#32322F] disabled:text-[#8E8E8A]">
					{loading ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
				</button>

				<p className="text-center text-sm text-[#8E8E8A]">
					{isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
					<Link className="font-medium text-[#B8C764] hover:text-[#E4E4E2] hover:underline" to={isRegister ? '/login' : '/register'}>
						{isRegister ? 'Log in' : 'Register'}
					</Link>
				</p>
			</form>
		</main>
	);
}

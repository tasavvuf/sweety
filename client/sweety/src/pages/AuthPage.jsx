import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputClassName = 'mt-1 w-full select-text rounded-md border border-[#32322F] bg-[#1A1A19] px-3 py-2 text-[#E4E4E2] [color-scheme:dark] focus:border-[#B8C764] focus:outline-none';

export default function AuthPage({ mode }) {
	const [searchParams] = useSearchParams();
	const portal = searchParams.get('portal') === 'doctor' ? 'doctor' : 'patient';
	const isRegister = mode === 'register' && portal === 'patient';
	const { user, login, register } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	if (mode === 'register' && portal === 'doctor') return <Navigate to="/login?portal=doctor" replace />;
	if (user) return <Navigate to={user.role === 'doctor' ? '/doctor' : '/dashboard'} replace />;

	function selectPortal(nextPortal) {
		setError('');
		navigate(nextPortal === 'doctor' ? '/login?portal=doctor' : '/login');
	}

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
			else await login({ email: form.email, password: form.password }, portal);
			const home = portal === 'doctor' ? '/doctor' : '/dashboard';
			navigate(location.state?.from?.pathname || home, { replace: true });
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="flex min-h-screen select-none items-center bg-[#121211] px-4 text-[#E4E4E2]">
			<form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4 rounded-lg border border-[#32322F] bg-[#1A1A19] p-6">
				<div className="grid grid-cols-2 border-b border-[#32322F]" role="group" aria-label="Choose sign-in portal">
					<button type="button" onClick={() => selectPortal('patient')} aria-pressed={portal === 'patient'} className={`min-h-11 cursor-pointer border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#B8C764] ${portal === 'patient' ? 'border-[#B8C764] text-[#E4E4E2]' : 'border-transparent text-[#8E8E8A] hover:text-[#E4E4E2]'}`}>
						Patient
					</button>
					<button type="button" onClick={() => selectPortal('doctor')} aria-pressed={portal === 'doctor'} className={`min-h-11 cursor-pointer border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#B8C764] ${portal === 'doctor' ? 'border-[#B8C764] text-[#E4E4E2]' : 'border-transparent text-[#8E8E8A] hover:text-[#E4E4E2]'}`}>
						Doctor
					</button>
				</div>

				<div>
					<h1 className="text-2xl font-semibold text-[#E4E4E2]">{isRegister ? 'Create patient account' : portal === 'doctor' ? 'Doctor sign in' : 'Patient sign in'}</h1>
					<p className="mt-1 text-sm text-[#8E8E8A]">{portal === 'doctor' ? 'Sign in with your assigned clinic account.' : 'Track your glucose readings.'}</p>
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

				{portal === 'patient' ? <p className="text-center text-sm text-[#8E8E8A]">
					{isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
					<Link className="font-medium text-[#B8C764] hover:text-[#E4E4E2] hover:underline" to={isRegister ? '/login' : '/register'}>
						{isRegister ? 'Log in' : 'Register'}
					</Link>
				</p> : null}
			</form>
		</main>
	);
}

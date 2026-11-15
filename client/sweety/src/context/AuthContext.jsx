import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.getCurrentUser()
			.then(({ user: currentUser }) => setUser(currentUser))
			.catch(() => setUser(null))
			.finally(() => setLoading(false));
	}, []);

	async function login(details, expectedRole) {
		const response = await api.login(details);
		if (expectedRole && response.user.role !== expectedRole) {
			await api.logout().catch(() => {});
			throw new Error(expectedRole === 'doctor'
				? 'This account is not a doctor account. Choose patient sign-in.'
				: 'This account is not a patient account. Choose doctor sign-in.');
		}
		setUser(response.user);
	}

	async function register(details) {
		const response = await api.register(details);
		setUser(response.user);
	}

	async function logout() {
		await api.logout();
		setUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}

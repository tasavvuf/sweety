import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) return <p className="min-h-screen bg-[#121211] p-6 text-[#8E8E8A]">Loading...</p>;
	if (!user) return <Navigate to={role === 'doctor' ? '/login?portal=doctor' : '/login'} state={{ from: location }} replace />;
	if (role && user.role !== role) {
		if (user.role === 'doctor') return <Navigate to="/doctor" replace />;
		if (user.role === 'patient') return <Navigate to="/dashboard" replace />;
		return <p className="min-h-screen bg-[#121211] p-6 text-[#8E8E8A]">This account role does not have a dashboard.</p>;
	}

	return children;
}

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) return <p className="min-h-screen bg-[#121211] p-6 text-[#8E8E8A]">Loading...</p>;
	if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

	return children;
}

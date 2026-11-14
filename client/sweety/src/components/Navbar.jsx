import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    <header className="border-b border-[#32322F] bg-[#1A1A19]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="font-semibold text-[#E4E4E2]">Sweety</p>
          <p className="text-sm text-[#8E8E8A]">{user?.name || user?.email}</p>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium">
          <nav className="flex gap-3" aria-label="Main navigation">
            <NavLink className={({ isActive }) => isActive ? "text-[#B8C764]" : "text-[#8E8E8A] hover:text-[#E4E4E2]"} to="/dashboard">Dashboard</NavLink>
            <NavLink className={({ isActive }) => isActive ? "text-[#B8C764]" : "text-[#8E8E8A] hover:text-[#E4E4E2]"} to="/history">History</NavLink>
          </nav>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="cursor-pointer rounded-md border border-[#32322F] px-3 py-2 text-sm font-medium text-[#E4E4E2] hover:border-[#9A948C] hover:text-[#B8C764] disabled:cursor-not-allowed disabled:text-[#8E8E8A]"
          >
            {loading ? "Logging out..." : "Log out"}
          </button>
        </div>
      </div>
    </header>
  );
}

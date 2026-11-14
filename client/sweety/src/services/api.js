const apiUrl = import.meta.env.VITE_API_URL ?? "";

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = data.errors?.map((error) => error.message).join(" ");
    throw new Error(details || data.message || "Something went wrong");
  }

  return data;
}

export const api = {
  register: (details) =>
    request("/api/auth/reg", { method: "POST", body: JSON.stringify(details) }),
  login: (details) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(details),
    }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  getCurrentUser: () => request("/api/auth/me"),
  getDailyReport: (date) => request(`/api/reports/daily?date=${date}`),
  getMonthToDateReport: (date) =>
    request(`/api/reports/month-to-date?date=${date}`),
  getPreviousMonthReport: (date) =>
    request(`/api/reports/previous-month?date=${date}`),
  createReading: (reading) =>
    request("/api/readings", { method: "POST", body: JSON.stringify(reading) }),
  updateReading: (id, reading) =>
    request(`/api/readings/${id}`, {
      method: "PUT",
      body: JSON.stringify(reading),
    }),
  deleteReading: (id) => request(`/api/readings/${id}`, { method: "DELETE" }),
};

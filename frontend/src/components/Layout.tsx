import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", testId: "dashboard" },
  { to: "/users", label: "Users", testId: "users" },
  { to: "/groups", label: "Groups", testId: "groups" },
  { to: "/transactions", label: "Transactions", testId: "transactions" },
  { to: "/alerts", label: "Alerts", testId: "alerts" },
  { to: "/review-cases", label: "Review Cases", testId: "review-cases" },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-6 lg:block">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-trust">TrustGraph</p>
          <h1 className="mt-3 text-2xl font-bold text-ink">Risk Console</h1>
        </div>
        <nav className="mt-10 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`desktop-nav-${item.testId}`}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-semibold ${
                  isActive ? "bg-blue-50 text-trust" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <div className="border-b border-slate-200 bg-white px-6 py-4 lg:hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-trust">TrustGraph</p>
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={`mobile-nav-${item.testId}`}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                    isActive ? "bg-blue-50 text-trust" : "bg-slate-100 text-slate-600"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

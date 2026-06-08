import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/portal', label: 'Tổng quan', end: true },
  { to: '/portal/courses', label: 'Khóa học của tôi' },
  { to: '/portal/assignments', label: 'Bài tập' },
  { to: '/portal/progress', label: 'Tiến độ học tập' },
  { to: '/portal/prediction', label: 'Kết quả dự đoán' },
  { to: '/portal/suggestions', label: 'Gợi ý học tập' },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-emerald-700">EduCare AI – Cổng sinh viên</h1>
          <p className="text-sm text-slate-500">{user?.fullName}</p>
        </div>
        <button type="button" onClick={() => { logout(); navigate('/login'); }} className="rounded-lg border px-4 py-2 text-sm">
          Đăng xuất
        </button>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 p-6">
        <aside className="w-52 shrink-0">
          <nav className="space-y-1 rounded-xl border bg-white p-3 shadow-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm ${
                    isActive ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

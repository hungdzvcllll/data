import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/classes', label: 'Lớp học' },
  { to: '/upload', label: 'Upload dữ liệu' },
  { to: '/students', label: 'Danh sách rủi ro' },
  { to: '/interventions', label: 'Can thiệp' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar text-white">
        <div className="border-b border-slate-700 px-6 py-5">
          <h1 className="text-lg font-bold text-emerald-400">EduCare AI</h1>
          <p className="text-xs text-slate-400">Learning Risk & Intervention</p>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2.5 text-sm transition ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-slate-700 p-4">
          <p className="truncate text-sm font-medium">{user?.fullName}</p>
          <p className="text-xs text-slate-400">{user?.role}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <header className="border-b border-slate-200 bg-white px-8 py-4">
          <h2 className="text-xl font-semibold text-slate-800">EduCare AI Platform</h2>
          <p className="text-sm text-slate-500">Hệ thống cảnh báo sớm & hỗ trợ can thiệp học tập</p>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

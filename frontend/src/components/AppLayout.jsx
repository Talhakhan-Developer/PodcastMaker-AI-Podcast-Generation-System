import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Headphones,
  Mic,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Podcast,
  Loader2,
  Circle,
  Home,
} from 'lucide-react';

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/podcasts/new', icon: PlusCircle, label: 'New Podcast' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState({ podcasts: 0, episodes: 0 });
  const [podcasts, setPodcasts] = useState([]);
  const [podcastsLoading, setPodcastsLoading] = useState(true);

  const loadPodcasts = () => {
    api.listPodcasts().then((p) => {
      setPodcasts(p);
      setStats({
        podcasts: p.length,
        episodes: p.reduce((acc, pod) => acc + (pod.episodes?.length || 0), 0),
      });
    }).catch(() => {}).finally(() => setPodcastsLoading(false));
  };

  useEffect(() => { loadPodcasts(); }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside
        className={`
          ${collapsed ? 'w-[68px]' : 'w-64'}
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          text-white flex flex-col shrink-0
          transition-all duration-200 ease-in-out
          border-r border-white/5
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Headphones className="w-4.5 h-4.5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-[15px] tracking-tight text-white">PodcastMaker</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Stats */}
        {!collapsed && (
          <div className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Mic className="w-3 h-3 text-accent" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Shows</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.podcasts}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 className="w-3 h-3 text-teal-400" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Episodes</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.episodes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-6">
          <div>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Menu
              </p>
            )}
            <div className="space-y-0.5">
              {navLinks.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-accent/20 text-white shadow-sm shadow-accent/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Podcasts list */}
          {!collapsed && podcasts.length > 0 && (
            <div>
              <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Recent
              </p>
              <div className="space-y-0.5">
                {podcastsLoading ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                  </div>
                ) : (
                  podcasts.slice(0, 8).map((podcast) => (
                    <NavLink
                      key={podcast.id}
                      to={`/podcasts/${podcast.id}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                          isActive
                            ? 'bg-accent/20 text-white font-medium'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                        }`
                      }
                    >
                      <Circle
                        className={`w-1.5 h-1.5 shrink-0 ${
                          podcast.status === 'ready' ? 'bg-success'
                            : podcast.status === 'generating' ? 'bg-warning'
                            : podcast.status === 'failed' ? 'bg-error'
                            : 'bg-slate-600'
                        }`}
                        fill="currentColor"
                      />
                      <span className="truncate">{podcast.title}</span>
                      {podcast.status === 'generating' && (
                        <Loader2 className="w-3 h-3 animate-spin shrink-0 ml-auto" />
                      )}
                    </NavLink>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Back to site */}
          {!collapsed && (
            <div className="pt-4 border-t border-white/[0.06]">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.06] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`
                }
              >
                <Home className="w-[18px] h-[18px] shrink-0" />
                Back to Site
              </NavLink>
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-white/10">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          {collapsed && (
            <button
              onClick={handleLogout}
              className="w-full mt-2 p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/[0.06] transition-colors flex justify-center"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

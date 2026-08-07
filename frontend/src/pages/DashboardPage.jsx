import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  PlusCircle,
  Podcast,
  Clock,
  ArrowRight,
  Trash2,
  Loader2,
  Mic,
  BarChart3,
  Sparkles,
  Zap,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

const statusColors = {
  draft: { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-500', label: 'Draft' },
  generating: { dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', label: 'Generating' },
  ready: { dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Ready' },
  failed: { dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-600', label: 'Failed' },
};

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="p-5 bg-white border border-border rounded-2xl hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
        <span className="text-xs font-medium text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function PodcastCard({ podcast, onDelete }) {
  const st = statusColors[podcast.status] || statusColors.draft;

  return (
    <Link
      to={`/podcasts/${podcast.id}`}
      className="group block p-5 bg-white border border-border rounded-2xl hover:border-accent/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
          <Podcast className="w-5.5 h-5.5 text-blue-600" />
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(podcast.id);
            }}
            className="p-1.5 text-muted/30 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-ink mb-1 truncate group-hover:text-accent transition-colors">
        {podcast.title}
      </h3>

      {podcast.description && (
        <p className="text-sm text-muted line-clamp-2 mb-3">{podcast.description}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <span className="flex items-center gap-1.5 text-xs text-muted/70">
          <Clock className="w-3 h-3" />
          {new Date(podcast.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <ArrowRight className="w-4 h-4 text-muted/30 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.listPodcasts().then(setPodcasts).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this podcast and all its episodes?')) return;
    await api.deletePodcast(id);
    setPodcasts((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = podcasts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.topic && p.topic.toLowerCase().includes(search.toLowerCase()))
  );

  const readyCount = podcasts.filter((p) => p.status === 'ready').length;
  const generatingCount = podcasts.filter((p) => p.status === 'generating').length;
  const episodeCount = podcasts.reduce((acc, p) => acc + (p.episodes?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">
            Welcome back, {user?.username || 'there'}
          </h1>
          <p className="text-muted mt-1.5">
            {podcasts.length === 0
              ? 'Create your first AI-powered podcast'
              : `You have ${podcasts.length} podcast${podcasts.length !== 1 ? 's' : ''} with ${episodeCount} episode${episodeCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          to="/podcasts/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          New Podcast
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Podcast} label="Total Shows" value={podcasts.length} color="text-accent" bgColor="bg-accent/10" />
        <StatCard icon={Mic} label="Episodes" value={episodeCount} color="text-teal-500" bgColor="bg-teal-500/10" />
        <StatCard icon={Zap} label="Ready" value={readyCount} color="text-emerald-500" bgColor="bg-emerald-500/10" />
      </div>

      {/* Podcast list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Your Podcasts</h2>
          {podcasts.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/50" />
                <input
                  type="text"
                  placeholder="Search podcasts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all w-56"
                />
              </div>
            </div>
          )}
        </div>

        {podcasts.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-border rounded-2xl bg-white">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">Create your first podcast</h3>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Give it a topic and our AI will generate a full podcast episode with natural-sounding voices.
            </p>
            <Link
              to="/podcasts/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Create Podcast
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-border">
            <p className="text-muted">No podcasts match "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Generating notice */}
      {generatingCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
          <p className="text-sm text-amber-700">
            {generatingCount} podcast{generatingCount !== 1 ? 's are' : ' is'} generating...
          </p>
        </div>
      )}
    </div>
  );
}

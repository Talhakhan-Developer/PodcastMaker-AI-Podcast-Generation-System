import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Play, Mic, Users, Volume2 } from 'lucide-react';

function Waveform() {
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 1, 0.7, 0.4, 0.9, 0.6, 0.8, 1, 0.5, 0.7, 0.9, 0.6, 0.4, 0.8];
  return (
    <div className="flex items-end gap-[3px] h-12">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-blue-400 to-teal-400"
          style={{
            height: `${h * 100}%`,
            animationDelay: `${i * 0.05}s`,
            animation: 'pulse 2s ease-in-out infinite alternate',
          }}
        />
      ))}
    </div>
  );
}

function FloatingCard({ icon: Icon, label, value, className, delay }) {
  return (
    <div
      className={`absolute bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-[11px] text-white/50 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-full mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered podcast creation
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.08]">
              Your ideas,{' '}
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-teal-400 bg-clip-text text-transparent">
                their voices
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-xl mb-10 leading-relaxed">
              Give us a topic. We generate a full podcast episode with natural AI voices,
              multi-speaker dialogue, and professional audio — in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                to="/register"
                className="group flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
              >
                Start creating — it's free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-2 px-6 py-3.5 text-slate-300 hover:text-white font-medium rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
              >
                <Play className="w-4 h-4" />
                See how it works
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-14 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5" />
                <span>ElevenLabs voices</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                <span>Multi-speaker dialogue</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>Groq-powered</span>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative hidden lg:block">
            {/* Mockup card */}
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              {/* Header bar */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                <div className="ml-auto text-xs text-white/30 font-mono">PodcastMaker</div>
              </div>

              {/* Waveform visual */}
              <div className="bg-white/[0.02] rounded-2xl p-6 mb-5 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Why Cats Are Great Pets</p>
                    <p className="text-xs text-white/40">2 min · 2 speakers</p>
                  </div>
                  <div className="ml-auto">
                    <Waveform />
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-500 to-teal-400 h-1.5 rounded-full w-[35%]" />
                </div>
              </div>

              {/* Speaker turns */}
              <div className="space-y-3">
                {[
                  { name: 'Alex', text: "Hey Jordan, welcome to the show!", color: 'from-blue-500 to-blue-600' },
                  { name: 'Jordan', text: "Thanks! Excited to talk about this.", color: 'from-teal-500 to-teal-600' },
                ].map((turn) => (
                  <div key={turn.name} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${turn.color} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                      {turn.name[0]}
                    </div>
                    <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2">
                      <p className="text-[11px] text-white/40 font-medium mb-0.5">{turn.name}</p>
                      <p className="text-sm text-white/80">{turn.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <FloatingCard icon={Mic} label="Voice" value="George · Host" className="animate-float -top-4 -right-4" delay={0} />
            <FloatingCard icon={Users} label="Speakers" value="2 active" className="animate-float bottom-8 -left-8" delay={1} />
          </div>
        </div>
      </div>
    </section>
  );
}

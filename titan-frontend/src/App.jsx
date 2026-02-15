import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Activity,
  Smile,
  Frown,
  Meh,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function App() {
  const [text, setText] = useState(
    "The concept of artificial intelligence has moved from the realm of science fiction to a tangible reality.",
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const analyze = async () => {
    const payload = (text ?? "").trim();
    if (!payload) {
      setData(null);
      setErr("Paste some text first.");
      return;
    }

    setLoading(true);
    setErr("");
    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payload }),
      });

      const result = await res.json();

      if (!res.ok || result?.error) {
        setData(null);
        setErr(result?.error || `API error (${res.status})`);
        return;
      }

      setData(result);
    } catch (e) {
      setData(null);
      setErr("Couldn’t reach the backend. Is FastAPI running on :8000?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSentimentConfig = (label) => {
    switch ((label || "").toUpperCase()) {
      case "POSITIVE":
        return {
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          icon: <Smile size={28} />,
          ring: "border-emerald-500",
        };
      case "NEGATIVE":
        return {
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          border: "border-rose-500/30",
          icon: <Frown size={28} />,
          ring: "border-rose-500",
        };
      case "NEUTRAL":
        return {
          color: "text-orange-500",
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          icon: <Meh size={28} />,
          ring: "border-orange-500",
        };
      default:
        return {
          color: "text-blue-400/60",
          bg: "bg-blue-400/5",
          border: "border-blue-400/10",
          icon: <Activity size={28} className="animate-pulse" />,
          ring: "border-blue-400/20",
        };
    }
  };

  const sentiment = getSentimentConfig(data?.stats?.sentiment);

  const freq = data?.freq_data ?? [];
  const maxCount = useMemo(
    () => Math.max(...freq.map((x) => x.count), 1),
    [freq],
  );

  const tokens = data?.token_stream ?? [];

  const lexical = Number(data?.stats?.lexical_diversity ?? 0);

  return (
    <div className="flex h-screen w-full bg-bg-dark text-slate-300 p-6 lg:p-10 gap-8 overflow-hidden font-medium">
      <main className="flex-1 flex flex-col gap-8 min-w-0">
        {/* Header */}
        <header className="flex justify-between items-end flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-1">
              LuminaNLP / Core Engine
            </p>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              Project Titan{" "}
              <span className="text-accent-blue/60 italic">v2.1</span>
            </h1>
          </div>

          <div className="bg-card-dark px-4 py-2 rounded-lg border border-border text-xs flex items-center gap-3 font-black uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-200">System Live</span>
          </div>
        </header>

        {/* Error */}
        {err ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-xl px-4 py-3 text-sm">
            {err}
          </div>
        ) : null}

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
          {/* Input Section */}
          <section className="col-span-7 bg-card-dark rounded-2xl border border-border p-8 flex flex-col shadow-2xl relative min-h-0">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-accent-blue shadow-[4px_0_20px_rgba(59,130,246,0.4)]"></div>

            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-slate-400">
                <FileText size={16} className="text-accent-blue" /> Input
                Channel
              </span>

              <button
                onClick={analyze}
                disabled={loading || !text.trim()}
                className="text-[10px] font-black bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5 transition-all flex items-center gap-2 uppercase tracking-widest active:scale-95 disabled:opacity-30"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  "Process Stream"
                )}
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none resize-none text-slate-100 leading-relaxed text-xl font-normal placeholder:opacity-20 custom-scrollbar overflow-y-auto"
              placeholder="Paste text here..."
            />

            <div className="mt-6 pt-6 border-t border-border/30 flex justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest flex-shrink-0">
              <div className="flex gap-6">
                <span>{data?.stats?.word_count ?? 0} Words</span>
                <span>{data?.stats?.char_count ?? 0} Chars</span>
              </div>

              <span
                className="cursor-pointer hover:text-white transition"
                onClick={() => {
                  setText("");
                  setData(null);
                  setErr("");
                }}
              >
                Purge Buffer
              </span>
            </div>
          </section>

          {/* Right Column */}
          <div className="col-span-5 flex flex-col gap-8 min-h-0">
            {/* Neural Weighting (FIXED) */}
            <div className="bg-card-dark rounded-2xl border border-border p-8 flex-1 min-h-0 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Neural Weighting
                </h3>
                <Activity size={16} className="text-accent-blue opacity-50" />
              </div>

              {/* definite height so percentage bars always render */}
              <div className="h-44 flex items-end gap-4">
                {freq.length === 0 ? (
                  <div className="text-xs text-slate-500">
                    No frequency data yet.
                  </div>
                ) : (
                  freq.map((item, i) => {
                    const pct = (item.count / maxCount) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 h-full flex flex-col items-center justify-end gap-3 group"
                      >
                        <div className="w-full h-full flex items-end">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600/10 to-accent-blue/60 rounded-t-lg shadow-[0_0_20px_rgba(59,130,246,0.18)] transition-all duration-700 ease-out group-hover:brightness-125"
                            style={{ height: `${pct}%` }}
                            title={`${item.word}: ${item.count}`}
                          />
                        </div>

                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate w-full text-center">
                          {item.word}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Token Stream */}
            <div className="bg-card-dark rounded-2xl border border-border p-8 flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Token Stream
                </h3>
                <div className="flex gap-4 text-[9px] font-black tracking-tighter">
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{" "}
                    VALID
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>{" "}
                    STOP
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-wrap gap-2 content-start pb-4">
                  {tokens.length === 0 ? (
                    <span className="text-xs text-slate-500">
                      No tokens yet.
                    </span>
                  ) : (
                    tokens.map((t, i) => (
                      <span
                        key={i}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                          t.is_stop
                            ? "border-rose-500/20 bg-rose-500/5 text-rose-500/40 line-through"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {t.text}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-3 gap-8 pb-4 flex-shrink-0">
          <StatCard
            label="Processing Vel."
            value={data?.stats?.processing_time ?? "0ms"}
            icon={<Zap size={18} />}
            sub="FAST"
          />

          <StatCard
            label="Lexical Complexity"
            value={(data?.stats?.lexical_diversity ?? 0).toString()}
            bar
            barValue={Number.isFinite(lexical) ? lexical : 0}
          />

          <div
            className={`rounded-2xl border ${sentiment.border} ${sentiment.bg} p-6 flex justify-between items-center transition-all duration-500 shadow-xl`}
          >
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">
                Sentiment
              </p>
              <h2
                className={`text-3xl font-black italic uppercase leading-tight truncate ${sentiment.color}`}
              >
                {data?.stats?.sentiment ?? "PENDING"}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold">
                Conf: {data?.stats?.confidence ?? "0%"}
              </p>
            </div>

            <div className="relative w-14 h-14 flex flex-shrink-0 items-center justify-center">
              <div className={`${sentiment.color} transition-all duration-500`}>
                {sentiment.icon}
              </div>
              <div
                className={`absolute inset-0 border-[3px] opacity-10 rounded-full ${sentiment.ring}`}
              ></div>
              <div
                className={`absolute inset-0 border-[3px] rounded-full border-t-transparent animate-spin-slow ${sentiment.ring}`}
              ></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, sub, bar, barValue = 0 }) {
  const widthPct = Math.max(0, Math.min(100, barValue * 100));

  return (
    <div className="bg-card-dark rounded-2xl border border-border p-6 flex flex-col justify-between shadow-xl">
      <div className="flex justify-between items-start">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
          {label}
        </p>
        <span className="text-slate-600 opacity-50">{icon}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-3xl font-black text-white tracking-tighter">
            {value}
          </h2>

          {sub && (
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded tracking-tighter uppercase">
              {sub}
            </span>
          )}
        </div>

        {bar && (
          <div className="w-full bg-white/5 h-1.5 mt-3 rounded-full overflow-hidden">
            <div
              className="bg-accent-blue h-full rounded-full transition-all duration-700"
              style={{ width: `${widthPct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

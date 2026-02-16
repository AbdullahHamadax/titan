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
    <div className="flex w-full h-screen gap-8 p-6 overflow-hidden font-medium bg-bg-dark text-slate-300 lg:p-10">
      <main className="flex flex-col flex-1 min-w-0 gap-8">
        {/* Header */}
        <header className="flex items-end justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-1">
              LuminaNLP / Core Engine
            </p>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              Project Titan{" "}
              <span className="italic text-accent-blue/60">v2.1</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 text-xs font-black tracking-widest uppercase border rounded-lg bg-card-dark border-border">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-200">System Live</span>
          </div>
        </header>

        {/* Error */}
        {err ? (
          <div className="px-4 py-3 text-sm border bg-rose-500/10 border-rose-500/20 text-rose-200 rounded-xl">
            {err}
          </div>
        ) : null}

        {/* Main Grid */}
        <div className="grid flex-1 min-h-0 grid-cols-12 gap-8">
          {/* Input Section */}
          <section className="relative flex flex-col min-h-0 col-span-7 p-8 border shadow-2xl bg-card-dark rounded-br-2xl rounded-tr-2xl border-border">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-accent-blue shadow-[4px_0_20px_rgba(59,130,246,0.4)]"></div>

            <div className="flex items-center justify-between flex-shrink-0 mb-6">
              <span className="flex items-center gap-3 text-xs font-black tracking-widest uppercase text-slate-400">
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
              className="flex-1 overflow-y-auto text-xl font-normal leading-relaxed bg-transparent border-none outline-none resize-none text-slate-100 placeholder:opacity-20 custom-scrollbar"
              placeholder="Paste text here..."
            />

            <div className="mt-6 pt-6 border-t border-border/30 flex justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest flex-shrink-0">
              <div className="flex gap-6">
                <span>{data?.stats?.word_count ?? 0} Words</span>
                <span>{data?.stats?.char_count ?? 0} Chars</span>
              </div>

              <span
                className="transition cursor-pointer hover:text-white"
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
          <div className="flex flex-col min-h-0 col-span-5 gap-8">
            {/* Neural Weighting (FIXED) */}
            <div className="flex flex-col flex-1 min-h-0 p-8 border bg-card-dark rounded-2xl border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black tracking-widest uppercase text-slate-400">
                  Neural Weighting
                </h3>
                <Activity size={16} className="opacity-50 text-accent-blue" />
              </div>

              {/* definite height so percentage bars always render */}
              <div className="flex items-end gap-4 h-44">
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
                        className="flex flex-col items-center justify-end flex-1 h-full gap-3 group"
                      >
                        <div className="flex items-end w-full h-full">
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
            <div className="flex flex-col flex-1 min-h-0 p-8 overflow-hidden border bg-card-dark rounded-2xl border-border">
              <div className="flex items-center justify-between flex-shrink-0 mb-6">
                <h3 className="text-xs font-black tracking-widest uppercase text-slate-400">
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

              <div className="flex-1 pr-2 overflow-y-auto custom-scrollbar">
                <div className="flex flex-wrap content-start gap-2 pb-4">
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
        <div className="grid flex-shrink-0 grid-cols-3 gap-8 pb-4">
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

            <div className="relative flex items-center justify-center flex-shrink-0 w-14 h-14">
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
    <div className="flex flex-col justify-between p-6 border shadow-xl bg-card-dark rounded-2xl border-border">
      <div className="flex items-start justify-between">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
          {label}
        </p>
        <span className="opacity-50 text-slate-600">{icon}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-3xl font-black tracking-tighter text-white">
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
              className="h-full transition-all duration-700 rounded-full bg-accent-blue"
              style={{ width: `${widthPct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

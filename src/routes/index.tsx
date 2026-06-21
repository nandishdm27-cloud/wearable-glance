import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Gamepad2,
  Heart,
  Footprints,
  Droplets,
  RefreshCw,
  Power,
  Send,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Bot,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseWatch — Smartwatch IoT Dashboard" },
      {
        name: "description",
        content:
          "Live smartwatch vitals, activity, alerts and an AI health companion in one dark, modern dashboard.",
      },
      { property: "og:title", content: "PulseWatch — Smartwatch IoT Dashboard" },
      {
        property: "og:description",
        content: "Real-time heart rate, SpO2, steps and AI insights for your wearable.",
      },
    ],
  }),
  component: Dashboard,
});

type WatchEvent = {
  id: string;
  event_type: "vitals" | "steps" | "game_score";
  heart_rate: number | null;
  spo2: number | null;
  steps: number | null;
  score: number | null;
  created_at: string;
};

type Latest = {
  heart_rate: number | null;
  spo2: number | null;
  steps: number | null;
  score: number | null;
  lastUpdated: string | null;
};

type Series = {
  vitals: WatchEvent[];
  steps: WatchEvent[];
};

async function fetchAll() {
  const [vitalsLatest, stepsLatest, scoreLatest, vitalsSeries, stepsSeries] = await Promise.all([
    supabase
      .from("watch_events")
      .select("*")
      .eq("event_type", "vitals")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("watch_events")
      .select("*")
      .eq("event_type", "steps")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("watch_events")
      .select("*")
      .eq("event_type", "game_score")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("watch_events")
      .select("*")
      .eq("event_type", "vitals")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("watch_events")
      .select("*")
      .eq("event_type", "steps")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const v = (vitalsLatest.data?.[0] as WatchEvent | undefined) ?? null;
  const s = (stepsLatest.data?.[0] as WatchEvent | undefined) ?? null;
  const g = (scoreLatest.data?.[0] as WatchEvent | undefined) ?? null;

  const latestTimestamps = [v?.created_at, s?.created_at, g?.created_at].filter(Boolean) as string[];
  const lastUpdated =
    latestTimestamps.length > 0
      ? latestTimestamps.sort().reverse()[0]
      : null;

  const latest: Latest = {
    heart_rate: v?.heart_rate ?? null,
    spo2: v?.spo2 ?? null,
    steps: s?.steps ?? null,
    score: g?.score ?? null,
    lastUpdated,
  };
  const series: Series = {
    vitals: ((vitalsSeries.data as WatchEvent[]) ?? []).slice().reverse(),
    steps: ((stepsSeries.data as WatchEvent[]) ?? []).slice().reverse(),
  };
  return { latest, series, error: vitalsLatest.error || stepsLatest.error || scoreLatest.error };
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit?: string;
  accent: string;
}) {
  return (
    <div className="glass fade-in rounded-2xl p-5 relative overflow-hidden">
      <div
        className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-40"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ background: `color-mix(in oklch, ${accent} 25%, transparent)` }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">
          {value ?? "—"}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

type Alert = { level: "critical" | "warning" | "normal"; title: string; detail: string };

function computeAlerts(l: Latest): Alert[] {
  const alerts: Alert[] = [];
  if (l.heart_rate != null && l.heart_rate > 100)
    alerts.push({ level: "critical", title: "High heart rate", detail: `${l.heart_rate} bpm — consider resting.` });
  if (l.heart_rate != null && l.heart_rate < 50)
    alerts.push({ level: "warning", title: "Low heart rate", detail: `${l.heart_rate} bpm — monitor closely.` });
  if (l.spo2 != null && l.spo2 < 95)
    alerts.push({ level: "critical", title: "Low oxygen level", detail: `SpO₂ ${l.spo2}% is below 95%.` });
  if (l.steps != null && l.steps < 500)
    alerts.push({ level: "warning", title: "Low activity", detail: `Only ${l.steps} steps so far today.` });
  if (alerts.length === 0)
    alerts.push({ level: "normal", title: "All systems normal", detail: "Vitals look healthy right now." });
  return alerts;
}

function buildInsight(l: Latest): string {
  const parts: string[] = [];
  if (l.heart_rate != null && l.heart_rate > 100) parts.push("Heart rate is slightly high — take rest ❤️");
  if (l.spo2 != null && l.spo2 < 95) parts.push("Oxygen level is low — monitor closely 🫁");
  if (l.steps != null && l.steps < 500) parts.push("Low activity today — consider a walk 🚶");
  if (parts.length === 0) return "Your vitals look normal 👍 Keep up the good work!";
  return parts.join(" · ");
}

function AlertCard({ a }: { a: Alert }) {
  const styles: Record<Alert["level"], string> = {
    critical: "border-destructive/40 bg-destructive/10 text-destructive-foreground",
    warning: "border-yellow-400/40 bg-yellow-400/10",
    normal: "border-emerald-400/40 bg-emerald-400/10",
  };
  const Icon = a.level === "normal" ? ShieldCheck : AlertTriangle;
  const iconColor =
    a.level === "critical"
      ? "text-destructive"
      : a.level === "warning"
        ? "text-yellow-300"
        : "text-emerald-300";
  return (
    <div className={`fade-in rounded-xl border px-4 py-3 flex items-start gap-3 ${styles[a.level]}`}>
      <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
      <div>
        <div className="text-sm font-semibold">{a.title}</div>
        <div className="text-xs text-muted-foreground">{a.detail}</div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const chartTooltip = {
  contentStyle: {
    background: "rgba(20,24,40,0.9)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
  },
  labelStyle: { color: "rgba(255,255,255,0.6)" },
};

function ChatPanel() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (e) => console.error("chat error", e),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const busy = status === "submitted" || status === "streaming";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
    inputRef.current?.focus();
  };

  const renderText = (m: UIMessage) =>
    m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null));

  return (
    <div className="glass-strong rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-semibold">Pulse AI</div>
          <div className="text-xs text-muted-foreground">Your smartwatch wellness companion</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-10 px-4">
            👋 Hi! Ask me about your heart rate, oxygen, activity, or how you're feeling today.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} fade-in`}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm bg-primary text-primary-foreground"
                  : "max-w-[90%] text-sm text-foreground/90 px-1"
              }
            >
              {renderText(m)}
            </div>
          </div>
        ))}
        {status === "submitted" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="p-3 border-t border-white/10 flex items-end gap-2"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
          rows={1}
          placeholder="Ask Pulse AI…"
          className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}

function Dashboard() {
  const [latest, setLatest] = useState<Latest>({
    heart_rate: null,
    spo2: null,
    steps: null,
    score: null,
    lastUpdated: null,
  });
  const [series, setSeries] = useState<Series>({ vitals: [], steps: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { latest, series, error } = await fetchAll();
      setLatest(latest);
      setSeries(series);
      setError(error ? error.message : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const alerts = useMemo(() => computeAlerts(latest), [latest]);
  const insight = useMemo(() => buildInsight(latest), [latest]);

  const vitalsData = series.vitals.map((e) => ({
    t: new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    hr: e.heart_rate,
    spo2: e.spo2,
  }));
  const stepsData = series.steps.map((e) => ({
    t: new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    steps: e.steps,
  }));

  return (
    <main className="min-h-screen px-4 md:px-8 py-6 md:py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/20 flex items-center justify-center glow-primary">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">PulseWatch</h1>
            <p className="text-xs text-muted-foreground">
              Live smartwatch telemetry · Last updated {formatTime(latest.lastUpdated)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`glass rounded-xl px-3 py-2 text-xs flex items-center gap-2 transition ${
              autoRefresh ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            Auto-refresh {autoRefresh ? "ON" : "OFF"}
          </button>
          <button
            onClick={refresh}
            className="glass rounded-xl px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          Failed to load data: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left two columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metric cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Heart className="h-5 w-5 text-rose-300" />}
              label="Heart Rate"
              value={latest.heart_rate}
              unit="bpm"
              accent="oklch(0.7 0.22 25)"
            />
            <MetricCard
              icon={<Droplets className="h-5 w-5 text-sky-300" />}
              label="SpO₂"
              value={latest.spo2}
              unit="%"
              accent="oklch(0.72 0.18 230)"
            />
            <MetricCard
              icon={<Footprints className="h-5 w-5 text-emerald-300" />}
              label="Steps"
              value={latest.steps}
              accent="oklch(0.7 0.2 150)"
            />
            <MetricCard
              icon={<Gamepad2 className="h-5 w-5 text-fuchsia-300" />}
              label="Game Score"
              value={latest.score}
              accent="oklch(0.65 0.22 320)"
            />
          </section>

          {/* Smart insight */}
          <section className="glass-strong glow-primary fade-in rounded-2xl p-5 flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Smart insight</div>
              <div className="text-base font-medium mt-0.5">
                {loading ? "Analyzing your latest readings…" : insight}
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="Heart Rate (bpm)">
              <AreaChart data={vitalsData} margin={{ left: -20, right: 6, top: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="hr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.22 25)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.72 0.22 25)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="hr" stroke="oklch(0.78 0.22 25)" strokeWidth={2} fill="url(#hr)" />
              </AreaChart>
            </ChartCard>

            <ChartCard title="SpO₂ (%)">
              <LineChart data={vitalsData} margin={{ left: -20, right: 6, top: 6, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} domain={[88, 100]} />
                <Tooltip {...chartTooltip} />
                <Line type="monotone" dataKey="spo2" stroke="oklch(0.78 0.18 230)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartCard>

            <div className="md:col-span-2">
              <ChartCard title="Steps">
                <BarChart data={stepsData} margin={{ left: -20, right: 6, top: 6, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="steps" fill="oklch(0.7 0.2 150)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartCard>
            </div>
          </section>

          {/* Alerts */}
          <section className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Health Alerts
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.map((a, i) => (
                <AlertCard key={i} a={a} />
              ))}
            </div>
          </section>
        </div>

        {/* Right column: chatbot */}
        <aside className="lg:h-[calc(100vh-7rem)] lg:sticky lg:top-6 h-[600px]">
          <ChatPanel />
        </aside>
      </div>
    </main>
  );
}

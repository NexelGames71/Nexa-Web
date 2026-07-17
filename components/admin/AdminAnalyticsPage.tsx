"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { account, identityConfigured, createSessionJwt } from "../../lib/nexa-identity";
import AdminMetricCard from "./AdminMetricCard";
import AdminPageHeader from "./AdminPageHeader";
import AdminPanel from "./AdminPanel";

type TrendPoint = {
  date: string;
  label: string;
  count: number;
};

type HourPoint = {
  hour: string;
  label: string;
  count: number;
};

type TopUser = {
  id: string;
  name: string;
  email: string;
  messageCount: number;
  conversationCount: number;
  lastActiveAt: string;
};

type RecentConversation = {
  id: string;
  title: string;
  userId: string;
  lastMessagePreview: string;
  updatedAt: string;
};

type AnalyticsPayload = {
  metrics: {
    totalUsers: number;
    totalConversations: number;
    totalMessages: number;
    avgMessagesPerConversation: number;
    activeUsers24h: number;
    weeklyActiveUsers: number;
  };
  daily: {
    conversations: TrendPoint[];
    messages: TrendPoint[];
    activeUsers: TrendPoint[];
  };
  hourlyMessages: HourPoint[];
  topUsers: TopUser[];
  recentConversations: RecentConversation[];
};

const LIVE_REFRESH_MS = 30000;

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatRelative(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "<1h ago";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function calculateDelta(current: number, previous: number) {
  if (!previous) {
    return 0;
  }
  return ((current - previous) / previous) * 100;
}

function useAnimatedNumber(value: number, duration = 700) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    let frame = 0;
    const startValue = previousValueRef.current;
    const diff = value - startValue;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + diff * eased);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        previousValueRef.current = value;
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, value]);

  return displayValue;
}

function AnimatedMetricValue({
  value,
  suffix = "",
  digits = 0,
}: {
  value: number;
  suffix?: string;
  digits?: number;
}) {
  const animatedValue = useAnimatedNumber(value);
  return <>{formatNumber(animatedValue, digits)}{suffix}</>;
}

function LiveBadge({ liveMode, nextRefreshIn }: { liveMode: boolean; nextRefreshIn: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-800">
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${liveMode ? "bg-emerald-500 admin-pulse-dot" : "bg-slate-400"}`} />
      {liveMode ? `Live refresh in ${Math.max(nextRefreshIn, 0)}s` : "Live paused"}
    </div>
  );
}

function AreaTrendChart({
  data,
  stroke,
  fill,
}: {
  data: TrendPoint[];
  stroke: string;
  fill: string;
}) {
  if (!data.length) {
    return <div className="h-40 rounded-[1.5rem] border border-dashed border-line bg-shell/70" />;
  }

  const width = 360;
  const height = 160;
  const maxValue = Math.max(...data.map((point) => point.count), 1);
  const minValue = Math.min(...data.map((point) => point.count), 0);
  const range = Math.max(maxValue - minValue, 1);
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((point, index) => {
    const x = index * step;
    const y = height - 18 - ((point.count - minValue) / range) * (height - 36);
    return { ...point, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(height - 4).toFixed(2)} L ${points[0].x.toFixed(2)} ${(height - 4).toFixed(2)} Z`;

  return (
    <div className="rounded-[1.5rem] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,247,244,0.88))] p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full overflow-visible">
        <defs>
          <linearGradient id={`fill-${stroke.replace(/[^a-z0-9]/gi, "")}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.38" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {points.map((point) => (
          <line
            key={`${point.date}-grid`}
            x1={point.x}
            x2={point.x}
            y1="8"
            y2={height - 4}
            stroke="rgba(17,17,17,0.06)"
            strokeDasharray="2 8"
          />
        ))}
        <path d={areaPath} fill={`url(#fill-${stroke.replace(/[^a-z0-9]/gi, "")})`} />
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="admin-draw-line"
        />
        {points.map((point) => (
          <g key={point.date}>
            <circle cx={point.x} cy={point.y} r="6" fill="white" stroke={stroke} strokeWidth="3" />
            <circle cx={point.x} cy={point.y} r="2.5" fill={stroke} />
          </g>
        ))}
      </svg>
      <div className="mt-3 grid grid-cols-7 gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
        {data.map((point) => (
          <span key={point.date} className="truncate text-center">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HourlyFlowChart({ data }: { data: HourPoint[] }) {
  if (!data.length) {
    return <div className="h-48 rounded-[1.5rem] border border-dashed border-line bg-shell/70" />;
  }

  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="rounded-[1.5rem] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,247,244,0.92))] p-4">
      <div className="flex h-48 items-end gap-2">
        {data.map((item, index) => {
          const height = Math.max((item.count / max) * 100, item.count > 0 ? 10 : 4);
          return (
            <div key={item.hour} className="flex h-full w-full flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-medium text-muted">{item.count}</span>
              <div className="flex h-full w-full items-end rounded-full bg-slate-100/80 p-[3px]">
                <div
                  className="admin-bar-rise w-full rounded-full bg-[linear-gradient(180deg,#111111,#5d5fee)] shadow-[0_10px_18px_rgba(93,95,238,0.22)]"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${index * 35}ms`,
                  }}
                />
              </div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                {item.label.replace(":00", "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendTile({
  title,
  subtitle,
  value,
  delta,
  accent,
  data,
}: {
  title: string;
  subtitle: string;
  value: number;
  delta: number;
  accent: { stroke: string; fill: string };
  data: TrendPoint[];
}) {
  const positive = delta >= 0;

  return (
    <div className="rounded-[1.75rem] border border-line bg-panel p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            <AnimatedMetricValue value={value} digits={0} />
          </p>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {positive ? "+" : ""}
          {delta.toFixed(1)}%
        </div>
      </div>
      <AreaTrendChart data={data} stroke={accent.stroke} fill={accent.fill} />
    </div>
  );
}

function InsightChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-shell/70 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [currentAdminEmail, setCurrentAdminEmail] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(0);
  const [liveMode, setLiveMode] = useState(true);
  const [nextRefreshIn, setNextRefreshIn] = useState(LIVE_REFRESH_MS / 1000);

  async function getValidAuthToken(forceRefresh = false) {
    if (!forceRefresh && authToken) {
      return authToken;
    }
    const jwt = await createSessionJwt();
    setAuthToken(jwt);
    return jwt;
  }

  async function authorizedFetch(path: string, options: RequestInit = {}, tokenOverride = "") {
    const jwt = tokenOverride || (await getValidAuthToken());
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${jwt}`);
    let response = await fetch(path, { ...options, headers });
    if (response.status === 401 && !tokenOverride) {
      const refreshedJwt = await getValidAuthToken(true);
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${refreshedJwt}`);
      response = await fetch(path, { ...options, headers: retryHeaders });
    }
    return response;
  }

  async function loadAnalytics(tokenOverride = "", { initial = false } = {}) {
    if (!initial) {
      setRefreshing(true);
    }
    setLoadError("");
    try {
      const response = await authorizedFetch("/api/admin/analytics", {}, tokenOverride);
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.status === 403) {
        throw new Error("Admin access required.");
      }
      const data = (await response.json().catch(() => ({}))) as AnalyticsPayload;
      if (!response.ok) {
        throw new Error((data as any)?.error || "Failed to load analytics.");
      }
      setAnalytics(data);
      setLastUpdatedAt(Date.now());
      setNextRefreshIn(LIVE_REFRESH_MS / 1000);
    } catch (error: any) {
      setLoadError(error?.message || "Failed to load analytics.");
    } finally {
      if (!initial) {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    async function initialize() {
      if (!identityConfigured) {
        router.replace("/login");
        return;
      }
      setLoading(true);
      try {
        const user = await account.get();
        setCurrentAdminEmail(user.email);
        const jwt = await createSessionJwt();
        setAuthToken(jwt);
        await loadAnalytics(jwt, { initial: true });
      } catch (error: any) {
        if (error?.code === 401) {
          router.replace("/login");
          return;
        }
        setLoadError(error?.message || "Failed to load admin route.");
      } finally {
        setLoading(false);
      }
    }
    void initialize();
  }, [router]);

  useEffect(() => {
    if (!liveMode || !authToken) {
      return;
    }

    const refreshTimer = window.setInterval(() => {
      void loadAnalytics();
    }, LIVE_REFRESH_MS);

    const countdownTimer = window.setInterval(() => {
      setNextRefreshIn((current) => (current <= 1 ? LIVE_REFRESH_MS / 1000 : current - 1));
    }, 1000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(countdownTimer);
    };
  }, [authToken, liveMode]);

  const metrics = analytics?.metrics;
  const totalUsers = metrics?.totalUsers ?? 0;
  const active24h = metrics?.activeUsers24h ?? 0;
  const totalConversations = metrics?.totalConversations ?? 0;
  const totalMessages = metrics?.totalMessages ?? 0;
  const avgMessages = metrics?.avgMessagesPerConversation ?? 0;
  const weeklyActiveUsers = metrics?.weeklyActiveUsers ?? 0;

  const dailyMessages = analytics?.daily.messages ?? [];
  const dailyConversations = analytics?.daily.conversations ?? [];
  const dailyActive = analytics?.daily.activeUsers ?? [];
  const hourlyMessages = analytics?.hourlyMessages ?? [];
  const topUsers = analytics?.topUsers ?? [];
  const recentConversations = analytics?.recentConversations ?? [];

  const insights = useMemo(() => {
    const latestMessages = dailyMessages[dailyMessages.length - 1]?.count ?? 0;
    const previousMessages = dailyMessages[dailyMessages.length - 2]?.count ?? 0;
    const latestConversations = dailyConversations[dailyConversations.length - 1]?.count ?? 0;
    const previousConversations = dailyConversations[dailyConversations.length - 2]?.count ?? 0;
    const latestActive = dailyActive[dailyActive.length - 1]?.count ?? 0;
    const previousActive = dailyActive[dailyActive.length - 2]?.count ?? 0;
    const peakHour = hourlyMessages.reduce(
      (best, current) => (current.count > best.count ? current : best),
      hourlyMessages[0] ?? { label: "-", count: 0 },
    );

    const dominantUser = topUsers[0];
    const topUserShare = totalMessages ? (dominantUser?.messageCount ?? 0) / totalMessages : 0;

    return {
      messageDelta: calculateDelta(latestMessages, previousMessages),
      conversationDelta: calculateDelta(latestConversations, previousConversations),
      activeDelta: calculateDelta(latestActive, previousActive),
      peakHour,
      topUserShare,
      latestMessages,
      latestConversations,
      latestActive,
    };
  }, [dailyActive, dailyConversations, dailyMessages, hourlyMessages, topUsers, totalMessages]);

  const loadingState = loading && !refreshing;

  if (loadingState) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="rounded-3xl border border-line bg-panel px-6 py-5 text-sm text-muted shadow-soft">
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics-page px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Live engagement command"
        subtitle="Monitor message velocity, contributor concentration, and recent session activity across the Nexa workspace."
        right={
          <>
            <LiveBadge liveMode={liveMode} nextRefreshIn={nextRefreshIn} />
            <button
              type="button"
              onClick={() => setLiveMode((current) => !current)}
              className="inline-flex items-center rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition hover:bg-white"
            >
              {liveMode ? "Pause live" : "Resume live"}
            </button>
            <button
              type="button"
              onClick={() => void loadAnalytics("", { initial: false })}
              disabled={refreshing}
              className="inline-flex items-center rounded-full border border-line bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh now"}
            </button>
          </>
        }
      />

      {loadError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <section className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Total users"
            value={formatNumber(totalUsers, 0)}
            note="Registered workspace accounts"
            icon={<span className="text-xl">Users</span>}
          />
          <AdminMetricCard
            label="Active 24h"
            value={formatNumber(active24h, 0)}
            note="Members who messaged today"
            icon={<span className="text-xl">Live</span>}
          />
          <AdminMetricCard
            label="Conversations"
            value={formatNumber(totalConversations, 0)}
            note="All recorded sessions"
            icon={<span className="text-xl">Flow</span>}
          />
          <AdminMetricCard
            label="Messages"
            value={formatNumber(totalMessages, 0)}
            note={`Average ${avgMessages} per session`}
            icon={<span className="text-xl">Msgs</span>}
          />
        </div>

        <section className="rounded-[2rem] border border-line bg-[radial-gradient(circle_at_top_left,rgba(93,95,238,0.18),transparent_38%),linear-gradient(180deg,#15151a,#232334)] p-6 text-white shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Control room</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">System pulse is live</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/72">
                Auto-refresh is polling workspace activity every 30 seconds and animating each snapshot into the dashboard.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/80">
              {lastUpdatedAt ? `Updated ${formatTimestamp(lastUpdatedAt)}` : "Awaiting first snapshot"}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <InsightChip label="Weekly active" value={formatNumber(weeklyActiveUsers, 0)} />
            <InsightChip
              label="Peak hour"
              value={`${insights.peakHour.label} (${insights.peakHour.count})`}
            />
            <InsightChip
              label="Top user share"
              value={`${(insights.topUserShare * 100).toFixed(1)}% of messages`}
            />
          </div>
        </section>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <TrendTile
          title="Message velocity"
          subtitle="7-day throughput trend"
          value={insights.latestMessages}
          delta={insights.messageDelta}
          accent={{ stroke: "#111111", fill: "#5D5FEE" }}
          data={dailyMessages}
        />
        <TrendTile
          title="Conversation starts"
          subtitle="7-day session creation trend"
          value={insights.latestConversations}
          delta={insights.conversationDelta}
          accent={{ stroke: "#5D5FEE", fill: "#8B8DFF" }}
          data={dailyConversations}
        />
        <TrendTile
          title="Active users"
          subtitle="7-day participation trend"
          value={insights.latestActive}
          delta={insights.activeDelta}
          accent={{ stroke: "#0F9F84", fill: "#55D6B8" }}
          data={dailyActive}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
        <AdminPanel
          title="Hourly message flow"
          subtitle="Rolling 24-hour throughput with animated bar updates."
          right={
            <span className="rounded-full bg-shell px-3 py-1 text-xs font-medium text-muted">
              Last 24 hours
            </span>
          }
        >
          <HourlyFlowChart data={hourlyMessages} />
        </AdminPanel>

        <AdminPanel title="Contribution stack" subtitle="Recent leaders by message volume and session count.">
          {topUsers.length === 0 ? (
            <p className="text-sm text-muted">No usage data yet.</p>
          ) : (
            <div className="space-y-4">
              {topUsers.map((user, index) => {
                const share = topUsers[0]?.messageCount ? (user.messageCount / topUsers[0].messageCount) * 100 : 0;
                return (
                  <div key={user.id} className="rounded-2xl border border-line bg-shell/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-ink">{user.name || "Unknown user"}</p>
                            <p className="text-xs text-muted">{user.email || user.id}</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted">{formatRelative(user.lastActiveAt)}</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="admin-progress-fill h-full rounded-full bg-[linear-gradient(90deg,#111111,#5d5fee)]"
                        style={{ width: `${Math.max(share, 8)}%`, animationDelay: `${index * 90}ms` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-ink">{user.messageCount.toLocaleString()} messages</span>
                      <span className="text-muted">{user.conversationCount.toLocaleString()} sessions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <AdminPanel title="Recent sessions" subtitle="Most recent workspace conversations with live relative timestamps.">
          {recentConversations.length === 0 ? (
            <p className="text-sm text-muted">No conversations yet.</p>
          ) : (
            <ul className="space-y-4">
              {recentConversations.map((conversation, index) => (
                <li
                  key={conversation.id}
                  className="admin-fade-up rounded-[1.5rem] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,245,242,0.96))] px-4 py-4"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">{conversation.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">User {conversation.userId}</p>
                    </div>
                    <span className="rounded-full bg-shell px-3 py-1 text-xs text-muted">
                      {formatRelative(conversation.updatedAt)}
                    </span>
                  </div>
                  {conversation.lastMessagePreview ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{conversation.lastMessagePreview}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title="Snapshot details" subtitle="Quick reading for operators watching engagement change in real time.">
          <div className="grid gap-4 sm:grid-cols-2">
            <InsightChip label="Admin session" value={currentAdminEmail || "Admin"} />
            <InsightChip label="Refresh mode" value={liveMode ? "Automatic" : "Manual"} />
            <InsightChip label="Average depth" value={`${avgMessages} messages / session`} />
            <InsightChip label="Latest refresh" value={lastUpdatedAt ? formatTimestamp(lastUpdatedAt) : "-"} />
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-line bg-shell/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Operator note</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              This page is now polling live usage and animating each panel on refresh. If you want stronger monitoring,
              the next step is wiring streaming telemetry or event logs into this route instead of periodic snapshot reads.
            </p>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

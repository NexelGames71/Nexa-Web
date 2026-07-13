"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PromotionReward = {
  rewardType?: string;
  value?: string;
  config?: Record<string, any>;
};

type Promotion = {
  id: string;
  name: string;
  title: string;
  description: string;
  promotionType: string;
  applicationMode: string;
  code: string;
  startsAt: string;
  endsAt: string;
  priority: number;
  rewards: PromotionReward[];
};

type PromotionSpotlightProps = {
  surface?: "pricing" | "checkout" | "workspace";
  planKey?: string;
  compact?: boolean;
  className?: string;
};

function rewardLabel(reward: PromotionReward) {
  const type = String(reward.rewardType || "").toUpperCase();
  const value = String(reward.value || "").trim();
  if (!type) return "";
  if (type === "PERCENTAGE_DISCOUNT") return value ? `${value}% off` : "Subscription discount";
  if (type === "FIXED_AMOUNT_DISCOUNT") return value ? `$${value} off` : "Fixed discount";
  if (type === "FREE_TRIAL_DAYS") return value ? `${value} free trial days` : "Free trial";
  if (type === "IMAGE_CREDITS") return value ? `${value} image credits` : "Bonus image credits";
  if (type === "THINKER_CREDITS") return value ? `${value} Thinker credits` : "Bonus Thinker credits";
  if (type === "DEEP_THINKER_CREDITS") return value ? `${value} Deep Thinker credits` : "Bonus Deep Thinker credits";
  if (type === "STORAGE_CREDITS") return value ? `${value} storage credits` : "Bonus storage";
  return type.replace(/_/g, " ").toLowerCase();
}

function expiryLabel(endsAt: string) {
  if (!endsAt) return "";
  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) return "";
  return `Ends ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export default function PromotionSpotlight({
  surface = "pricing",
  planKey = "plus",
  compact = false,
  className = "",
}: PromotionSpotlightProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPromotions() {
      try {
        const response = await fetch(`/api/promotions?t=${Date.now()}`, { cache: "no-store" });
        const data = await response.json();
        if (!cancelled && response.ok) {
          setPromotions(Array.isArray(data.promotions) ? data.promotions : []);
        }
      } catch {
        if (!cancelled) setPromotions([]);
      }
    }

    void loadPromotions();
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredPromotions = useMemo(() => promotions.slice(0, compact ? 1 : 3), [promotions, compact]);
  if (featuredPromotions.length === 0) return null;

  if (surface === "workspace" || compact) {
    const promotion = featuredPromotions[0];
    const reward = rewardLabel(promotion.rewards?.[0] || {});
    return (
      <Link
        href={`/checkout?plan=${encodeURIComponent(planKey)}`}
        className={[
          "block rounded-xl border border-black/10 bg-white px-3 py-3 text-left shadow-[0_8px_22px_rgba(17,17,17,0.06)] transition hover:border-black/20",
          className,
        ].join(" ")}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Live offer</div>
        <div className="mt-1 line-clamp-2 text-sm font-semibold text-ink">{promotion.title}</div>
        {reward ? <div className="mt-1 text-xs text-muted">{reward}</div> : null}
        <div className="mt-3 inline-flex rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">
          View offer
        </div>
      </Link>
    );
  }

  return (
    <section
      className={[
        "rounded-[28px] border border-line bg-[radial-gradient(circle_at_top_left,rgba(154,217,123,0.24),transparent_34%),linear-gradient(135deg,#ffffff,#f7f7f4)] p-5 shadow-soft",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Current Nexa offers</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Promotions available now</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Active public campaigns are applied from Nexa promotion rules. Codes are shown only when a campaign uses one.
          </p>
        </div>
        <Link
          href={`/checkout?plan=${encodeURIComponent(planKey)}`}
          className="inline-flex justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Choose a plan
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {featuredPromotions.map((promotion) => {
          const rewards = promotion.rewards?.map(rewardLabel).filter(Boolean).slice(0, 2) || [];
          return (
            <article key={promotion.id} className="rounded-2xl border border-black/8 bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-ink">{promotion.title}</h3>
                {promotion.code ? (
                  <span className="shrink-0 rounded-full border border-black/10 bg-shell px-2.5 py-1 text-[11px] font-semibold text-ink">
                    {promotion.code}
                  </span>
                ) : null}
              </div>
              {promotion.description ? (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{promotion.description}</p>
              ) : null}
              {rewards.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {rewards.map((reward) => (
                    <span key={reward} className="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-medium text-ink">
                      {reward}
                    </span>
                  ))}
                </div>
              ) : null}
              {expiryLabel(promotion.endsAt) ? (
                <div className="mt-4 text-xs font-medium text-muted">{expiryLabel(promotion.endsAt)}</div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

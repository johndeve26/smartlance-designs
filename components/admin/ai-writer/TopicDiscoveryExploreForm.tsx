"use client";

import { useState } from "react";
import { runDiscoveryAction } from "@/lib/admin/topic-intelligence-actions";
import { DISCOVERY_MARKETS } from "@/lib/ai/topic-intelligence/types";

const EXAMPLE_SEEDS = [
  "Redesign vs rebuild",
  "Traffic but no enquiries",
  "Core Web Vitals",
  "Local SEO for service businesses",
] as const;

const GOAL_CHIPS = [
  "Build authority",
  "Support a Service",
  "Support a Solution",
  "Answer buyer questions",
  "Refresh existing content",
] as const;

type IndustryOption = { slug: string; title: string };

export function TopicDiscoveryExploreForm({
  industries,
  showFirstRunHint,
}: {
  industries: IndustryOption[];
  showFirstRunHint: boolean;
}) {
  const [seed, setSeed] = useState("");
  const [goal, setGoal] = useState("");
  const [showExamples, setShowExamples] = useState(true);
  const [pending, setPending] = useState(false);

  return (
    <form
      action={runDiscoveryAction}
      className="space-y-4"
      onSubmit={() => setPending(true)}
    >
      {showFirstRunHint ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">Start your first discovery</p>
          <p className="mt-0.5 text-neutral-600">
            Try a topic related to a current Smartlance priority, such as website redesign, SEO,
            conversion, performance, or e-commerce.
          </p>
        </div>
      ) : null}

      <div>
        <label htmlFor="seedText" className="sr-only">
          Topic to explore
        </label>
        <input
          id="seedText"
          name="seedText"
          required
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="e.g. Why service websites get traffic but few enquiries"
          className="admin-input w-full"
        />
        {showExamples ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_SEEDS.map((ex) => (
              <button
                key={ex}
                type="button"
                className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
                onClick={() => {
                  setSeed(ex);
                  setShowExamples(false);
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          <span className="text-xs font-medium text-neutral-600">Discovery mode</span>
          <select name="mode" defaultValue="MIXED" className="admin-input mt-1">
            <option value="MIXED">Mixed discovery (recommended)</option>
            <option value="EXPLORE_SUGGESTION">Explore suggestion</option>
            <option value="SITE_GAPS">Site gaps</option>
            <option value="NEWS">News</option>
            <option value="INDUSTRY">Industry</option>
            <option value="PLATFORMS">Platforms</option>
            <option value="TRENDS">Trends</option>
            <option value="EXISTING_CONTENT">Existing content</option>
          </select>
          <span className="mt-1 block text-xs text-neutral-500">
            Mixed discovery combines Smartlance coverage with available external signals.
          </span>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-medium text-neutral-600">Market</span>
          <select name="market" defaultValue="global_en" className="admin-input mt-1">
            {DISCOVERY_MARKETS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-neutral-500">
            International English audience, prioritising relevance to the US, UK, Europe, Canada,
            Australia, and similar markets.
          </span>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-medium text-neutral-600">Starting point</span>
          <select name="seedType" defaultValue="TOPIC" className="admin-input mt-1">
            <option value="TOPIC">Topic</option>
            <option value="QUESTION">Question</option>
            <option value="INDUSTRY">Industry</option>
            <option value="SERVICE">Service</option>
            <option value="SOLUTION">Solution</option>
            <option value="PLATFORM">Platform</option>
            <option value="COMPETITOR_THEME">Competitor / theme</option>
            <option value="SOURCE_URL">Source URL</option>
            <option value="EDITORIAL_NOTE">Editorial note</option>
          </select>
          <span className="mt-1 block text-xs text-neutral-500">
            Tell the system what kind of idea you are starting with.
          </span>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-medium text-neutral-600">Industry</span>
          <select name="industry" defaultValue="" className="admin-input mt-1">
            <option value="">Leave blank (industry-neutral)</option>
            {industries.map((ind) => (
              <option key={ind.slug} value={ind.title}>
                {ind.title}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-neutral-500">
            Leave blank when the topic should remain industry-neutral.
          </span>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-medium text-neutral-600">Time relevance</span>
          <select name="freshness" defaultValue="" className="admin-input mt-1">
            <option value="">Any timeframe</option>
            <option value="timely">Recent developments</option>
            <option value="hybrid">Hybrid</option>
            <option value="evergreen">Evergreen</option>
          </select>
          <span className="mt-1 block text-xs text-neutral-500">
            Use recent periods for news or platform changes. Keep evergreen topics unrestricted.
          </span>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-medium text-neutral-600">Commercial goal</span>
          <input
            name="commercialGoal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="admin-input mt-1"
            placeholder="e.g. Support Website Redesign, build SEO authority, answer buyer questions"
          />
          <span className="mt-1 block text-xs text-neutral-500">
            Optional. Helps Topic Intelligence understand the role this content should play on the
            Smartlance site.
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GOAL_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="rounded border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                onClick={() => setGoal(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </label>
      </div>

      <label className="flex items-start gap-2 text-sm text-neutral-700">
        <input type="checkbox" name="forceRefresh" className="mt-0.5" />
        <span>
          <span className="font-medium">Refresh external sources</span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            Bypass recent cached research. This may use additional provider quota.
          </span>
        </span>
      </label>

      <button type="submit" className="admin-btn-primary" disabled={pending}>
        {pending ? "Researching opportunities…" : "Research opportunities"}
      </button>
    </form>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { getVisiblePlatformSelectorQuestions } from "@/data/tools/website-platform-selector";
import {
  buildPlatformSelectorPlainText,
  evaluatePlatformSelector,
} from "@/lib/platform-selector";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { PlatformSelectorResults } from "@/components/tools/platform-selector-results";

const STORAGE_KEY = "smartlance.tool.website-platform-selector";
const STORAGE_VERSION = 1;
const TOOL_ID = "website-platform-selector";

type Phase = "questions" | "results";

type PersistedState = {
  version: number;
  stepIndex: number;
  answers: Record<string, string>;
  phase: Phase;
};

type Props = {
  tool: {
    title: string;
    slug: string;
    relatedTemplateSlugs?: string[];
    relatedGuideSlugs?: string[];
    relatedChecklistSlugs?: string[];
    relatedComparisonSlugs?: string[];
  };
};

const EMPTY_STATE: PersistedState = {
  version: STORAGE_VERSION,
  stepIndex: 0,
  answers: {},
  phase: "questions",
};

const EMPTY_JSON = JSON.stringify(EMPTY_STATE);

function parseState(raw: string): PersistedState {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...EMPTY_STATE, answers: {} };
    }
    const record = parsed as Record<string, unknown>;
    if (record.version !== STORAGE_VERSION) {
      return { ...EMPTY_STATE, answers: {} };
    }

    const answers: Record<string, string> = {};
    if (
      record.answers &&
      typeof record.answers === "object" &&
      !Array.isArray(record.answers)
    ) {
      for (const [key, value] of Object.entries(
        record.answers as Record<string, unknown>,
      )) {
        if (typeof value === "string") answers[key] = value;
      }
    }

    const phase: Phase =
      record.phase === "results" ? "results" : "questions";
    const stepIndex =
      typeof record.stepIndex === "number" &&
      Number.isFinite(record.stepIndex) &&
      record.stepIndex >= 0
        ? Math.floor(record.stepIndex)
        : 0;

    return {
      version: STORAGE_VERSION,
      stepIndex,
      answers,
      phase,
    };
  } catch {
    return { ...EMPTY_STATE, answers: {} };
  }
}

type Store = {
  subscribe: (onStoreChange: () => void) => () => void;
  getSnapshot: () => string;
  getServerSnapshot: () => string;
  write: (next: PersistedState) => void;
  reset: () => void;
};

let selectorStore: Store | null = null;

function getStore(): Store {
  if (selectorStore) return selectorStore;

  const listeners = new Set<() => void>();
  let cached = EMPTY_JSON;

  function emit() {
    for (const listener of listeners) listener();
  }

  function readRaw(): string {
    if (typeof window === "undefined") return EMPTY_JSON;
    try {
      return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_JSON;
    } catch {
      return EMPTY_JSON;
    }
  }

  function writeRaw(value: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
      cached = value;
      emit();
    } catch {
      // Ignore quota / private-mode failures
    }
  }

  cached = typeof window === "undefined" ? EMPTY_JSON : readRaw();

  selectorStore = {
    subscribe(onStoreChange) {
      listeners.add(onStoreChange);
      const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) {
          cached = event.newValue ?? EMPTY_JSON;
          emit();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onStoreChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot() {
      cached = readRaw();
      return cached;
    },
    getServerSnapshot() {
      return EMPTY_JSON;
    },
    write(next) {
      writeRaw(JSON.stringify(next));
    },
    reset() {
      writeRaw(EMPTY_JSON);
    },
  };

  return selectorStore;
}

export function PlatformSelector({ tool }: Props) {
  const store = getStore();
  const raw = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const state = useMemo(() => parseState(raw), [raw]);
  const answers = state.answers;
  const hasAnswers = Object.keys(answers).length > 0;

  const visibleQuestions = useMemo(
    () => getVisiblePlatformSelectorQuestions(answers),
    [answers],
  );
  const visibleTotal = visibleQuestions.length;

  const stepIndex = Math.min(
    state.stepIndex,
    Math.max(visibleTotal - 1, 0),
  );
  const phase = state.phase;
  const currentQuestion = visibleQuestions[stepIndex];
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;
  const isLastQuestion = stepIndex >= visibleTotal - 1 && visibleTotal > 0;

  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusResultsRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  const persist = useCallback(
    (patch: Partial<PersistedState>) => {
      const current = parseState(store.getSnapshot());
      store.write({
        version: STORAGE_VERSION,
        stepIndex: patch.stepIndex ?? current.stepIndex,
        answers: patch.answers ?? current.answers,
        phase: patch.phase ?? current.phase,
      });
    },
    [store],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("tool_start", { tool: TOOL_ID });
  }, []);

  useEffect(() => {
    if (phase !== "results" || completedRef.current) return;
    completedRef.current = true;
    trackEvent("tool_complete", { tool: TOOL_ID });
  }, [phase]);

  useEffect(() => {
    if (phase !== "results" || !shouldFocusResultsRef.current) return;
    shouldFocusResultsRef.current = false;
    resultsHeadingRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (state.stepIndex === stepIndex) return;
    if (phase !== "questions") return;
    persist({ stepIndex });
  }, [phase, persist, state.stepIndex, stepIndex]);

  const result = useMemo(() => {
    if (phase !== "results") return null;
    return evaluatePlatformSelector(answers);
  }, [answers, phase]);

  function setAnswer(questionId: string, optionId: string) {
    const nextAnswers = { ...answers, [questionId]: optionId };
    // Drop answers for questions that are no longer visible
    const nextVisible = getVisiblePlatformSelectorQuestions(nextAnswers);
    const visibleIds = new Set(nextVisible.map((q) => q.id));
    const pruned: Record<string, string> = {};
    for (const [key, value] of Object.entries(nextAnswers)) {
      if (visibleIds.has(key)) pruned[key] = value;
    }
    persist({ answers: pruned, phase: "questions" });
  }

  function goBack() {
    if (phase === "results") {
      persist({ phase: "questions", stepIndex: Math.max(visibleTotal - 1, 0) });
      return;
    }
    if (stepIndex <= 0) return;
    persist({ stepIndex: stepIndex - 1, phase: "questions" });
  }

  function goNext() {
    if (!currentQuestion || !currentAnswer) return;
    if (isLastQuestion) {
      shouldFocusResultsRef.current = true;
      completedRef.current = false;
      persist({ phase: "results" });
      return;
    }
    persist({ stepIndex: stepIndex + 1, phase: "questions" });
  }

  function startOver() {
    if (hasAnswers) {
      const confirmed = window.confirm(
        "This clears your selector answers saved in this browser.",
      );
      if (!confirmed) return;
    }
    completedRef.current = false;
    setCopied(false);
    store.reset();
  }

  async function copyResults() {
    if (!result) return;
    const text = buildPlatformSelectorPlainText(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; keep UI quiet
    }
  }

  return (
    <div id="platform-selector" className="w-full">
      <p className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-[0.9375rem] leading-relaxed text-muted">
        Your answers stay in this browser. Nothing is submitted to Smartlance.
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-border pb-5">
        {hasAnswers ? (
          <p className="mr-auto text-sm text-muted" aria-live="polite">
            Saved in this browser
          </p>
        ) : (
          <span className="mr-auto" />
        )}
        {hasAnswers || phase === "results" ? (
          <button
            type="button"
            onClick={startOver}
            className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-[0.875rem] font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Start Over
          </button>
        ) : null}
      </div>

      {phase === "results" && result ? (
        <PlatformSelectorResults
          result={result}
          tool={tool}
          headingRef={resultsHeadingRef}
          copied={copied}
          onCopy={copyResults}
          onStartOver={startOver}
        />
      ) : currentQuestion ? (
        <div>
          <p
            className="text-sm font-medium text-muted"
            aria-live="polite"
            aria-atomic="true"
          >
            Question {stepIndex + 1} of {visibleTotal}
          </p>

          <fieldset className="mt-5 border-0 p-0">
            <legend className="font-display text-[clamp(1.5rem,3.5vw,2.125rem)] font-semibold leading-tight tracking-tight text-foreground">
              {currentQuestion.title}
            </legend>
            {currentQuestion.description ? (
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {currentQuestion.description}
              </p>
            ) : null}

            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((option) => {
                const selected = currentAnswer === option.id;
                const inputId = `${currentQuestion.id}-${option.id}`;
                return (
                  <label
                    key={option.id}
                    htmlFor={inputId}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-lg border px-4 py-3.5 transition-colors",
                      "focus-within:outline-none focus-within:ring-2 focus-within:ring-accent",
                      selected
                        ? "border-accent bg-brand-soft"
                        : "border-border bg-surface hover:bg-surface-muted",
                    )}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={currentQuestion.id}
                      value={option.id}
                      checked={selected}
                      onChange={() =>
                        setAnswer(currentQuestion.id, option.id)
                      }
                      className="mt-1 h-4 w-4 shrink-0 border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    <span className="min-w-0">
                      <span className="block text-[1rem] font-medium leading-snug text-foreground sm:text-[1.0625rem]">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="mt-1 block text-[0.875rem] leading-relaxed text-muted">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-[0.9375rem] font-semibold text-foreground",
                "hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface",
              )}
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!currentAnswer}
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-lg bg-cta px-5 text-[0.9375rem] font-semibold text-cta-foreground",
                "hover:bg-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cta",
              )}
            >
              {isLastQuestion ? "View Results" : "Next"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-muted">No questions available.</p>
      )}
    </div>
  );
}

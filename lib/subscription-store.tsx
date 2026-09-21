import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_SUBSCRIPTION,
  FREE_DAILY_STUDY_SECONDS,
  normalizeStudyDay,
  SubscriptionState,
  todayKey,
  type PlanId,
} from "@/lib/subscription";

const STORAGE_KEY = "dino-subscription-v1";

type SubscriptionContextValue = {
  subscription: SubscriptionState;
  isHydrated: boolean;
  isPro: boolean;
  remainingSeconds: number;
  addStudySeconds: (seconds: number) => void;
  /** Mock: ativa Pro localmente (até integrar billing real) */
  activateProMock: () => void;
  /** Mock: volta para free (testes) */
  resetToFree: () => void;
  markFirstDiscountSeen: () => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>(DEFAULT_SUBSCRIPTION);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as SubscriptionState;
          setSubscription(normalizeStudyDay({ ...DEFAULT_SUBSCRIPTION, ...parsed }));
        } catch {
          // ignore corrupt
        }
      })
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subscription)).catch(() => undefined);
  }, [subscription, isHydrated]);

  // Reset diário quando o app volta no dia seguinte
  useEffect(() => {
    if (!isHydrated) return;
    setSubscription((current) => normalizeStudyDay(current));
  }, [isHydrated]);

  const addStudySeconds = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    setSubscription((current) => {
      const normalized = normalizeStudyDay(current);
      if (normalized.plan === "pro") return normalized;
      return {
        ...normalized,
        studySecondsToday: Math.min(
          FREE_DAILY_STUDY_SECONDS + 3600, // cap soft
          normalized.studySecondsToday + Math.floor(seconds),
        ),
        studyDayKey: todayKey(),
      };
    });
  }, []);

  const activateProMock = useCallback(() => {
    setSubscription((current) => ({
      ...normalizeStudyDay(current),
      plan: "pro" as PlanId,
      proSince: new Date().toISOString(),
      firstDiscountUsed: true,
    }));
  }, []);

  const resetToFree = useCallback(() => {
    setSubscription({
      ...DEFAULT_SUBSCRIPTION,
      studyDayKey: todayKey(),
    });
  }, []);

  const markFirstDiscountSeen = useCallback(() => {
    setSubscription((current) => ({ ...current, firstDiscountUsed: true }));
  }, []);

  const normalized = normalizeStudyDay(subscription);
  const isPro = normalized.plan === "pro";
  const remainingSeconds = isPro
    ? Number.POSITIVE_INFINITY
    : Math.max(0, FREE_DAILY_STUDY_SECONDS - normalized.studySecondsToday);

  const value = useMemo(
    () => ({
      subscription: normalized,
      isHydrated,
      isPro,
      remainingSeconds,
      addStudySeconds,
      activateProMock,
      resetToFree,
      markFirstDiscountSeen,
    }),
    [
      normalized,
      isHydrated,
      isPro,
      remainingSeconds,
      addStudySeconds,
      activateProMock,
      resetToFree,
      markFirstDiscountSeen,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}

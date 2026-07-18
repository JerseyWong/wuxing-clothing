import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { analyzeBazi } from './analysis';
import { buildBaziChart, buildTransitContext } from './calendar';
import { buildClothingRecommendation, buildUniversalRanking } from './recommendation';

export function useCalculations() {
  const profile = useAppStore((state) => state.draftProfile);
  const selectedDate = useAppStore((state) => state.selectedDate);
  const scene = useAppStore((state) => state.scene);
  const displayMode = useAppStore((state) => state.displayMode);

  return useMemo(() => {
    const transit = buildTransitContext(selectedDate);
    if (!profile.birthInput.localDateTime) {
      return { profile, transit, chart: null, analysis: null, recommendation: null, universal: buildUniversalRanking(transit), error: null as string | null };
    }
    try {
      const chart = buildBaziChart(profile.birthInput, profile.timeConfig);
      const analysis = analyzeBazi(chart, profile.expertOverride);
      const recommendation = buildClothingRecommendation(analysis, transit, scene, displayMode, profile.expertOverride);
      return { profile, transit, chart, analysis, recommendation, universal: buildUniversalRanking(transit), error: null as string | null };
    } catch (error) {
      return {
        profile, transit, chart: null, analysis: null, recommendation: null,
        universal: buildUniversalRanking(transit),
        error: error instanceof Error ? error.message : '计算失败',
      };
    }
  }, [profile, selectedDate, scene, displayMode]);
}

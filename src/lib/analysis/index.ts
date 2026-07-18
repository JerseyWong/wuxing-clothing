import type { BaziChart, BaziAnalysis, ExpertOverride } from '../../types/domain';
import { analyzeBasicChart } from './basic';
import { analyzeStrength } from './strength';
import { analyzeStructure } from './structure';
import { analyzeUsefulElements } from './usefulElements';
import { finalizeAnalysis, ALGORITHM_VERSION } from './final';
import { applyConfirmedStructures } from './recalibrate';

export function analyzeBazi(chart: BaziChart, expert: ExpertOverride): BaziAnalysis {
  const basic = analyzeBasicChart(chart);
  const initialStrength = analyzeStrength(chart, basic);
  const initialStructure = analyzeStructure(chart, initialStrength, expert);
  const strength = applyConfirmedStructures(chart, initialStrength, initialStructure);
  const structure = strength === initialStrength ? initialStructure : analyzeStructure(chart, strength, expert);
  const usefulElements = analyzeUsefulElements(chart, strength, structure);
  const final = finalizeAnalysis(strength, structure, usefulElements, expert);
  return { basic, strength, structure, usefulElements, final, algorithmVersion: ALGORITHM_VERSION };
}

export { ALGORITHM_VERSION } from './final';

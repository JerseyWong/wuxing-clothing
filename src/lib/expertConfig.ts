import { DEFAULT_WEIGHTS } from '../data/wuxing';
import { ELEMENTS } from '../types/domain';
import type { ExpertOverride } from '../types/domain';

export function hasExpertConfiguration(expert: ExpertOverride): boolean {
  if (expert.configured) return true;
  if (expert.correctedStrength || expert.structureName?.trim() || expert.specialStructureConfirmed) return true;
  if (Object.values(expert.transformationOverrides).some((status) => status !== 'potential')) return true;
  if (expert.supportingElements.length || expert.climateElements.length || expert.bridgingElements.length || expert.illnessMedicineElements.length) return true;
  if (ELEMENTS.some((element) => expert.elementAdjustments[element] !== 0)) return true;
  if (Object.entries(DEFAULT_WEIGHTS).some(([key, value]) => expert.weights[key as keyof typeof DEFAULT_WEIGHTS] !== value)) return true;
  if (expert.notes.trim()) return true;
  return false;
}

export function isExpertConfigurationActive(expert: ExpertOverride): boolean {
  return expert.enabled && hasExpertConfiguration(expert);
}

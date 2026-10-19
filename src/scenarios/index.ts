import type { Scenario } from '../engine/types';
import { candidateScreening } from './candidateScreening';
import { clientDiscovery } from './clientDiscovery';

export const SCENARIOS: readonly Scenario[] = [clientDiscovery, candidateScreening];

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

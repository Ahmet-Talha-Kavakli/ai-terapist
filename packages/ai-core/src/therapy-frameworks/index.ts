import { CBT_FRAMEWORK } from './cbt';
import { DBT_FRAMEWORK } from './dbt';
import { ACT_FRAMEWORK } from './act';
import { SOMATIC_FRAMEWORK } from './somatic';
import { PSYCHODYNAMIC_FRAMEWORK } from './psychodynamic';

export const ALL_FRAMEWORKS = [
  CBT_FRAMEWORK,
  DBT_FRAMEWORK,
  ACT_FRAMEWORK,
  SOMATIC_FRAMEWORK,
  PSYCHODYNAMIC_FRAMEWORK,
].join('\n\n---\n\n');

export {
  CBT_FRAMEWORK,
  DBT_FRAMEWORK,
  ACT_FRAMEWORK,
  SOMATIC_FRAMEWORK,
  PSYCHODYNAMIC_FRAMEWORK,
};

import type { LegacyConfig } from '../../types';

import { getRulesForConfig } from '../../rules';

export const stylistic: LegacyConfig = {
  plugins: ['valibot'],
  rules: getRulesForConfig('stylistic'),
};

import type { LegacyConfig } from '../../types';

import { getRulesForConfig } from '../../rules';

export const strict: LegacyConfig = {
  plugins: ['valibot'],
  rules: getRulesForConfig('strict'),
};

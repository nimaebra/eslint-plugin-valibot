import type { LegacyConfig } from '../../types';

import { getRulesForConfig } from '../../rules';

export const all: LegacyConfig = {
  plugins: ['valibot'],
  rules: getRulesForConfig('all'),
};

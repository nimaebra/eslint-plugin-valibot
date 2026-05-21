import type { LegacyConfig } from '../../types';

import { getRulesForConfig } from '../../rules';

export const recommended: LegacyConfig = {
  plugins: ['valibot'],
  rules: getRulesForConfig('recommended'),
};

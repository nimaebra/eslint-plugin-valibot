import type { FlatConfigArray, FlatPluginShape } from '../../types';

import { getRulesForConfig } from '../../rules';

export function createRecommendedConfig(
  plugin: FlatPluginShape,
): FlatConfigArray {
  return [
    {
      name: 'valibot/recommended',
      plugins: {
        valibot: plugin,
      },
      rules: getRulesForConfig('recommended'),
    },
  ];
}

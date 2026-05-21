import type { FlatConfigArray, FlatPluginShape } from '../../types';

import { getRulesForConfig } from '../../rules';

export function createStylisticConfig(
  plugin: FlatPluginShape,
): FlatConfigArray {
  return [
    {
      name: 'valibot/stylistic',
      plugins: {
        valibot: plugin,
      },
      rules: getRulesForConfig('stylistic'),
    },
  ];
}

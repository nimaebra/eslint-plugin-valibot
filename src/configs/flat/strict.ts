import type { FlatConfigArray, FlatPluginShape } from '../../types';

import { getRulesForConfig } from '../../rules';

export function createStrictConfig(plugin: FlatPluginShape): FlatConfigArray {
  return [
    {
      name: 'valibot/strict',
      plugins: {
        valibot: plugin,
      },
      rules: getRulesForConfig('strict'),
    },
  ];
}

import type { FlatConfigArray, FlatPluginShape } from '../../types';

import { getRulesForConfig } from '../../rules';

export function createAllConfig(plugin: FlatPluginShape): FlatConfigArray {
  return [
    {
      name: 'valibot/all',
      plugins: {
        valibot: plugin,
      },
      rules: getRulesForConfig('all'),
    },
  ];
}

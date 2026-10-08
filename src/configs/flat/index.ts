import type { FlatConfigMap, FlatPluginShape } from '../../types';

import { createAllConfig } from './all';
import { createRecommendedConfig } from './recommended';
import { createStrictConfig } from './strict';
import { createStylisticConfig } from './stylistic';

export function createFlatConfigs(plugin: FlatPluginShape): FlatConfigMap {
  return {
    all: createAllConfig(plugin),
    recommended: createRecommendedConfig(plugin),
    strict: createStrictConfig(plugin),
    stylistic: createStylisticConfig(plugin),
  };
}

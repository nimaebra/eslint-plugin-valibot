import type { FlatConfigMap, FlatPluginShape } from '../../types';

import { createRecommendedConfig } from './recommended';
import { createStrictConfig } from './strict';
import { createStylisticConfig } from './stylistic';

export function createFlatConfigs(plugin: FlatPluginShape): FlatConfigMap {
  return {
    recommended: createRecommendedConfig(plugin),
    strict: createStrictConfig(plugin),
    stylistic: createStylisticConfig(plugin),
  };
}

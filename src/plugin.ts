import { createFlatConfigs } from './configs/flat';
import { legacyConfigs } from './configs/legacy';
import { rules } from './rules';
import type { FlatPluginShape, ValibotPlugin } from './types';

const basePlugin: FlatPluginShape & {
  configs: typeof legacyConfigs;
} = {
  meta: {
    name: 'eslint-plugin-valibot',
  },
  rules,
  configs: legacyConfigs,
};

export const flatConfigs = createFlatConfigs(basePlugin);
export const configs = legacyConfigs;

const plugin: ValibotPlugin = {
  ...basePlugin,
  flatConfigs,
};

export default plugin;

// Build Expo modules from source instead of using Expo's precompiled frameworks.
// The precompiled ones are built against the Release React Native core and crashed the
// Debug simulator build at launch (mismatched React `Props` layout).
const { withPodfileProperties } = require('expo/config-plugins');

module.exports = function withSourceBuiltExpoModules(config) {
  return withPodfileProperties(config, (cfg) => {
    cfg.modResults.EXPO_USE_PRECOMPILED_MODULES = 'false';
    return cfg;
  });
};

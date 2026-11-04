const { withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = "// Stripe's optional issuing push-provisioning dependency";

const GRADLE_RULE = `${MARKER}
subprojects { p ->
  if (p.name == "stripe_stripe-react-native") {
    p.dependencies.components.withModule("com.stripe:stripe-android-issuing-push-provisioning") { details ->
      details.allVariants {
        withDependencies { deps ->
          deps.removeAll { it.group == "com.google.android.gms" && it.name == "play-services-tapandpay" }
        }
      }
    }
  }
}`;

module.exports = function withStripeTapAndPayWorkaround(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents = `${config.modResults.contents.trimEnd()}\n\n${GRADLE_RULE}\n`;
    }
    return config;
  });
};

// iOS 27 stops apps at launch unless they use the UIScene life cycle. Expo SDK 57 ships
// `ExpoAppSceneDelegate` for this, but its project template still starts React Native from
// the app delegate. This plugin declares the scene in Info.plist and hands start-up to it.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const START_IN_APP_DELEGATE = /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('with-scene-lifecycle expects a Swift AppDelegate');
    }
    let src = cfg.modResults.contents;
    if (!src.includes('ExpoReactNativeFactoryProvider')) {
      src = src.replace(
        'class AppDelegate: ExpoAppDelegate {',
        'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
      );
    }
    if (START_IN_APP_DELEGATE.test(src)) {
      src = src.replace(START_IN_APP_DELEGATE, '\n    // React Native starts in ExpoAppSceneDelegate when the window scene connects.\n');
    }
    if (!src.includes('ExpoReactNativeFactoryProvider') || src.includes('factory.startReactNative(')) {
      throw new Error('with-scene-lifecycle could not update AppDelegate.swift; the Expo template changed');
    }
    cfg.modResults.contents = src;
    return cfg;
  });
};

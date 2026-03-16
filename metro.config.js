const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure proper file watching - watch all relevant directories
config.watchFolders = [
  path.resolve(__dirname),
  path.resolve(__dirname, 'app'),
];

// Disable source maps to fix ENOENT errors
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'css'];

// Enable fast refresh and proper transformation
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Enable unstable_allowRequireContext for better file watching
config.transformer.unstable_allowRequireContext = true;

module.exports = withNativeWind(config, { input: './global.css' });

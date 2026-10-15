module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // The Reanimated plugin MUST be listed last. It rewrites worklets so
      // animations run on the UI thread; without it, animated components throw
      // at runtime. Keeping it here (not scattered) is part of the "no crashes"
      // guarantee for the motion system.
      'react-native-reanimated/plugin',
    ],
  };
};

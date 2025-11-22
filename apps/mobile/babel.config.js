module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@cueron/types': '../../packages/types/src',
            '@cueron/utils': '../../packages/utils/src',
            '@cueron/config': '../../packages/config/src',
          },
        },
      ],
    ],
  };
};

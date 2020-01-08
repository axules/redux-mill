module.exports = function (api) {
  api.cache.never();

  return {
    plugins: [],
    presets: [
      ['@babel/preset-env', {
        useBuiltIns: 'usage',
        corejs: '3.2.1',
        loose: true,
        forceAllTransforms: true,
      }],
    ]
  };
};

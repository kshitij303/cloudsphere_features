const webpack = require('webpack');

module.exports = function override(config) {
  // Remove `fallback` (Webpack 5+ no longer supports it)
  config.resolve = {
    ...config.resolve,
    alias: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      assert: require.resolve("assert/"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
      url: require.resolve("url/")
    }
  };

  // Add necessary polyfills using ProvidePlugin
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"]
    })
  ]);

  return config;
};

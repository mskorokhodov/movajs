const path = require('path');
const HtmlPlugin = require('html-webpack-plugin');

const resolve = (target) => path.resolve(__dirname, target);

module.exports = (env, { mode }) => ({
  mode,
  entry: resolve('example/index.js'),
  output: {
    path: resolve('example/dist'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  module: {
    rules: []
  },
  plugins: [
    new HtmlPlugin({
      template: resolve('example/index.html'),
      filename: resolve('example/dist/index.html'),
    }),
  ],
  stats: {
    warnings: false
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: resolve('example/dist'),
    historyApiFallback: true
  }
});
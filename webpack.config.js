const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './index.ts',
  progress: true,
  devtool: 'source-map',
  target: 'web',
  bail: true,

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.es5.js',
    library: 'culling-log-parser',
    libraryTarget: 'umd'
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['', '.ts', '.js']
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loaders: ['babel', 'ts-loader']
      }
    ]
  },
  plugins: [],
  ts: {
    compilerOptions: {
      declaration: false
    }
  }
}

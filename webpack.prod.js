const { merge } = require('webpack-merge');
const common = require('./webpack.config');
const path = require('path');

module.exports = merge(common, {
    mode: 'production',
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },
    output:{
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
});
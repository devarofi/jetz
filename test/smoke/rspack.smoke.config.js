const path = require('path');
const HtmlWebpackPlugin = require('html-rspack-plugin');

module.exports = {
    mode: 'development',
    devtool: false,
    entry: './test/smoke/smoke.js',
    output: {
        filename: 'smoke.bundle.js',
        path: path.resolve(__dirname, 'out')
    },
    experiments: {
        css: true
    },
    module: {
        rules: [
            { test: /\.css$/i, type: 'css' },
            { test: /\.(png|svg|jpg|jpeg|gif)$/i, type: 'asset/resource' }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './test/smoke/index.html' })
    ]
};

let path = require('path');
let HtmlWebpackPlugin = require('html-webpack-plugin');
const { LibManifestPlugin } = require('webpack');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

module.exports = {
    entry: './app.js',
    mode:'production',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.css/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html'
        }),
        new WebpackManifestPlugin({
            fileName: 'manifest.json'
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
            publicPath: '/',
            serveIndex: true
        },
        compress: true
    },
};
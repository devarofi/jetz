let path = require('path');
let HtmlWebpackPlugin = require('html-webpack-plugin');
const { LibManifestPlugin } = require('webpack');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

module.exports = {
    entry: './index.js',
    mode:'production',
    output: {
        publicPath:'/public',
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.css/i,
                use: ['style-loader', 'css-loader']
            },
            {
              test: /\.(png|svg|jpg|jpeg|gif)$/i,
              type: 'asset/resource',
            },
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
        historyApiFallback: true,
        static: {
            directory: path.join(__dirname, 'dist'),
            publicPath: '/',
            serveIndex: true
        },
        compress: true
    },
};
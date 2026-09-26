const path = require('path');
const HtmlWebpackPlugin = require('html-rspack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

// SWC-powered bundler (Rspack) - replaces webpack.
// Transpilation & minification are handled by SWC internally.
export default (env, argv) => {
    const isProd = argv.mode === 'production';
    return {
        mode: isProd ? 'production' : 'development',
        entry: './index.js',
        output: {
            filename: isProd ? '[name].bundle.js' : 'bundle.js',
            path: path.resolve(__dirname, 'dist')
        },
        devtool: isProd ? false : 'inline-source-map',
        // native CSS handling (replaces style-loader + css-loader)
        experiments: {
            css: true
        },
        optimization: isProd
            ? {
                splitChunks: {
                    chunks: 'all',
                },
            }
            : undefined,
        module: {
            rules: [
                {
                    test: /\.css$/i,
                    type: 'css'
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
};

const path = require('path');
const HtmlWebpackPlugin = require('html-rspack-plugin');

// SWC-powered bundler (Rspack) - replaces webpack.
// Transpilation & minification are handled by SWC internally.
export default (env, argv) => {
    const isProd = argv.mode === 'production';
    return {
        mode: isProd ? 'production' : 'development',
        // Two entries: the routed app, plus the stress test. The stress test is a
        // self-mounting benchmark page (it mounts itself into #app and measures
        // its own timings), so it ships as its own document instead of a route -
        // mounting it through the router would double-render it into #app.
        entry: {
            main: './index.js',
            stress: './src/components/stress/stress-test.js'
        },
        output: {
            filename: '[name].bundle.js',
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
                    generator: {
                        filename: 'img/logo/[name][ext]'
                    }
                },
                {
                    // `?url` copies a file verbatim and hands back its URL. The
                    // playground preview resolves its import map against real ES
                    // modules, so it imports the library sources this way instead
                    // of duplicating them - the preview then runs the working tree
                    // rather than a published version. Both files land in one
                    // folder with stable names because jetz-ui.js imports './jetz.js'
                    // relatively and both must resolve to the same module instance.
                    test: /\.js$/,
                    resourceQuery: /url/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'lib/[name][ext]'
                    }
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './public/index.html',
                chunks: ['main']
            }),
            new HtmlWebpackPlugin({
                template: './public/stress.html',
                filename: 'stress.html',
                chunks: ['stress'],
                inject: 'body'
            })
        ],
        devServer: {
            historyApiFallback: true,
            static: {
                directory: path.join(__dirname, 'dist'),
                publicPath: '/',
                serveIndex: true
            },
            compress: true,
            // the playground preview runs in a sandboxed frame, which has an
            // opaque origin, so its fetch of ./lib/* is cross-origin and needs CORS
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        },
    };
};

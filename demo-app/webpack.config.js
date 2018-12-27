const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const plugins = [
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify(nodeEnv),
        },
    }),
    new HtmlWebpackPlugin({
        title: 'mse-player demo-app',
        template: 'index.html',
    }),
    new webpack.LoaderOptionsPlugin({
        options: {
            tslint: {
                emitErrors: true,
                failOnHint: true,
            },
        },
    }),
];

var config = {
    devtool: isProd ? 'hidden-source-map' : 'source-map',
    context: path.resolve('./src'),
    entry: {
        app: './index.ts',
    },
    output: {
        path: path.resolve('./dist'),
        filename: '[name].bundle.js',
    },
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.tsx?$/,
                exclude: [/\/node_modules\//],
                use: ['awesome-typescript-loader', 'source-map-loader'],
            },
            { test: /\.html$/, loader: 'html-loader' },
            { test: /\.css$/, loaders: ['style-loader', 'css-loader'] },
        ].filter(Boolean),
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: plugins,
    devServer: {
        contentBase: path.join(__dirname, 'dist/'),
        compress: true,
        port: 3000,
        hot: true,
    },
    watchOptions: {
        ignored: [/node_modules([\\]+|\/)+(?!@mse-player)/],
    },
};

module.exports = config;

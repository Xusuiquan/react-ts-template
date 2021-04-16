const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function resolve(dir) {
    return path.join(__dirname, '..', dir)
}

module.exports = {
    entry: path.join(__dirname, '../src/index.tsx'),
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, '../dist')
    },
    module: {
        rules: [{
            test: /\.js$/,
            use: ['babel-loader'],
            include: path.join(__dirname, '../src')
        }, {
            test: /\.(j|t)sx?$/,
            use: ['babel-loader'],
            include: path.join(__dirname, '../src'),
            exclude: /node_modules/
        }, {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
            exclude: /node_modules/,
        }, {
            test: /\.scss$/,
            include: path.join(__dirname, '../src'),
            use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
        }, {
            test: /\.less$/,
            include: path.join(__dirname, '../src'),
            use: ['style-loader', 'css-loader', 'postcss-loader', 'less-loader'],
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'public/index.html',
            inject: true
        })
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    devServer: {
        host: 'localhost',
        port: 3000,
        historyApiFallback: true,
        overlay: {
            errors: true
        },
        inline: true,
        hot: true
    }
}
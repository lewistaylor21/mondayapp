const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.js',
    board_view: './src/board_view.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      chunks: ['index']
    }),
    new HtmlWebpackPlugin({
      template: './public/board_view.html',
      filename: 'board_view.html',
      chunks: ['board_view']
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        monday: {
          test: /[\\/]node_modules[\\/](monday-sdk-js|monday-ui-react-core)[\\/]/,
          name: 'monday',
          chunks: 'all',
          priority: 10
        }
      }
    }
  },
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    compress: true,
    port: 8301,
    hot: true,
    https: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    }
  }
}; 
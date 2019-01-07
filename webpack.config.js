const path = require('path')

module.exports = {
  mode: 'production',
  entry: {
    adapter: './demo/adapter.ts',
    server: './demo/server.ts'
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: path.resolve('./tsconfig.webpack.json')
        }
      }
    ]
  }
}

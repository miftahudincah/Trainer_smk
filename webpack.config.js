// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
      },
      {
        test: /\.(js|mjs|jsx)$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: [
          /node_modules\/@mui/,
          /node_modules\/@emotion/,
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.mjs'],
  },
};
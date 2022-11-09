const fs = require('fs')
const getWebpackConfig = require('@nrwl/react/plugins/webpack')

module.exports = (config) => {
  if (config.devServer) {
    config.devServer.port = 8080
  }
  return getWebpackConfig(config)
}

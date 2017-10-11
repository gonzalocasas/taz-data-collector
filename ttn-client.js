const { data } = require('ttn');
const appID = process.env.TTN_APP_ID
const accessKey = process.env.TTN_ACCESS_KEY

const ttnClient = async (uplinkHandler) => {
  const client = await data(appID, accessKey)
  client.on('uplink', uplinkHandler)
}

module.exports = ttnClient

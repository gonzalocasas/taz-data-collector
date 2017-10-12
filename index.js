require('now-env').config()
const TTN = require('./ttn-client')
const AWS = require('./aws-storage')
const moment = require('moment')

// Minimal service metrics
let dataCollectorStartTime = Date.now()
let uplinksReceived = 0

// Configure uplink handler
const uplinkStorageHandler = (devID, payload) => {
  uplinksReceived++
  console.log(`Received uplink from device '${devID}'`)
  console.log(`Storing payload:`)
  console.log(payload)
  AWS.store(devID, payload)
}

// Kick off TTN MQTT client
TTN(uplinkStorageHandler)
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

// Start serving metrics page
module.exports = () => ({
  uplinksReceived,
  dataCollectorStartTime,
  dataCollectorStartTimeFormatted: moment(dataCollectorStartTime).fromNow()
})

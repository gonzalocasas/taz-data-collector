const util = require('util')
const AWS = require('aws-sdk')

const switches = [0, 1, 2, 3]
const defaultSwitchKey = 'switch%d'
const lastSwitchKey = 'last_switch_%d'
const cumulativeSwitchKey = 'cumulative_switch_%d'

const copySwitchValues = (source, target, {sourceKeyFormat = defaultSwitchKey, targetKeyFormat = defaultSwitchKey} = {}) => {
  for (let i of switches) {
    let keySource = util.format(sourceKeyFormat, i)
    let keyTarget = util.format(targetKeyFormat, i)

    target[keyTarget] = source[keySource]
  }
}

const buildQueryParams = (devID) => ({
  TableName: 'devices',
  Key: {
    device_name: devID
  }
})

const buildMessagesParams = (devID, payload) => {
  let fields = payload['payload_fields']
  let newItem = {
    device_name: devID,
    datetime: new Date().toISOString(),
    counter: payload['counter'],
    status: fields['status'],
    battery: fields['battery'],
    battery_percentage: fields['battery_percentage']
  }

  copySwitchValues(fields, newItem)
  copySwitchValues(fields, newItem, { sourceKeyFormat: cumulativeSwitchKey, targetKeyFormat: cumulativeSwitchKey })

  return [{ PutRequest: { Item: newItem } }]
}

const buildNewDeviceParams = (devID, payload) => {
  let fields = payload['payload_fields']
  let newItem = {
    device_name: devID,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    first_battery_value: fields['battery'],
    hardware_serial: payload['hardware_serial']
  }

  copySwitchValues(fields, newItem)
  copySwitchValues(fields, newItem, { targetKeyFormat: lastSwitchKey })

  return [{ PutRequest: { Item: newItem } }]
}

const buildUpdateDeviceParams = (devID, payload, existingItem) => {
  let fields = payload['payload_fields']

  existingItem['last_seen'] = new Date().toISOString()

  for (let i of switches) {
    let key = util.format(defaultSwitchKey, i)
    let keyLast = util.format(lastSwitchKey, i)
    let cumulativeKey = util.format(cumulativeSwitchKey, i)
    let value = fields[key]

    existingItem[key] += value
    existingItem[keyLast] = fields[cumulativeKey]
  }

  return [{
    PutRequest: {
      Item: existingItem
    }
  }]
}

const calculateAggregates = function (devID, payload, existingItem) {
  let fields = payload['payload_fields']

  // First copy all switch values to cumulative fields
  copySwitchValues(fields, fields, { targetKeyFormat: cumulativeSwitchKey })

  // And now update switch fields to contain non-aggregated values
  if (existingItem) {
    for (let i of switches) {
      let key = util.format(defaultSwitchKey, i)
      let keyLast = util.format(lastSwitchKey, i)
      let value = fields[key]

      // Status=1 means first transmission since power up, we move to next
      if (fields['status'] === 1) continue
      console.log(`Updating ${key} from previous ${existingItem[keyLast]} using transmitted value ${value}...`)

      // If status=0 and there's a previous key, we have two possibilities
      if (value >= existingItem[keyLast]) {
        // The value is greater (or equals) than the last one, so
        // the non-aggregated count is the difference between current and last
        fields[key] = value - existingItem[keyLast]
        console.log(`...by adding the diff: ${fields[key]}`)
      } else if (value < existingItem[keyLast]) {
        // If the value is smaller than the last one, because the
        // counter rolled over 255. We need to add 256 - last + current
        fields[key] = (256 - existingItem[keyLast] + value)
        console.log(`...after rollover to: ${fields[key]}`)
      }
    }
  }
}

const store = async (devID, payload) => {
  // Only store port 1 messages
  if (payload['port'] !== 1) {
    return
  }

  let documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
  })

  try {
    let data = await documentClient.get(buildQueryParams(devID)).promise()
    let existingItem = data ? data['Item'] : null
    calculateAggregates(devID, payload, existingItem)

    let writeParams = {
      'RequestItems': {
        'messages': buildMessagesParams(devID, payload)
      }
    }

    if (existingItem) {
      console.log(`Updating values of device ${devID}`)
      writeParams['RequestItems']['devices'] = buildUpdateDeviceParams(devID, payload, existingItem)
    } else {
      console.log(`Recording device ${devID} for the first time`)
      writeParams['RequestItems']['devices'] = buildNewDeviceParams(devID, payload)
    }

    let result = await documentClient.batchWrite(writeParams).promise()
    console.log(`Storage operation completed.`)
    console.log(result)
  } catch (err) {
    console.error(err)
  }
}

module.exports = {
  store
}

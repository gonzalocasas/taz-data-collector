const util = require('util')
const AWS = require('aws-sdk')

const switches = [0, 1, 2, 3]
const buildQueryParams = (devID) => ({
  TableName: 'devices',
  Key: {
    device_name: devID
  }
})

const buildMessagesParams = (devID, payload) => {
    let fields = payload['payload_fields']
    let newItem = {
        message_id: `${devID}-${Date.now()}`,
        device_name: devID,
        counter: payload['counter'],
        status: fields['status'],
        battery: fields['battery'],
        battery_percentage: fields['battery_percentage']
    };

    for (let i of switches) {
        let key = 'switch' + i
        let value = fields[key]
        newItem[key] = value
    }

    return [{ PutRequest: { Item: newItem } }]
}

const buildNewDeviceParams = (devID, payload) => {
    let fields = payload['payload_fields']
    let newItem = {
        device_name: devID,
        first_seen: Date.now(),
        first_battery_value: fields['battery'],
        hardware_serial: payload['hardware_serial']
    }

    for (let i of switches) {
        let key = 'switch' + i
        let keyLast = 'last_switch' + i
        let value = fields[key]

        newItem[key] = value
        newItem[keyLast] = value
    }

    return [{ PutRequest: { Item: newItem } }]
}

const buildUpdateDeviceParams = (devID, payload, existingItem) => {
    let fields = payload['payload_fields']

    for (let i of switches) {
        let key = 'switch' + i
        let keyLast = 'last_switch' + i
        let value = fields[key]

        // status=1 means first transmission since power up
        // If status=0 and there's a previous key, we have two possibilities
        if (fields['status'] == 0 && keyLast in existingItem) {
            if (value > existingItem[keyLast]) {
                // The value is greater than the last one, so, we need to add
                // the difference between last and current
                existingItem[key] += (value - existingItem[keyLast])
            } else if (value < existingItem[keyLast]) {
                // Or the value is smaller than the last one, because the
                // counter rolled over 255. We need to add 255-last + current.
                existingItem[key] += (255 - existingItem[keyLast] + value)
            }
        } else {
            existingItem[key] += value
        }

        // Then store the unmodified payload value as `last seen`
        existingItem[keyLast] = fields[key]
    }

    return [{
        PutRequest: {
            Item: existingItem
        }
    }]
}

const store = async(devID, payload) => {
    // Only store port 1 messages
    if (payload['port'] !== 1) {
        return;
    }

    let documentClient = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION
    });

    try {
        let data = await documentClient.get(buildQueryParams(devID)).promise()
        let writeParams = {
            'RequestItems': {
                'messages': buildMessagesParams(devID, payload)
            }
        }

        if (data && data['Item']) {
            console.log(`Updating values of device ${devID}`)
            writeParams['RequestItems']['devices'] = buildUpdateDeviceParams(devID, payload, data['Item'])
        } else {
            console.log(`Recording device ${devID} for the first time`)
            writeParams['RequestItems']['devices'] = buildNewDeviceParams(devID, payload)
        }

        let result = await documentClient.batchWrite(writeParams).promise()
        console.log(`Storage operation completed.`)
        console.log(result);
    } catch (err) {
        console.error(err)
    }
}

module.exports = {
    store
}

const AWS = require('aws-sdk')

const buildQueryParams = (devID) => ({
    TableName: 'devices',
    Key: {
        device_name: devID
    }
})

const buildMessagesParams = (devID, payload) => {
    let fields = payload['payload_fields']

    return [{
        PutRequest: {
            Item: {
                message_id: `${devID}-${Date.now()}`,
                device_name: devID,
                counter: payload['counter'],
                status: fields['status'],
                switch0: fields['switch0'],
                switch1: fields['switch1'],
                switch2: fields['switch2'],
                switch3: fields['switch3'],
                battery: fields['battery'],
                battery_percentage: fields['battery_percentage']
            }
        }
    }]
}

const buildNewDeviceParams = (devID, payload) => {
    let fields = payload['payload_fields']

    return [{
        PutRequest: {
            Item: {
                device_name: devID,
                first_seen: Date.now(),
                first_battery_value: fields['battery'],
                hardware_serial: payload['hardware_serial'],
                switch0: fields['switch0'],
                switch1: fields['switch1'],
                switch2: fields['switch2'],
                switch3: fields['switch3']
            }
        }
    }]
}

const buildUpdateDeviceParams = (devID, payload, existingItem) => {
    let fields = payload['payload_fields']

    for (let i of[0, 1, 2, 3]) {
        let key = 'switch' + i
        let value = fields[key]

        // Status=0 means the counters have accummulated values from before
        // and status=1 means the counters have been reset since the last tx
        if (fields['status'] == 0) {
            value -= existingItem[key]
        }

        existingItem[key] += value
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

    let writeParams = 1;

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

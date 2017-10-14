# Feedback Buttons: Data collector microservice

> Collect data from Feedback Buttons from MQTT into DynamoDB aggregated tables

Micro-service that connects to an MQTT data stream of [The Things Network](https://www.thethingsnetwork.org/) and stores the aggregated and historical results on [Amazon DynamoDB](https://aws.amazon.com/dynamodb/).

This component is designed to work with the **[Feedback Buttons](https://github.com/berkutta/lora_happy_buttons_embedded/)** by  [berkutta](https://github.com/berkutta/).

## Getting Started

### Prerequisites

Make sure you have [Node.js 8.x+](https://nodejs.org/en/) installed on your system.

### Installation

Open your terminal, go to the project's folder and run:

    npm install

Create a file named `node-secrets.json` at the top level of this project and enter the secrets  (values starting with the `@`) from the `now.json` file. Example :

    {
      "@ttn-access-key": "ttn-account-v2.oioioioioioi",
      "@aws-access-key-id": "iquwyeeuhdi234",
      "@aws-secret-access-key": "ks239r83hd903rj34i4",
    }

That's it! You're now ready to start the service.

### Usage

Starting the service is as simple as running the following:

    npm start

The service will start collecting and storing uplink messages.

## Data structures

### Embedded

The [feedback buttons](https://github.com/berkutta/lora_happy_buttons_embedded/) send a highly redundant data frame to cope with packet loss and network unreliability. Each data frame sends a counter of presses for each of the switches on the device, each taking one byte.

The following table describes application-specific fields:

| Field | Description |
| --- | --- |
| battery | Battery voltage |
| battery_percentage | Estimated remaining battery expressed as percentage |
| status | A value of `1` indicates this is the first transmission since power up, otherwise `0` |
| switch0 | Rolling over counter of switch *#0* presses since power up, represented as 1 byte (`0-255`) |
| switch1 | Rolling over counter of switch *#1* presses since power up, represented as 1 byte (`0-255`) |
| switch2 | Rolling over counter of switch *#2* presses since power up, represented as 1 byte (`0-255`) |
| switch3 | Rolling over counter of switch *#3* presses since power up, represented as 1 byte (`0-255`) |

### Permanent storage

Data from embedded devices is gathered by this service and stored permanently on [Amazon DynamoDB](https://aws.amazon.com/dynamodb/).

There are two tables containing aggregated and historical data:

**devices**

Keeps aggregated information about devices in the system.

| Field | Description |
| --- | --- |
| device_name | Device name, set as [primary partition key](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey) of the table. |
| first_battery_value | Battery voltage value recorded the first time the device has been seen by the system. Useful to calculate discharge rate. |
| first_seen | First time the device has been seen by the system. Expressed as ISO Date string (UTC+0) |
| hardware_serial | Hardware serial |
| last_seen | Last time the device has been seen by the system. Expressed as ISO Date string (UTC+0) |
| last_switch_0 | Last rolling over counter for switch *#0* sent by the device. |
| last_switch_1 | Last rolling over counter for switch *#0* sent by the device. |
| last_switch_2 | Last rolling over counter for switch *#0* sent by the device. |
| last_switch_3 | Last rolling over counter for switch *#0* sent by the device. |
| switch0 | Total count of switch *#0* presses. |
| switch1 | Total count of switch *#1* presses. |
| switch2 | Total count of switch *#2* presses. |
| switch3 | Total count of switch *#3* presses. |

**messages**

Keeps an append-only historical record of all messages sent from devices into the system.

| Field | Description |
| --- | --- |
| device_name | Device name, set as [primary partition key](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey) of the table. |
| datetime | Date/time of the message, set as [primary sort key](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey) of the table. Expressed as ISO Date string (UTC+0) |
| battery | Battery voltage |
| battery_percentage | Estimated remaining battery expressed as percentage |
| counter | LoRaWAN uplink frame counter |
| status | A value of `1` indicates this is the first transmission since power up, otherwise `0` |
| switch0 | Number of presses of switch *#0* since last transmitted, represented as 1 byte (`0-255`) |
| switch1 | Number of presses of switch *#1* since last transmitted, represented as 1 byte (`0-255`) |
| switch2 | Number of presses of switch *#2* since last transmitted, represented as 1 byte (`0-255`) |
| switch3 | Number of presses of switch *#3* since last transmitted, represented as 1 byte (`0-255`) |
| cumulative_switch_0 | Rolling over counter of switch *#0* presses since last transmitted, represented as 1 byte (`0-255`) |
| cumulative_switch_1 | Rolling over counter of switch *#1* presses since last transmitted, represented as 1 byte (`0-255`) |
| cumulative_switch_2 | Rolling over counter of switch *#2* presses since last transmitted, represented as 1 byte (`0-255`) |
| cumulative_switch_3 | Rolling over counter of switch *#3* presses since last transmitted, represented as 1 byte (`0-255`) |

## Switch mapping

The mapping between switch number and switch color is the following in the current setup:

| Switch # | Switch color |
| --- | --- |
| `0` | red |
| `1` | orange |
| `2` | yellow |
| `3` | green |

## License

This project is licensed under the MIT License, see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork it (<https://github.com/gonzalocasas/taz-data-collector>)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request :D

## Credits

Based on the embedded implementation of [feedback buttons](https://github.com/berkutta/lora_happy_buttons_embedded/) by  [@berkutta](https://github.com/berkutta/) of [kilobyte.ch](https://kilobyte.ch/).

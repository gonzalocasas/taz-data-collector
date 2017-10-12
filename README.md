# Zürich Tiefbauamt: Data collector microservice

> Collect LoRaWAN data streams into DynamoDB aggregated tables

Micro-service that connects to an MQTT data stream of [The Things Network](https://www.thethingsnetwork.org/) and stores the aggregated and historical results on [Amazon DynamoDB](https://aws.amazon.com/dynamodb/).

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

## License

This project is licensed under the MIT License, see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork it (<https://github.com/gonzalocasas/taz-data-collector>)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request :D

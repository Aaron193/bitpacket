# Bitpacket

Welcome to Bitpacket, a fast, reliable, and simple way to send binary packets between server and client via websockets.

## How does it work?

Server.js

```js
import bitpacket, { BitPacketTypes } from 'bitpacket';

const PORT = process.env.PORT || 3000;

// Define how your packets will look. NOTE: this project is in beta, schemas are planned to be nicer to create
const schemas = [
    8888,
    // Server-send schemas
    [
        {
            packetName: 'playerUpdate',
            packetID: 0, // this will be set automatically by the api
            dataSchema: [BitPacketTypes.Uint16, BitPacketTypes.Uint16, BitPacketTypes.Uint16, BitPacketTypes.Uint8, BitPacketTypes.Uint8],
            variableNames: ['x', 'y', 'id', 'type', 'info'],
        },
    ],
    // Client-send schemas
    [
        {
            packetName: 'mousemove',
            packetID: 0,
            dataSchema: [BitPacketTypes.Uint8],
            variableNames: ['angle'],
        },
    ],
];

const server = new bitpacket.Server(PORT, schemas);

// A client connects to the websocket
server.on('connection', socket => {
    socket.on('disconnect', () => {
        // client disconnected
    });

    socket.on('mousemove', data => {
        // server receives a message from the client based on the client-send schemas^
    });

    // Server sends a message to the client based on the server-send schemas^
    socket.send('playerUpdate', {
        x: 9999,
        y: 5493,
        id: 63,
        type: 0,
        info: 14,
    });
});
```

Client.js

```js
import bitpacket, { BitPacketTypes } from 'bitpacket';

const PORT = 3000;

const client = new bitpacket.Client(`ws://localhost:${PORT}`);

client.on('connection', () => {
    // send a packet to the server based on the client-send schema^
    client.send('mousemove', {
        angle: 49,
    });
    // disconnect from the server
    client.disconnect();
});

// Fired when the server disconnects the client
client.on('disconnect', () => {
    console.log('I have successfully disconnected');
});

// Fired when the server sends you an update, in this case
client.on('playerUpdate', data => {
    console.log(data);
});
```

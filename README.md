# wsbitpacket

Welcome to wsbitpacket, a fast, reliable, and simple way to send binary packets between server and client via websockets.

## Installation

```sh
npm install wsbitpacket
```

## Binary Types Support

| Type      | Range                          |
| --------- | ------------------------------ |
| Uint8     | 0 - 255                        |
| Uint16    | 0 - 65,535                     |
| Uint24    | 0 - 16,777,215                 |
| Uint32    | 0 - 4,294,967,295              |
| Int8      | -128 - 127                     |
| Int16     | -32,768 - 32,767               |
| Int24     | -8,388,608 - 8,388,607         |
| Int32     | -2,147,483,648 - 2,147,483,647 |
| BigInt64  | really big +/-                 |
| BigUint64 | even bigger +/-                |
| Float32   | 4 bytes of decimal             |
| Float64   | 8 bytes of decimal             |
| String    | unicode char 0-255 any length  |

## How does it work?

Server.js

```js
import bitpacket from 'wsbitpacket';

const PORT = process.env.PORT || 3000;

// Define how your packets will look
const schemas = new bitpacket.BitSchema(
    // Server schemas
    [
        { name: 'playerUpdate', data: { id: bitpacket.BinaryTypes.Uint8, x: bitpacket.BinaryTypes.Uint16, y: bitpacket.BinaryTypes.Uint16 } },
        { name: 'healthUpdate', data: { health: bitpacket.BinaryTypes.Uint8 } },
    ],
    // Client Schemas
    [
        { name: 'mousemove', data: { angle: bitpacket.BinaryTypes.Uint8 } },
        { name: 'chat', data: { message: bitpacket.BinaryTypes.String } },
        { name: 'bigNumber', data: { number: bitpacket.BinaryTypes.BigUint64 } },
    ]
);

const server = new bitpacket.Server(PORT, schemas);

// A client connects to the websocket
server.onConnection(socket => {
    socket.on('disconnect', () => {
        // client disconnected
    });

    socket.on('mousemove', data => {
        // server receives a message from the client based on the client-send schemas^
        // data: { angle: 49 }
    });
    client.on('bigNumber', data => {
        // data: {number: 9999999999999999999n }
    });

    // Server sends a message to the client based on the server-send schemas^
    socket.send('playerUpdate', {
        id: 63,
        x: 9999,
        y: 5493,
    });
});
```

Client.js

```js
import bitpacket from 'wsbitpacket';

const PORT = 3000;

const client = new bitpacket.Client(`ws://localhost:${PORT}`);

client.on('connection', () => {
    // send a packet to the server based on how you defined your client-send schemas^
    client.send('mousemove', {
        angle: 49,
    });
    client.send('bigNumber', {
        // when sending BigUint64 or BigInt64 make sure to put an "n" at the end of the numebr
        // or wrap it in BigInt()
        number: 9999999999999999999n,
    });
    // disconnect from the server
    client.disconnect();
});

client.on('disconnect', () => {
    // the client has disconnected from the server
});

// Fired when the server sends you an update, in this case, playerUpdate
client.on('playerUpdate', data => {
    // data: { id: 63, x: 9999, y: 5493 }
});
```

# Contribute

Found a problem or want to contrubute? Fork this **[repository][repo]** and leave **pull request**

**MIT License**

[repo]: https://github.com/Aaron193/bitpacket

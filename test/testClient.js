const bitpacket = require('../lib/main.js');

console.log('BITPACKET: ', bitpacket);

// start a test server
const PORT = 3000;

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
    ]
);

// start a bitpacket server
const server = new bitpacket.Server(PORT, schemas);
server.onConnection(socket => {
    socket.on('disconnect', () => {
        // client disconnected from the websocket
        console.log('FROM SERVER: client disconnected');
    });

    socket.on('mousemove', data => {
        console.log('SERVER GOT MOUSE ANGLE: ' + data.angle);
        // data.x, data.y, data.valueYouSend
        // client sent message with the
    });
    socket.on('chat', ({ message }) => {
        console.log(`client sent messge of ${message} to the server`);
    });
    socket.send('playerUpdate', {
        id: 63,
        x: 9999,
        y: 5493,
    });
});

// start a client connecting to the socket url
const client = new bitpacket.Client(`ws://localhost:${PORT}`);

client.on('connection', () => {
    console.log('i have connected to the server');
    client.send('mousemove', {
        angle: 49,
    });
    client.send('chat', {
        message: 'hello sir',
    });
    client.disconnect();
});

client.on('disconnect', () => {
    console.log('client disconnected');
});

client.on('playerUpdate', data => {
    console.log('client has received data:');
    console.log(data);
});

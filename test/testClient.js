const bitpacket = require('../lib/main.js');

// start a test server
const PORT = 3000;

const schemas = new bitpacket.BitSchema(
    // Server schemas
    [
        { name: 'playerUpdate', data: { id: bitpacket.BinaryTypes.Uint8, x: bitpacket.BinaryTypes.Uint16, y: bitpacket.BinaryTypes.Uint16 } },
        { name: 'healthUpdate', data: { health: bitpacket.BinaryTypes.Uint8 } },
        {
            name: 'superTest2',
            data: {
                Uint8: bitpacket.BinaryTypes.Uint8,
                Uint16: bitpacket.BinaryTypes.Uint16,
                Uint24: bitpacket.BinaryTypes.Uint24,
                Uint32: bitpacket.BinaryTypes.Uint32,
                Int8: bitpacket.BinaryTypes.Int8,
                Int16: bitpacket.BinaryTypes.Int16,
                Int24: bitpacket.BinaryTypes.Int24,
                Int32: bitpacket.BinaryTypes.Int32,
                BigInt64: bitpacket.BinaryTypes.BigInt64,
                BigUint64: bitpacket.BinaryTypes.BigUint64,
                Float32: bitpacket.BinaryTypes.Float32,
                Float64: bitpacket.BinaryTypes.Float64,
                String: bitpacket.BinaryTypes.String,
                _Uint8: bitpacket.BinaryTypes.Uint8,
                _Uint16: bitpacket.BinaryTypes.Uint16,
                _Uint24: bitpacket.BinaryTypes.Uint24,
                _Uint32: bitpacket.BinaryTypes.Uint32,
                _Int8: bitpacket.BinaryTypes.Int8,
                _Int16: bitpacket.BinaryTypes.Int16,
                _Int24: bitpacket.BinaryTypes.Int24,
                _Int32: bitpacket.BinaryTypes.Int32,
                _BigInt64: bitpacket.BinaryTypes.BigInt64,
                _BigUint64: bitpacket.BinaryTypes.BigUint64,
                _Float32: bitpacket.BinaryTypes.Float32,
                _Float64: bitpacket.BinaryTypes.Float64,
                _String: bitpacket.BinaryTypes.String,
            },
        },
    ],
    // Client Schemas
    [
        { name: 'mousemove', data: { angle: bitpacket.BinaryTypes.Uint8 } },
        { name: 'chat', data: { message: bitpacket.BinaryTypes.String, what: bitpacket.BinaryTypes.Uint8 } },

        {
            name: 'superTest',
            data: {
                Uint8: bitpacket.BinaryTypes.Uint8,
                Uint16: bitpacket.BinaryTypes.Uint16,
                Uint24: bitpacket.BinaryTypes.Uint24,
                Uint32: bitpacket.BinaryTypes.Uint32,
                Int8: bitpacket.BinaryTypes.Int8,
                Int16: bitpacket.BinaryTypes.Int16,
                Int24: bitpacket.BinaryTypes.Int24,
                Int32: bitpacket.BinaryTypes.Int32,
                BigInt64: bitpacket.BinaryTypes.BigInt64,
                BigUint64: bitpacket.BinaryTypes.BigUint64,
                Float32: bitpacket.BinaryTypes.Float32,
                Float64: bitpacket.BinaryTypes.Float64,
                String: bitpacket.BinaryTypes.String,
                _Uint8: bitpacket.BinaryTypes.Uint8,
                _Uint16: bitpacket.BinaryTypes.Uint16,
                _Uint24: bitpacket.BinaryTypes.Uint24,
                _Uint32: bitpacket.BinaryTypes.Uint32,
                _Int8: bitpacket.BinaryTypes.Int8,
                _Int16: bitpacket.BinaryTypes.Int16,
                _Int24: bitpacket.BinaryTypes.Int24,
                _Int32: bitpacket.BinaryTypes.Int32,
                _BigInt64: bitpacket.BinaryTypes.BigInt64,
                _BigUint64: bitpacket.BinaryTypes.BigUint64,
                _Float32: bitpacket.BinaryTypes.Float32,
                _Float64: bitpacket.BinaryTypes.Float64,
                _String: bitpacket.BinaryTypes.String,
            },
        },
    ]
);
const payload = {
    Uint8: 0xff,
    Uint16: 0xffff,
    Uint24: 0xffffff,
    Uint32: 0xffffffff,
    Int8: -84,
    Int16: -16383,
    Int24: -4194303,
    Int32: -5392736,
    BigInt64: BigInt(-9223372036854776000),
    BigUint64: BigInt(18442714073709552000),
    Float32: 99.3425,
    Float64: 9352.3425,
    String: 'This is my very long message that is being sent',
    _Uint8: 189,
    _Uint16: 61526,
    _Uint24: 0,
    _Uint32: 4294963840,
    _Int8: -19,
    _Int16: -14387,
    _Int24: -2192522,
    _Int32: -2141483644,
    _BigInt64: BigInt(122337203685477100),
    _BigUint64: BigInt(3442114073709552000),
    _Float32: 77.882,
    _Float64: 752.3017,
    _String: 'this is my string number 2 yay i hope it works',
};

// start a bitpacket server
const server = new bitpacket.Server(PORT, schemas);
server.onConnection((socket, req) => {
    const ipAddress = req.socket.remoteAddress;
    console.log(ipAddress);

    socket.on('disconnect', () => {
        // client disconnected from the websocket
        console.log('FROM SERVER: client disconnected');
    });

    socket.on('mousemove', data => {
        console.log('SERVER GOT MOUSE ANGLE: ' + data.angle);
        // data.x, data.y, data.valueYouSend
        // client sent message with the
    });
    socket.on('superTest', data => {
        console.log(data);
    });
    socket.on('chat', data => {
        console.log('client sent chat of', data);
    });
    socket.send('playerUpdate', {
        id: 63,
        x: 9999,
        y: 5493,
    });
    socket.send('superTest2', payload);
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
        what: 174,
    });
    superTest();
    client.disconnect();
});

client.on('disconnect', () => {
    console.log('client disconnected');
});

client.on('playerUpdate', data => {
    console.log('client has received data:');
    console.log(data);
});

client.on('superTest2', data => {
    console.log(data);
});

function superTest() {
    client.send('superTest', payload);
}

import { WebSocketServer } from 'ws';

import bitpacket, { BitPacketTypes } from '../lib/main.js';

// start a test server
const PORT = 3000;

const schemas = [
	8888, // ID to say that we sending schemas
	// server send packets
	[
		{
			// packetName, packetID, dataSchema, variableNames
			/*
             [55,255,19758,83,99] raw
             [ 55, 255, 77, 46, 83, 99 ] bit
            */
			packetName: 'playerUpdate',
			packetID: 0, // this will be set automatically by the api
			dataSchema: [BitPacketTypes.Uint16, BitPacketTypes.Uint16, BitPacketTypes.Uint16, BitPacketTypes.Uint8, BitPacketTypes.Uint8],
			variableNames: ['x', 'y', 'id', 'type', 'info'],
		},
		{
			packetName: 'worldUpdate',
			packetID: 1,
			dataSchema: [BitPacketTypes.String, BitPacketTypes.Uint32, BitPacketTypes.Uint8],
			variableNames: ['name', 'uid', 'type'],
		},
	],
	// client send packets
	[
		{
			packetName: 'mousemove',
			packetID: 0,
			dataSchema: [BitPacketTypes.Uint8],
			variableNames: ['angle'],
		},
	],
];

// const wss = new WebSocketServer({ port: PORT });

// wss.on('connection', (ws, req) => {
// 	// const ip = req.socket.remoteAddress;
// 	// console.log('user ip: ' + ip);
// 	ws.on('message', data => {
// 		// console.log('received: %s', data);
// 	});

// 	// setup the client schemas
// 	ws.send(JSON.stringify(schemas));

// 	// server tells the client playerUpdate
// 	ws.send(new Uint8Array([schemas[1][0].packetID, 55, 255, 77, 46, 83, 99]));
// });

// start a bitpacket server
const server = new bitpacket.Server(3000, schemas);
server.on('connection', socket => {
	socket.on('disconnect', () => {
		// client disconnected from the websocket
		console.log('FROM SERVER: client disconnected');
	});

	socket.on('mousemove', data => {
		console.log('SERVER GOT MOUSE ANGLE: ' + data.angle);
		// data.x, data.y, data.valueYouSend
		// client sent message with the
	});
	socket.send('playerUpdate', {
		x: 9999,
		y: 5493,
		id: 63,
		type: 0,
		info: 14,
	});
});

// start a client connecting to the socket url
const client = new bitpacket.Client(`ws://localhost:${PORT}`);

client.on('connection', () => {
	console.log('i have connected to the server');
	client.send('mousemove', {
		angle: 49,
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

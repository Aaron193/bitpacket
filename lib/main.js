import WebSocket, { WebSocketServer } from 'ws';

let typeID = 0;
export const BitPacketTypes = {
    Uint8: typeID++,
    Uint16: typeID++,
    Uint24: typeID++,
    Uint32: typeID++,
    Int8: typeID++,
    Int16: typeID++,
    Int24: typeID++,
    Int32: typeID++,
    String: typeID++,
};

const BitPacketDecoder = {
    [BitPacketTypes.Uint8]: function (arr, offset) {
        return {
            decoded: arr[offset++] & 0xff,
            offset: offset,
        };
    },
    [BitPacketTypes.Uint16]: function (arr, offset) {
        return {
            decoded: (arr[offset++] << 8) | (arr[offset++] & 0xff),
            offset: offset,
        };
    },
    [BitPacketTypes.Uint24]: function (arr, offset) {
        return {
            decoded: (arr[offset++] << 16) | (arr[offset++] << 8) | arr[offset++],
            offset: offset,
        };
    },
    [BitPacketTypes.Uint32]: function (arr, offset) {
        if (arr[offset + 1] << 24 >= 127)
            return {
                decoded: (arr[offset++] << 24) | (arr[offset++] << 16) | (arr[offset++] << 8) | arr[offset++],
                offset: offset,
            };
        return {
            decoded: arr[offset++] * (1 << 24) + arr[offset++] * (1 << 16) + arr[offset++] * (1 << 8) + arr[offset++],
            offset: offset,
        };
    },
    [BitPacketTypes.Int8]: function (arr, offset) {
        return {
            decoded: arr[offset++] - 0x80,
            offset: offset,
        };
    },
    [BitPacketTypes.Int16]: function (arr, offset) {
        return {
            decoded: ((arr[offset++] << 8) - 0x8000) | arr[offset++],
            offset: offset,
        };
    },
    [BitPacketTypes.Int24]: function (arr, offset) {
        return {
            decoded: ((arr[offset++] << 16) - 0x800000) | (arr[offset++] << 8) | arr[offset++],
            offset: offset,
        };
    },
    [BitPacketTypes.Int32]: function (arr, offset) {
        return {
            decoded: ((arr[offset++] << 24) - 0x80000000) | (arr[offset++] << 16) | (arr[offset++] << 8) | arr[offset++],
            offset: offset,
        };
    },
    [BitPacketTypes.String]: function (arr, offset) {
        const length = arr[offset++];
        let string = '';
        for (let i = 0; i < length; i++) {
            string += String.fromCharCode(arr[offset++]);
        }
        return {
            decoded: string,
            offset: offset,
        };
    },
};
const BitPacketEncoder = {
    [BitPacketTypes.Uint8]: function (binaryPacket, offset, dataValue) {
        binaryPacket[offset++] = dataValue & 0xff;
        return offset;
    },
    [BitPacketTypes.Uint16]: function (binaryPacket, offset, dataValue) {
        binaryPacket[offset++] = dataValue >> 8;
        binaryPacket[offset++] = dataValue & 0xff;
        return offset;
    },
    [BitPacketTypes.Uint24]: function (binaryPacket, offset, dataValue) {
        binaryPacket[offset++] = (dataValue >> 16) & 0xff;
        binaryPacket[offset++] = (dataValue >> 8) & 0xff;
        binaryPacket[offset++] = dataValue & 0xff;
        return offset;
    },
    [BitPacketTypes.Uint32]: function (binaryPacket, offset, dataValue) {
        binaryPacket[offset++] = (dataValue >> 24) & 0xff;
        binaryPacket[offset++] = (dataValue >> 16) & 0xff;
        binaryPacket[offset++] = (dataValue >> 8) & 0xff;
        binaryPacket[offset++] = dataValue & 0xff;
        return offset;
    },
    [BitPacketTypes.Int8]: function (binaryPacket, offset, dataValue) {
        binaryPacket[offset++] = dataValue + 0x80;
        return offset;
    },
    [BitPacketTypes.Int16]: function (binaryPacket, offset, dataValue) {
        binaryPacket[offset++] = ((dataValue + 0x8000) >> 8) & 0xff;
        binaryPacket[offset++] = (dataValue + 0x8000) & 0xff;
        return offset;
    },
    [BitPacketTypes.Int24]: function (binaryPacket, offset, dataValue) {
        binaryPacket[offset++] = ((dataValue + 0x800000) >> 16) & 0xff;
        binaryPacket[offset++] = ((dataValue + 0x800000) >> 8) & 0xff;
        binaryPacket[offset++] = (dataValue + 0x800000) & 0xff;
        return offset;
    },
    [BitPacketTypes.Int32]: function (binaryPacket, offset, dataValue) {
        binaryPacket[offset++] = ((dataValue + 0x80000000) >> 24) & 0xff;
        binaryPacket[offset++] = ((dataValue + 0x80000000) >> 16) & 0xff;
        binaryPacket[offset++] = ((dataValue + 0x80000000) >> 8) & 0xff;
        binaryPacket[offset++] = (dataValue + 0x80000000) & 0xff;
        return offset;
    },
    [BitPacketTypes.String]: function (binaryPacket, offset, string) {
        if (string.length > 0xff) throw new RangeError(`The maximum string length is 255. String with length of ${string.length} is too large!`);
        binaryPacket[offset++] = string.length & 0xff;
        for (let i = 0; i < string.length; i++) {
            binaryPacket[offset++] = string[i].charCodeAt() & 0xff;
        }
        return offset;
    },
};

class Client {
    constructor(socketUrl) {
        this.address = socketUrl;
        this.socket = new WebSocket(socketUrl);
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = () => this.onSocketOpen();
        this.socket.onclose = () => this.onSocketClose();
        this.socket.onmessage = message => this.onSocketMessage(message);
        this.socket.onerror = error => this.onSocketError(error);

        this.socketReady = false;

        this.SCHEMA_INIT_CODE = 8888;

        this.events = {};
        this.schemasClientSend = {
            /*
			[PACKET_UNIQUE_ID_NUM]: {
				packetName: string
				dataSchema: binaryType[]},
				variableNames: string[]
			}
			*/
        };
        this.schemasServerSend = {};
        this.schemaServerSendNameToId = {};
        this.schemaClientSendNameToId = {};

        this.schemaIDPool = 0;
    }
    onSocketOpen() {
        this.socketReady = true;
    }
    onSocketClose() {
        this.socketReady = false;
        this.events['disconnect']();
    }
    onSocketMessage(message) {
        const data = message.data;
        if (typeof data === 'object') {
            this.parseBinaryPacket(new Uint8Array(data));
        } else {
            const json = JSON.parse(data);
            if (json[0] === this.SCHEMA_INIT_CODE) {
                this.receivedSchemas(json);
            }
        }
    }
    onSocketError(error) {
        throw new Error('CLIENT WEBSCOKET ERROR: ' + error);
    }

    disconnect() {
        this.socket.close();
    }

    parseBinaryPacket(data) {
        const packetID = data[0];
        const {
            packetName, // the users chosen name for this packet
            dataSchema, // array of the BitPacketTypes
            variableNames, // users chosen variable names (so we can pass them through the callback)
        } = this.schemasServerSend[packetID];

        // Setup an object containing the data we will give the the client
        const decodedPacket = {};

        // Go through each decode the binary based on its schema types
        let offset = 1; // where the packet data will start ^we took index 0 as the id
        for (let i = 0; i < dataSchema.length; i++) {
            const binaryType = dataSchema[i];
            const decoded = BitPacketDecoder[binaryType](data, offset);
            offset = decoded.offset;

            decodedPacket[variableNames[i]] = decoded.decoded;
        }

        // grab the users callback and pass the decoded values
        const event = this.events[packetName];
        if (event) {
            event(decodedPacket);
        }
    }

    receivedSchemas(schemas) {
        if (this.schemasClientSend.length >= 256 || this.schemasServerSend.length >= 256) throw new Error("Too many packet types, as of right now there's only support for 256 unique packets");

        for (let i = 0; i < schemas[1].length; i++) {
            const { packetName, packetID, dataSchema, variableNames } = schemas[1][i];
            this.schemasServerSend[packetID] = {
                packetName: packetName,
                dataSchema: dataSchema,
                variableNames: variableNames,
            };
            this.schemaServerSendNameToId[packetName] = packetID;
        }
        for (let i = 0; i < schemas[2].length; i++) {
            const { packetName, packetID, dataSchema, variableNames } = schemas[2][i];
            this.schemasClientSend[packetID] = {
                packetName: packetName,
                dataSchema: dataSchema,
                variableNames: variableNames,
            };
            this.schemaClientSendNameToId[packetName] = packetID;
        }
        this.events['connection']();
    }
    send(name, data) {
        const schemaID = this.schemaClientSendNameToId[name];
        const { dataSchema, variableNames } = this.schemasClientSend[schemaID];
        const binaryPacket = [schemaID];

        let offset = 1;

        for (let i = 0; i < dataSchema.length; i++) {
            const binaryType = dataSchema[i];
            const dataValue = data[variableNames[i]];
            offset = BitPacketEncoder[binaryType](binaryPacket, offset, dataValue);
        }
        this.socket.send(new Uint8Array(binaryPacket));
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = callback;
        } else {
            throw new Error('Received a duplicate BitPacket Client event name');
        }
    }
}

class WSConnection {
    constructor(wsInstance, server) {
        this.server = server;
        this.ws = wsInstance;
        this.messageCallback = null;
        this.closeCallback = null;
        this.events = {};
        this.ws.onmessage = ({ data }) => {
            if (typeof data === 'object') this.parseBinaryPacket(new Uint8Array(data));
        };

        this.ws.onclose = () => {
            this.events['disconnect']();
        };
        this.ws.onerror = error => {
            this.events['error'](error);
        };
    }
    // server receives a packet from the client
    parseBinaryPacket(binary) {
        const packetID = binary[0];
        const { packetName, dataSchema, variableNames } = this.server.schemasClientSend[packetID];

        const decodedPacket = {};

        let offset = 1;
        for (let i = 0; i < dataSchema.length; i++) {
            const binaryType = dataSchema[i];
            const decoded = BitPacketDecoder[binaryType](binary, offset);
            offset = decoded.offset;

            decodedPacket[variableNames[i]] = decoded.decoded;
        }

        const event = this.events[packetName];
        if (event) {
            event(decodedPacket);
        }
    }

    send(name, data) {
        const schemaID = this.server.schemaServerSendNameToId[name];
        const { dataSchema, variableNames } = this.server.schemasServerSend[schemaID];
        const binaryPacket = [schemaID];

        let offset = 1;

        for (let i = 0; i < dataSchema.length; i++) {
            const binaryType = dataSchema[i];
            const dataValue = data[variableNames[i]];
            offset = BitPacketEncoder[binaryType](binaryPacket, offset, dataValue);
        }
        // console.log('encoded packet into ' + binaryPacket);
        this.ws.send(new Uint8Array(binaryPacket));
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = callback;
        } else {
            throw new Error('Received a duplicate BitPacket Server Websocket event name');
        }
    }
}

class Server {
    constructor(port, schemas) {
        this.events = {};
        this.schemasServerSend = {};
        this.schemasClientSend = {};
        this.schemaServerSendNameToId = {};
        this.schemaClientSendNameToId = {};

        for (let i = 0; i < schemas[1].length; i++) {
            const { packetName, packetID, dataSchema, variableNames } = schemas[1][i];
            this.schemasServerSend[packetID] = {
                packetName: packetName,
                dataSchema: dataSchema,
                variableNames: variableNames,
            };
            this.schemaServerSendNameToId[packetName] = packetID;
        }
        for (let i = 0; i < schemas[2].length; i++) {
            const { packetName, packetID, dataSchema, variableNames } = schemas[2][i];
            this.schemasClientSend[packetID] = {
                packetName: packetName,
                dataSchema: dataSchema,
                variableNames: variableNames,
            };
            this.schemaClientSendNameToId[packetName] = packetID;
        }

        this.port = port;
        this.wss = new WebSocketServer({ port: this.port });
        this.wss.on('connection', ws => {
            // tell the client the server send schemas so they can properly parse it
            ws.send(JSON.stringify(schemas));

            this.connection = new WSConnection(ws, this);
            this.events['connection'](this.connection);
        });
    }

    on(eventName, callback) {
        if (eventName !== 'connection') return console.log('right now, the server instance only should have the connection event');
        if (!this.events[eventName]) {
            this.events[eventName] = callback;
        } else {
            throw new Error('Received a duplicate BitPacket Server event name');
        }
    }
}
const bitpacket = {
    Client: Client,
    Server: Server,
};
export default bitpacket;

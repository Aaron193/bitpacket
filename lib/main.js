const { WebSocketServer, WebSocket } = require('ws');

let typeID = 0;

const BitPacketTypes = {
    Uint8: typeID++,
    Uint16: typeID++,
    Uint24: typeID++,
    Uint32: typeID++,
    Int8: typeID++,
    Int16: typeID++,
    Int24: typeID++,
    Int32: typeID++,
    BigInt64: typeID++,
    BigUint64: typeID++,
    Float32: typeID++,
    Float64: typeID++,
    String: typeID++,
};
const BitPacketBytes = {
    [BitPacketTypes.Uint8]: 1,
    [BitPacketTypes.Uint16]: 2,
    [BitPacketTypes.Uint24]: 3,
    [BitPacketTypes.Uint32]: 4,
    [BitPacketTypes.Int8]: 1,
    [BitPacketTypes.Int16]: 2,
    [BitPacketTypes.Int24]: 3,
    [BitPacketTypes.Int32]: 4,
    [BitPacketTypes.BigInt64]: 8,
    [BitPacketTypes.BigUint64]: 8,
    [BitPacketTypes.Float32]: 4,
    [BitPacketTypes.Float64]: 8,
    [BitPacketTypes.String]: -1,
};
DataView.prototype.setUint24 = function (pos, val) {
    this.setUint8(pos++, (val >> 16) & 0xff);
    this.setUint8(pos++, (val >> 8) & 0xff);
    this.setUint8(pos++, val & 0xff);
};
DataView.prototype.getUint24 = function (pos) {
    return (this.getUint8(pos++) << 16) | (this.getUint8(pos++) << 8) | this.getUint8(pos);
};
DataView.prototype.setInt24 = function (pos, val) {
    this.setUint8(pos++, ((val + 0x800000) >> 16) & 0xff);
    this.setUint8(pos++, ((val + 0x800000) >> 8) & 0xff);
    this.setUint8(pos++, (val + 0x800000) & 0xff);
};
DataView.prototype.getInt24 = function (pos) {
    return ((this.getUint8(pos++) << 16) - 0x800000) | (this.getUint8(pos++) << 8) | this.getUint8(pos);
};
DataView.prototype.setString = function (pos, string) {
    if (string.length > 0xff) throw new RangeError(`The maximum string length is 255. String with length of ${string.length} is too large!`);
    this.setUint8(pos++, string.length & 0xff);
    for (let i = 0; i < string.length; i++) {
        this.setUint8(pos++, string[i].charCodeAt() & 0xff);
    }
};
DataView.prototype.getString = function (pos) {
    const length = this.getUint8(pos++);
    let string = '';
    for (let i = 0; i < length; i++) {
        string += String.fromCharCode(this.getUint8(pos++));
    }
    return string;
};

const BitPacketDecoder = {
    [BitPacketTypes.Uint8]: DataView.prototype.getUint8,
    [BitPacketTypes.Uint16]: DataView.prototype.getUint16,
    [BitPacketTypes.Uint24]: DataView.prototype.getUint24,
    [BitPacketTypes.Uint32]: DataView.prototype.getUint32,
    [BitPacketTypes.Int8]: DataView.prototype.getInt8,
    [BitPacketTypes.Int16]: DataView.prototype.getInt16,
    [BitPacketTypes.Int24]: DataView.prototype.getInt24,
    [BitPacketTypes.Int32]: DataView.prototype.getInt32,
    [BitPacketTypes.BigInt64]: DataView.prototype.getBigInt64,
    [BitPacketTypes.BigUint64]: DataView.prototype.getBigUint64,
    [BitPacketTypes.Float32]: DataView.prototype.getFloat32,
    [BitPacketTypes.Float64]: DataView.prototype.getFloat64,
    [BitPacketTypes.String]: DataView.prototype.getString,
};
// BitPacketDecoder[typeId].bind(dv)(i)

const BitPacketEncoder = {
    [BitPacketTypes.Uint8]: DataView.prototype.setUint8,
    [BitPacketTypes.Uint16]: DataView.prototype.setUint16,
    [BitPacketTypes.Uint24]: DataView.prototype.setUint24,
    [BitPacketTypes.Uint32]: DataView.prototype.setUint32,
    [BitPacketTypes.Int8]: DataView.prototype.setInt8,
    [BitPacketTypes.Int16]: DataView.prototype.setInt16,
    [BitPacketTypes.Int24]: DataView.prototype.setInt24,
    [BitPacketTypes.Int32]: DataView.prototype.setInt32,
    [BitPacketTypes.BigInt64]: DataView.prototype.setBigInt64,
    [BitPacketTypes.BigUint64]: DataView.prototype.setBigUint64,
    [BitPacketTypes.Float32]: DataView.prototype.setFloat32,
    [BitPacketTypes.Float64]: DataView.prototype.setFloat64,
    [BitPacketTypes.String]: DataView.prototype.setString,
};

class BitSchema {
    constructor(serverSend, clientSend) {
        if (typeof serverSend !== 'object' || typeof clientSend !== 'object') {
            throw new TypeError('You did not enter 2 objects while constructing the MessageSchemas class');
        }
        this.serverId = 0;
        this.clientId = 0;

        this.GET_SCHEMA_ID = 'NoySLb23YnZZsSZ14gQAdynS';

        this.serverSend = serverSend;
        this.clientSend = clientSend;

        this.payload = [];

        // give the server/client schemas an id
        for (let i = 0; i < this.serverSend.length; i++) {
            this.serverSend[i].id = this.serverId++;
        }
        for (let i = 0; i < this.clientSend.length; i++) {
            this.clientSend[i].id = this.clientId++;
        }
        if (this.serverId > 255 || this.clientId > 255) throw new RangeError('You have surpassed 255 message schemas for the Server and/or the Client');

        this.payload[0] = this.GET_SCHEMA_ID;
        this.payload[1] = this.serverSend;
        this.payload[2] = this.clientSend;
    }
}

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

        this.GET_SCHEMA_ID = 'NoySLb23YnZZsSZ14gQAdynS';

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
            if (json[0] === this.GET_SCHEMA_ID) {
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

    parseBinaryPacket(binary) {
        let offset = 0;

        const reader = new DataView(binary.buffer);
        const packetID = BitPacketDecoder[BitPacketTypes.Uint8].bind(reader)(offset);
        offset += BitPacketBytes[BitPacketTypes.Uint8];

        const {
            packetName, // the users chosen name for this packet
            dataSchema, // array of the BitPacketTypes
        } = this.schemasServerSend[packetID];

        // Setup an object containing the data we will give the the client
        const decodedPacket = {};

        // Go through each decode the binary based on its schema types

        for (const prop in dataSchema) {
            const binaryType = dataSchema[prop];
            const bytes = BitPacketBytes[binaryType];
            if (bytes === -1) {
                const length = BitPacketDecoder[BitPacketTypes.Uint8].bind(reader)(offset);
                const decoded = BitPacketDecoder[binaryType].bind(reader)(offset);
                offset += 1 + (length & 255);
                decodedPacket[prop] = decoded;
                continue;
            }
            const decoded = BitPacketDecoder[binaryType].bind(reader)(offset);
            offset += bytes;
            decodedPacket[prop] = decoded;
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
            const { name, data, id } = schemas[1][i];
            this.schemasServerSend[id] = {
                packetName: name,
                dataSchema: data,
            };
            this.schemaServerSendNameToId[name] = id;
        }
        for (let i = 0; i < schemas[2].length; i++) {
            const { name, data, id } = schemas[2][i];

            this.schemasClientSend[id] = {
                packetName: name,
                dataSchema: data,
            };
            this.schemaClientSendNameToId[name] = id;
        }
        this.events['connection']();
    }
    send(name, data) {
        const schemaID = this.schemaClientSendNameToId[name];
        if (schemaID == undefined) {
            throw new Error(`You id not create a schema for this message! ${name}`);
        }
        const { dataSchema } = this.schemasClientSend[schemaID];
        let offset = 0;
        const binaryPacket = new DataView(new ArrayBuffer(0xffff));
        BitPacketEncoder[BitPacketTypes.Uint8].bind(binaryPacket)(offset, schemaID);
        offset += BitPacketBytes[BitPacketTypes.Uint8];

        for (const prop in dataSchema) {
            const binaryType = dataSchema[prop];
            const dataValue = data[prop];

            BitPacketEncoder[binaryType].bind(binaryPacket)(offset, dataValue);
            const bytes = BitPacketBytes[binaryType];
            // message is a string
            if (bytes === -1) {
                // length digit + whole string length
                offset += 1 + (dataValue.length & 0xff);
                continue;
            }
            offset += bytes;
        }
        const u8send = new Uint8Array(binaryPacket.buffer, 0, offset).slice();
        this.socket.send(u8send);
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = callback;
        } else {
            throw new Error('Received a duplicate BitPacket Client event name');
        }
    }
}
function getTime() {
    var hrtime = process.hrtime();
    return (hrtime[0] * 1000000 + hrtime[1] / 1000) / 1000;
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
        let offset = 0;
        const reader = new DataView(binary.buffer);
        const packetID = BitPacketDecoder[BitPacketTypes.Uint8].bind(reader)(offset);
        offset += BitPacketBytes[BitPacketTypes.Uint8];

        const { packetName, dataSchema } = this.server.schemasClientSend[packetID];

        const decodedPacket = {};

        for (const prop in dataSchema) {
            const binaryType = dataSchema[prop];
            const bytes = BitPacketBytes[binaryType];
            // parse a string
            if (bytes === -1) {
                const length = BitPacketDecoder[BitPacketTypes.Uint8].bind(reader)(offset);
                const decoded = BitPacketDecoder[binaryType].bind(reader)(offset);
                offset += 1 + (length & 255);
                decodedPacket[prop] = decoded;
                continue;
            }
            const decoded = BitPacketDecoder[binaryType].bind(reader)(offset);

            offset += bytes;
            decodedPacket[prop] = decoded;
        }

        const event = this.events[packetName];
        if (event) {
            event(decodedPacket);
        }
    }

    send(name, data) {
        const schemaID = this.server.schemaServerSendNameToId[name];
        const { dataSchema } = this.server.schemasServerSend[schemaID];
        let offset = 0;
        const binaryPacket = new DataView(new ArrayBuffer(0xffff));
        BitPacketEncoder[BitPacketTypes.Uint8].bind(binaryPacket)(offset, schemaID);
        offset += BitPacketBytes[BitPacketTypes.Uint8];

        for (const prop in dataSchema) {
            const binaryType = dataSchema[prop];
            const dataValue = data[prop];

            BitPacketEncoder[binaryType].bind(binaryPacket)(offset, dataValue);
            const bytes = BitPacketBytes[binaryType];
            // message is a string
            if (bytes === -1) {
                offset += 1 + (dataValue.length & 0xff);
                continue;
            }
            offset += bytes;
        }
        const u8send = new Uint8Array(binaryPacket.buffer, 0, offset).slice();
        this.ws.send(u8send);
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
    constructor(port, { payload }) {
        this.onConnectionCallback = null;
        this.schemasServerSend = {};
        this.schemasClientSend = {};
        this.schemaServerSendNameToId = {};
        this.schemaClientSendNameToId = {};

        for (let i = 0; i < payload[1].length; i++) {
            const { name, data, id } = payload[1][i];

            this.schemasServerSend[id] = {
                packetName: name,
                dataSchema: data,
            };
            this.schemaServerSendNameToId[name] = id;
        }
        for (let i = 0; i < payload[2].length; i++) {
            const { name, data, id } = payload[2][i];
            this.schemasClientSend[id] = {
                packetName: name,
                dataSchema: data,
            };
            this.schemaClientSendNameToId[name] = id;
        }

        this.port = port;
        this.wss = new WebSocketServer({ port: this.port });
        this.wss.on('connection', (ws, req) => {
            // tell the client the server send schemas so they can properly parse it
            ws.send(JSON.stringify(payload));

            this.connection = new WSConnection(ws, this);

            if (this.onConnectionCallback !== null) {
                this.onConnectionCallback(this.connection, req);
            }
        });
    }

    onConnection(callback) {
        this.onConnectionCallback = callback;
    }
}
const bitpacket = {
    Client: Client,
    Server: Server,
    BinaryTypes: BitPacketTypes,
    BitSchema: BitSchema,
};
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = bitpacket;
} else {
    window.bitpacket = bitpacket;
}

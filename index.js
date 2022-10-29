const { WebSocketServer: t, WebSocket: e } = require('ws');
let typeID = 0;
const BitPacketTypes = { Uint8: typeID++, Uint16: typeID++, Uint24: typeID++, Uint32: typeID++, Int8: typeID++, Int16: typeID++, Int24: typeID++, Int32: typeID++, BigInt64: typeID++, BigUint64: typeID++, Float32: typeID++, Float64: typeID++, String: typeID++ },
    BitPacketBytes = { [BitPacketTypes.Uint8]: 1, [BitPacketTypes.Uint16]: 2, [BitPacketTypes.Uint24]: 3, [BitPacketTypes.Uint32]: 4, [BitPacketTypes.Int8]: 1, [BitPacketTypes.Int16]: 2, [BitPacketTypes.Int24]: 3, [BitPacketTypes.Int32]: 4, [BitPacketTypes.BigInt64]: 8, [BitPacketTypes.BigUint64]: 8, [BitPacketTypes.Float32]: 4, [BitPacketTypes.Float64]: 8, [BitPacketTypes.String]: -1 };
(DataView.prototype.setUint24 = function (t, e) {
    this.setUint8(t++, (e >> 16) & 255), this.setUint8(t++, (e >> 8) & 255), this.setUint8(t++, 255 & e);
}),
    (DataView.prototype.getUint24 = function (t) {
        return (this.getUint8(t++) << 16) | (this.getUint8(t++) << 8) | this.getUint8(t);
    }),
    (DataView.prototype.setInt24 = function (t, e) {
        this.setUint8(t++, ((e + 8388608) >> 16) & 255), this.setUint8(t++, ((e + 8388608) >> 8) & 255), this.setUint8(t++, (e + 8388608) & 255);
    }),
    (DataView.prototype.getInt24 = function (t) {
        return ((this.getUint8(t++) << 16) - 8388608) | (this.getUint8(t++) << 8) | this.getUint8(t);
    }),
    (DataView.prototype.setString = function (t, e) {
        if (e.length > 255) throw RangeError(`The maximum string length is 255. String with length of ${e.length} is too large!`);
        this.setUint8(t++, 255 & e.length);
        for (let i = 0; i < e.length; i++) this.setUint8(t++, 255 & e[i].charCodeAt());
    }),
    (DataView.prototype.getString = function (t) {
        let e = this.getUint8(t++),
            i = '';
        for (let s = 0; s < e; s++) i += String.fromCharCode(this.getUint8(t++));
        return i;
    });
const BitPacketDecoder = { [BitPacketTypes.Uint8]: DataView.prototype.getUint8, [BitPacketTypes.Uint16]: DataView.prototype.getUint16, [BitPacketTypes.Uint24]: DataView.prototype.getUint24, [BitPacketTypes.Uint32]: DataView.prototype.getUint32, [BitPacketTypes.Int8]: DataView.prototype.getInt8, [BitPacketTypes.Int16]: DataView.prototype.getInt16, [BitPacketTypes.Int24]: DataView.prototype.getInt24, [BitPacketTypes.Int32]: DataView.prototype.getInt32, [BitPacketTypes.BigInt64]: DataView.prototype.getBigInt64, [BitPacketTypes.BigUint64]: DataView.prototype.getBigUint64, [BitPacketTypes.Float32]: DataView.prototype.getFloat32, [BitPacketTypes.Float64]: DataView.prototype.getFloat64, [BitPacketTypes.String]: DataView.prototype.getString },
    BitPacketEncoder = { [BitPacketTypes.Uint8]: DataView.prototype.setUint8, [BitPacketTypes.Uint16]: DataView.prototype.setUint16, [BitPacketTypes.Uint24]: DataView.prototype.setUint24, [BitPacketTypes.Uint32]: DataView.prototype.setUint32, [BitPacketTypes.Int8]: DataView.prototype.setInt8, [BitPacketTypes.Int16]: DataView.prototype.setInt16, [BitPacketTypes.Int24]: DataView.prototype.setInt24, [BitPacketTypes.Int32]: DataView.prototype.setInt32, [BitPacketTypes.BigInt64]: DataView.prototype.setBigInt64, [BitPacketTypes.BigUint64]: DataView.prototype.setBigUint64, [BitPacketTypes.Float32]: DataView.prototype.setFloat32, [BitPacketTypes.Float64]: DataView.prototype.setFloat64, [BitPacketTypes.String]: DataView.prototype.setString };
class BitSchema {
    constructor(t, e) {
        if ('object' != typeof t || 'object' != typeof e) throw TypeError('You did not enter 2 objects while constructing the MessageSchemas class');
        (this.serverId = 0), (this.clientId = 0), (this.GET_SCHEMA_ID = 'NoySLb23YnZZsSZ14gQAdynS'), (this.serverSend = t), (this.clientSend = e), (this.payload = []);
        for (let i = 0; i < this.serverSend.length; i++) this.serverSend[i].id = this.serverId++;
        for (let s = 0; s < this.clientSend.length; s++) this.clientSend[s].id = this.clientId++;
        if (this.serverId > 255 || this.clientId > 255) throw RangeError('You have surpassed 255 message schemas for the Server and/or the Client');
        (this.payload[0] = this.GET_SCHEMA_ID), (this.payload[1] = this.serverSend), (this.payload[2] = this.clientSend);
    }
}
class BitStreamClient {
    constructor(t, e) {
        (this.client = t), (this.size = e), (this.dv = new DataView(new ArrayBuffer(this.size))), (this.offset = 0);
    }
    add(t, e) {
        let i = this.client.schemaClientSendNameToId[t];
        if (void 0 == i) throw Error(`You id not create a schema for this message! ${t}`);
        let { dataSchema: s } = this.client.schemasClientSend[i];
        for (let n in (BitPacketEncoder[BitPacketTypes.Uint8].bind(this.dv)(this.offset, i), (this.offset += BitPacketBytes[BitPacketTypes.Uint8]), s)) {
            let o = s[n],
                c = e[n];
            BitPacketEncoder[o].bind(this.dv)(this.offset, c);
            let a = BitPacketBytes[o];
            if (-1 === a) {
                this.offset += 1 + (255 & c.length);
                continue;
            }
            this.offset += a;
        }
    }
    reset() {
        (this.dv = new DataView(new ArrayBuffer(this.size))), (this.offset = 0);
    }
    send() {
        this.client.socket.send(new Uint8Array(this.dv.buffer, 0, this.offset).slice());
    }
}
class Client {
    constructor(t) {
        (this.address = t), (this.socket = new e(t)), (this.socket.binaryType = 'arraybuffer'), (this.socket.onopen = () => this.onSocketOpen()), (this.socket.onclose = () => this.onSocketClose()), (this.socket.onmessage = t => this.onSocketMessage(t)), (this.socket.onerror = t => this.onSocketError(t)), (this.socketReady = !1), (this.GET_SCHEMA_ID = 'NoySLb23YnZZsSZ14gQAdynS'), (this.events = {}), (this.schemasClientSend = {}), (this.schemasServerSend = {}), (this.schemaServerSendNameToId = {}), (this.schemaClientSendNameToId = {}), (this.schemaIDPool = 0), (this.hasStream = !1);
    }
    useStream(t = 65535) {
        if (this.hasStream) throw Error('You have already created a stream for this connection');
        (this.hasStream = !0), (this.stream = new BitStreamClient(this, t));
    }
    onSocketOpen() {
        this.socketReady = !0;
    }
    onSocketClose() {
        (this.socketReady = !1), this.events.disconnect();
    }
    onSocketMessage(t) {
        let e = t.data;
        if ('object' == typeof e) this.parseBinaryPacket(new Uint8Array(e));
        else {
            let i = JSON.parse(e);
            i[0] === this.GET_SCHEMA_ID && this.receivedSchemas(i);
        }
    }
    onSocketError(t) {
        throw Error('CLIENT WEBSCOKET ERROR: ' + t);
    }
    disconnect() {
        this.socket.close();
    }
    parseBinaryPacket(t) {
        let e = 0,
            i = new DataView(t.buffer),
            s = BitPacketDecoder[BitPacketTypes.Uint8].bind(i)(e);
        e += BitPacketBytes[BitPacketTypes.Uint8];
        let { packetName: n, dataSchema: o } = this.schemasServerSend[s],
            c = {};
        for (let a in o) {
            let r = o[a],
                h = BitPacketBytes[r];
            if (-1 === h) {
                let p = BitPacketDecoder[BitPacketTypes.Uint8].bind(i)(e),
                    l = BitPacketDecoder[r].bind(i)(e);
                (e += 1 + (255 & p)), (c[a] = l);
                continue;
            }
            let d = BitPacketDecoder[r].bind(i)(e);
            (e += h), (c[a] = d);
        }
        let y = this.events[n];
        y && y(c), e < t.byteLength && this.parseBinaryPacket(t.slice(e));
    }
    receivedSchemas(t) {
        if (this.schemasClientSend.length >= 256 || this.schemasServerSend.length >= 256) throw Error("Too many packet types, as of right now there's only support for 256 unique packets");
        for (let e = 0; e < t[1].length; e++) {
            let { name: i, data: s, id: n } = t[1][e];
            (this.schemasServerSend[n] = { packetName: i, dataSchema: s }), (this.schemaServerSendNameToId[i] = n);
        }
        for (let o = 0; o < t[2].length; o++) {
            let { name: c, data: a, id: r } = t[2][o];
            (this.schemasClientSend[r] = { packetName: c, dataSchema: a }), (this.schemaClientSendNameToId[c] = r);
        }
        this.events.connection();
    }
    send(t, e) {
        let i = this.schemaClientSendNameToId[t];
        if (void 0 == i) throw Error(`You id not create a schema for this message! ${t}`);
        let { dataSchema: s } = this.schemasClientSend[i],
            n = 0,
            o = new DataView(new ArrayBuffer(65535));
        for (let c in (BitPacketEncoder[BitPacketTypes.Uint8].bind(o)(n, i), (n += BitPacketBytes[BitPacketTypes.Uint8]), s)) {
            let a = s[c],
                r = e[c];
            BitPacketEncoder[a].bind(o)(n, r);
            let h = BitPacketBytes[a];
            if (-1 === h) {
                n += 1 + (255 & r.length);
                continue;
            }
            n += h;
        }
        let p = new Uint8Array(o.buffer, 0, n).slice();
        this.socket.send(p);
    }
    on(t, e) {
        if (this.events[t]) throw Error('Received a duplicate BitPacket Client event name');
        this.events[t] = e;
    }
}
function getTime() {
    var t = process.hrtime();
    return (1e6 * t[0] + t[1] / 1e3) / 1e3;
}
class BitStreamServer {
    constructor(t, e) {
        (this.connection = t), (this.size = e), (this.dv = new DataView(new ArrayBuffer(this.size))), (this.offset = 0);
    }
    add(t, e) {
        let i = this.connection.server.schemaServerSendNameToId[t];
        if (void 0 == i) throw Error(`You id not create a schema for this message! ${t}`);
        let { dataSchema: s } = this.connection.server.schemasServerSend[i];
        for (let n in (BitPacketEncoder[BitPacketTypes.Uint8].bind(this.dv)(this.offset, i), (this.offset += BitPacketBytes[BitPacketTypes.Uint8]), s)) {
            let o = s[n],
                c = e[n];
            BitPacketEncoder[o].bind(this.dv)(this.offset, c);
            let a = BitPacketBytes[o];
            if (-1 === a) {
                this.offset += 1 + (255 & c.length);
                continue;
            }
            this.offset += a;
        }
    }
    reset() {
        (this.dv = new DataView(new ArrayBuffer(this.size))), (this.offset = 0);
    }
    send() {
        this.connection.ws.send(new Uint8Array(this.dv.buffer, 0, this.offset).slice());
    }
}
class WSConnection {
    constructor(t, e) {
        (this.server = e),
            (this.ws = t),
            (this.messageCallback = null),
            (this.closeCallback = null),
            (this.events = {}),
            (this.hasStream = !1),
            (this.ws.onmessage = ({ data: t }) => {
                'object' == typeof t && this.parseBinaryPacket(new Uint8Array(t));
            }),
            (this.ws.onclose = () => {
                this.events.disconnect();
            }),
            (this.ws.onerror = t => {
                this.events.error(t);
            });
    }
    useStream(t = 65535) {
        if (this.hasStream) throw Error('You have already created a stream for this connection');
        (this.hasStream = !0), (this.stream = new BitStreamServer(this, t));
    }
    parseBinaryPacket(t) {
        let e = 0,
            i = new DataView(t.buffer),
            s = BitPacketDecoder[BitPacketTypes.Uint8].bind(i)(e);
        e += BitPacketBytes[BitPacketTypes.Uint8];
        let { packetName: n, dataSchema: o } = this.server.schemasClientSend[s],
            c = {};
        for (let a in o) {
            let r = o[a],
                h = BitPacketBytes[r];
            if (-1 === h) {
                let p = BitPacketDecoder[BitPacketTypes.Uint8].bind(i)(e),
                    l = BitPacketDecoder[r].bind(i)(e);
                (e += 1 + (255 & p)), (c[a] = l);
                continue;
            }
            let d = BitPacketDecoder[r].bind(i)(e);
            (e += h), (c[a] = d);
        }
        let y = this.events[n];
        y && y(c);
    }
    send(t, e) {
        let i = this.server.schemaServerSendNameToId[t],
            { dataSchema: s } = this.server.schemasServerSend[i],
            n = 0,
            o = new DataView(new ArrayBuffer(65535));
        for (let c in (BitPacketEncoder[BitPacketTypes.Uint8].bind(o)(n, i), (n += BitPacketBytes[BitPacketTypes.Uint8]), s)) {
            let a = s[c],
                r = e[c];
            BitPacketEncoder[a].bind(o)(n, r);
            let h = BitPacketBytes[a];
            if (-1 === h) {
                n += 1 + (255 & r.length);
                continue;
            }
            n += h;
        }
        let p = new Uint8Array(o.buffer, 0, n).slice();
        this.ws.send(p);
    }
    on(t, e) {
        if (this.events[t]) throw Error('Received a duplicate BitPacket Server Websocket event name');
        this.events[t] = e;
    }
}
class Server {
    constructor(e, { payload: i }) {
        (this.onConnectionCallback = null), (this.schemasServerSend = {}), (this.schemasClientSend = {}), (this.schemaServerSendNameToId = {}), (this.schemaClientSendNameToId = {});
        for (let s = 0; s < i[1].length; s++) {
            let { name: n, data: o, id: c } = i[1][s];
            (this.schemasServerSend[c] = { packetName: n, dataSchema: o }), (this.schemaServerSendNameToId[n] = c);
        }
        for (let a = 0; a < i[2].length; a++) {
            let { name: r, data: h, id: p } = i[2][a];
            (this.schemasClientSend[p] = { packetName: r, dataSchema: h }), (this.schemaClientSendNameToId[r] = p);
        }
        (this.port = e),
            (this.wss = new t({ port: this.port })),
            this.wss.on('connection', (t, e) => {
                t.send(JSON.stringify(i)), (this.connection = new WSConnection(t, this)), null !== this.onConnectionCallback && this.onConnectionCallback(this.connection, e);
            });
    }
    onConnection(t) {
        this.onConnectionCallback = t;
    }
}
const bitpacket = { Client: Client, Server: Server, BinaryTypes: BitPacketTypes, BitSchema: BitSchema };
'undefined' != typeof module && void 0 !== module.exports ? (module.exports = bitpacket) : (window.bitpacket = bitpacket);

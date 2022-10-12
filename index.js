const { WebSocketServer: e, WebSocket: t } = require('ws');
let typeID = 0;
const BitPacketTypes = { Uint8: typeID++, Uint16: typeID++, Uint24: typeID++, Uint32: typeID++, Int8: typeID++, Int16: typeID++, Int24: typeID++, Int32: typeID++, String: typeID++ },
    BitPacketDecoder = {
        [BitPacketTypes.Uint8]: function (e, t) {
            return { decoded: 255 & e[t++], offset: t };
        },
        [BitPacketTypes.Uint16]: function (e, t) {
            return { decoded: (e[t++] << 8) | (255 & e[t++]), offset: t };
        },
        [BitPacketTypes.Uint24]: function (e, t) {
            return { decoded: (e[t++] << 16) | (e[t++] << 8) | e[t++], offset: t };
        },
        [BitPacketTypes.Uint32]: function (e, t) {
            return e[t + 1] << 24 >= 127 ? { decoded: (e[t++] << 24) | (e[t++] << 16) | (e[t++] << 8) | e[t++], offset: t } : { decoded: 16777216 * e[t++] + 65536 * e[t++] + 256 * e[t++] + e[t++], offset: t };
        },
        [BitPacketTypes.Int8]: function (e, t) {
            return { decoded: e[t++] - 128, offset: t };
        },
        [BitPacketTypes.Int16]: function (e, t) {
            return { decoded: ((e[t++] << 8) - 32768) | e[t++], offset: t };
        },
        [BitPacketTypes.Int24]: function (e, t) {
            return { decoded: ((e[t++] << 16) - 8388608) | (e[t++] << 8) | e[t++], offset: t };
        },
        [BitPacketTypes.Int32]: function (e, t) {
            return { decoded: ((e[t++] << 24) - 2147483648) | (e[t++] << 16) | (e[t++] << 8) | e[t++], offset: t };
        },
        [BitPacketTypes.String]: function (e, t) {
            let s = e[t++],
                n = '';
            for (let i = 0; i < s; i++) n += String.fromCharCode(e[t++]);
            return { decoded: n, offset: t };
        },
    },
    BitPacketEncoder = {
        [BitPacketTypes.Uint8]: function (e, t, s) {
            return (e[t++] = 255 & s), t;
        },
        [BitPacketTypes.Uint16]: function (e, t, s) {
            return (e[t++] = s >> 8), (e[t++] = 255 & s), t;
        },
        [BitPacketTypes.Uint24]: function (e, t, s) {
            return (e[t++] = (s >> 16) & 255), (e[t++] = (s >> 8) & 255), (e[t++] = 255 & s), t;
        },
        [BitPacketTypes.Uint32]: function (e, t, s) {
            return (e[t++] = (s >> 24) & 255), (e[t++] = (s >> 16) & 255), (e[t++] = (s >> 8) & 255), (e[t++] = 255 & s), t;
        },
        [BitPacketTypes.Int8]: function (e, t, s) {
            return (e[t++] = s + 128), t;
        },
        [BitPacketTypes.Int16]: function (e, t, s) {
            return (e[t++] = ((s + 32768) >> 8) & 255), (e[t++] = (s + 32768) & 255), t;
        },
        [BitPacketTypes.Int24]: function (e, t, s) {
            return (e[t++] = ((s + 8388608) >> 16) & 255), (e[t++] = ((s + 8388608) >> 8) & 255), (e[t++] = (s + 8388608) & 255), t;
        },
        [BitPacketTypes.Int32]: function (e, t, s) {
            return (e[t++] = ((s + 2147483648) >> 24) & 255), (e[t++] = ((s + 2147483648) >> 16) & 255), (e[t++] = ((s + 2147483648) >> 8) & 255), (e[t++] = (s + 2147483648) & 255), t;
        },
        [BitPacketTypes.String]: function (e, t, s) {
            if (s.length > 255) throw RangeError(`The maximum string length is 255. String with length of ${s.length} is too large!`);
            e[t++] = 255 & s.length;
            for (let n = 0; n < s.length; n++) e[t++] = 255 & s[n].charCodeAt();
            return t;
        },
    };
class BitSchema {
    constructor(e, t) {
        if ('object' != typeof e || 'object' != typeof t) throw TypeError('You did not enter 2 objects while constructing the MessageSchemas class');
        (this.serverId = 0), (this.clientId = 0), (this.GET_SCHEMA_ID = 'NoySLb23YnZZsSZ14gQAdynS'), (this.serverSend = e), (this.clientSend = t), (this.payload = []);
        for (let s = 0; s < this.serverSend.length; s++) this.serverSend[s].id = this.serverId++;
        for (let n = 0; n < this.clientSend.length; n++) this.clientSend[n].id = this.clientId++;
        if (this.serverId > 255 || this.clientId > 255) throw RangeError('You have surpassed 255 message schemas for the Server and/or the Client');
        (this.payload[0] = this.GET_SCHEMA_ID), (this.payload[1] = this.serverSend), (this.payload[2] = this.clientSend);
    }
}
class Client {
    constructor(e) {
        (this.address = e), (this.socket = new t(e)), (this.socket.binaryType = 'arraybuffer'), (this.socket.onopen = () => this.onSocketOpen()), (this.socket.onclose = () => this.onSocketClose()), (this.socket.onmessage = e => this.onSocketMessage(e)), (this.socket.onerror = e => this.onSocketError(e)), (this.socketReady = !1), (this.GET_SCHEMA_ID = 'NoySLb23YnZZsSZ14gQAdynS'), (this.events = {}), (this.schemasClientSend = {}), (this.schemasServerSend = {}), (this.schemaServerSendNameToId = {}), (this.schemaClientSendNameToId = {}), (this.schemaIDPool = 0);
    }
    onSocketOpen() {
        this.socketReady = !0;
    }
    onSocketClose() {
        (this.socketReady = !1), this.events.disconnect();
    }
    onSocketMessage(e) {
        let t = e.data;
        if ('object' == typeof t) this.parseBinaryPacket(new Uint8Array(t));
        else {
            let s = JSON.parse(t);
            s[0] === this.GET_SCHEMA_ID && this.receivedSchemas(s);
        }
    }
    onSocketError(e) {
        throw Error('CLIENT WEBSCOKET ERROR: ' + e);
    }
    disconnect() {
        this.socket.close();
    }
    parseBinaryPacket(e) {
        let t = e[0],
            { packetName: s, dataSchema: n } = this.schemasServerSend[t],
            i = {},
            o = 1;
        for (let c in n) {
            let r = n[c],
                a = BitPacketDecoder[r](e, o);
            (o = a.offset), (i[c] = a.decoded);
        }
        let h = this.events[s];
        h && h(i);
    }
    receivedSchemas(e) {
        if (this.schemasClientSend.length >= 256 || this.schemasServerSend.length >= 256) throw Error("Too many packet types, as of right now there's only support for 256 unique packets");
        for (let t = 0; t < e[1].length; t++) {
            let { name: s, data: n, id: i } = e[1][t];
            (this.schemasServerSend[i] = { packetName: s, dataSchema: n }), (this.schemaServerSendNameToId[s] = i);
        }
        for (let o = 0; o < e[2].length; o++) {
            let { name: c, data: r, id: a } = e[2][o];
            (this.schemasClientSend[a] = { packetName: c, dataSchema: r }), (this.schemaClientSendNameToId[c] = a);
        }
        this.events.connection();
    }
    send(e, t) {
        let s = this.schemaClientSendNameToId[e],
            { dataSchema: n } = this.schemasClientSend[s],
            i = [s],
            o = 1;
        for (let c in n) {
            let r = n[c],
                a = t[c];
            o = BitPacketEncoder[r](i, o, a);
        }
        this.socket.send(new Uint8Array(i));
    }
    on(e, t) {
        if (this.events[e]) throw Error('Received a duplicate BitPacket Client event name');
        this.events[e] = t;
    }
}
class WSConnection {
    constructor(e, t) {
        (this.server = t),
            (this.ws = e),
            (this.messageCallback = null),
            (this.closeCallback = null),
            (this.events = {}),
            (this.ws.onmessage = ({ data: e }) => {
                'object' == typeof e && this.parseBinaryPacket(new Uint8Array(e));
            }),
            (this.ws.onclose = () => {
                this.events.disconnect();
            }),
            (this.ws.onerror = e => {
                this.events.error(e);
            });
    }
    parseBinaryPacket(e) {
        let t = e[0],
            { packetName: s, dataSchema: n } = this.server.schemasClientSend[t],
            i = {},
            o = 1;
        for (let c in n) {
            let r = n[c],
                a = BitPacketDecoder[r](e, o);
            (o = a.offset), (i[c] = a.decoded);
        }
        let h = this.events[s];
        h && h(i);
    }
    send(e, t) {
        let s = this.server.schemaServerSendNameToId[e],
            { dataSchema: n } = this.server.schemasServerSend[s],
            i = [s],
            o = 1;
        for (let c in n) {
            let r = n[c],
                a = t[c];
            o = BitPacketEncoder[r](i, o, a);
        }
        this.ws.send(new Uint8Array(i));
    }
    on(e, t) {
        if (this.events[e]) throw Error('Received a duplicate BitPacket Server Websocket event name');
        this.events[e] = t;
    }
}
class Server {
    constructor(t, { payload: s }) {
        (this.onConnectionCallback = null), (this.schemasServerSend = {}), (this.schemasClientSend = {}), (this.schemaServerSendNameToId = {}), (this.schemaClientSendNameToId = {});
        for (let n = 0; n < s[1].length; n++) {
            let { name: i, data: o, id: c } = s[1][n];
            (this.schemasServerSend[c] = { packetName: i, dataSchema: o }), (this.schemaServerSendNameToId[i] = c);
        }
        for (let r = 0; r < s[2].length; r++) {
            let { name: a, data: h, id: d } = s[2][r];
            (this.schemasClientSend[d] = { packetName: a, dataSchema: h }), (this.schemaClientSendNameToId[a] = d);
        }
        (this.port = t),
            (this.wss = new e({ port: this.port })),
            this.wss.on('connection', e => {
                e.send(JSON.stringify(s)), (this.connection = new WSConnection(e, this)), null !== this.onConnectionCallback && this.onConnectionCallback(this.connection);
            });
    }
    onConnection(e) {
        this.onConnectionCallback = e;
    }
}
const bitpacket = { Client: Client, Server: Server, BinaryTypes: BitPacketTypes, BitSchema: BitSchema };
'undefined' != typeof module && void 0 !== module.exports ? (module.exports = bitpacket) : (window.bitpacket = bitpacket);

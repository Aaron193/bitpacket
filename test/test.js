import { WriteStream } from '../stream/WriteStream.js';
import { ReadStream } from '../stream/ReadStream.js';

const writeStream = new WriteStream();

const before = [0, 16, 128, 255, 0, 25, 715, 8372, 65535, 0, 6, 24, 186, 9273, 27553, 183628, 1927863, 16777215, 0, 27, 446, 7525, 93725, 273545, 9255836, 28153955, 927354782, 4294967295, -128, -63, -7, 0, 4, 63, 127, -32768, -2873, -936, -26, -7, 0, 6, 15, 283, 4327, 32767, -8388608, -917563, -75851, -9375, -486, -26, -7, 0, 4, 63, 926, 1846, 10473, 295736, 8388607, -2147483648, -295726351, -17238564, -4806437, -916734, -19274, -9167, -234, -72, -3, 0, 5, 32, 623, 3947, 19673, 662393, 1947523, 19057473, 927862936, 2147483647, 'Fourscore and seven years ago our fathers brought forth, on this continent, a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any '];

// BitPacketTypes.Uint8, BitPacketTypes.Uint8, BitPacketTypes.Uint16, BitPacketTypes.Uint8, BitPacketTypes.Uint8
// writeStream.writeUint8(55);
// writeStream.writeUint8(255);
// writeStream.writeUint16(19758);
// writeStream.writeUint8(83);
// writeStream.writeUint8(99);
// console.log(writeStream.getStream());
// [55,255,19758,83,99] raw
// [ 55, 255, 77, 46, 83, 99 ] bit

writeStream.writeUint8(0);
writeStream.writeUint8(16);
writeStream.writeUint8(128);
writeStream.writeUint8(255);

writeStream.writeUint16(0);
writeStream.writeUint16(25);
writeStream.writeUint16(715);
writeStream.writeUint16(8372);
writeStream.writeUint16(65535);

writeStream.writeUint24(0);
writeStream.writeUint24(6);
writeStream.writeUint24(24);
writeStream.writeUint24(186);
writeStream.writeUint24(9273);
writeStream.writeUint24(27553);
writeStream.writeUint24(183628);
writeStream.writeUint24(1927863);
writeStream.writeUint24(16777215);

writeStream.writeUint32(0);
writeStream.writeUint32(27);
writeStream.writeUint32(446);
writeStream.writeUint32(7525);
writeStream.writeUint32(93725);
writeStream.writeUint32(273545);
writeStream.writeUint32(9255836);
writeStream.writeUint32(28153955);
writeStream.writeUint32(927354782);
writeStream.writeUint32(4294967295);

writeStream.writeInt8(-128);
writeStream.writeInt8(-63);
writeStream.writeInt8(-7);
writeStream.writeInt8(0);
writeStream.writeInt8(4);
writeStream.writeInt8(63);
writeStream.writeInt8(127);

writeStream.writeInt16(-32768);
writeStream.writeInt16(-2873);
writeStream.writeInt16(-936);
writeStream.writeInt16(-26);
writeStream.writeInt16(-7);
writeStream.writeInt16(0);
writeStream.writeInt16(6);
writeStream.writeInt16(15);
writeStream.writeInt16(283);
writeStream.writeInt16(4327);
writeStream.writeInt16(32767);

writeStream.writeInt24(-8388608);
writeStream.writeInt24(-917563);
writeStream.writeInt24(-75851);
writeStream.writeInt24(-9375);
writeStream.writeInt24(-486);
writeStream.writeInt24(-26);
writeStream.writeInt24(-7);
writeStream.writeInt24(0);
writeStream.writeInt24(4);
writeStream.writeInt24(63);
writeStream.writeInt24(926);
writeStream.writeInt24(1846);
writeStream.writeInt24(10473);
writeStream.writeInt24(295736);
writeStream.writeInt24(8388607);

writeStream.writeInt32(-2147483648);
writeStream.writeInt32(-295726351);
writeStream.writeInt32(-17238564);
writeStream.writeInt32(-4806437);
writeStream.writeInt32(-916734);
writeStream.writeInt32(-19274);
writeStream.writeInt32(-9167);
writeStream.writeInt32(-234);
writeStream.writeInt32(-72);
writeStream.writeInt32(-3);
writeStream.writeInt32(0);
writeStream.writeInt32(5);
writeStream.writeInt32(32);
writeStream.writeInt32(623);
writeStream.writeInt32(3947);
writeStream.writeInt32(19673);
writeStream.writeInt32(662393);
writeStream.writeInt32(1947523);
writeStream.writeInt32(19057473);
writeStream.writeInt32(927862936);
writeStream.writeInt32(2147483647);

writeStream.writeString('Fourscore and seven years ago our fathers brought forth, on this continent, a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any ');

const readStream = new ReadStream(writeStream.getStream());
const after = [
	//
	readStream.readUint8(),
	readStream.readUint8(),
	readStream.readUint8(),
	readStream.readUint8(),

	readStream.readUint16(),
	readStream.readUint16(),
	readStream.readUint16(),
	readStream.readUint16(),
	readStream.readUint16(),

	readStream.readUint24(),
	readStream.readUint24(),
	readStream.readUint24(),
	readStream.readUint24(),
	readStream.readUint24(),
	readStream.readUint24(),
	readStream.readUint24(),
	readStream.readUint24(),
	readStream.readUint24(),

	readStream.readUint32(),
	readStream.readUint32(),
	readStream.readUint32(),
	readStream.readUint32(),
	readStream.readUint32(),
	readStream.readUint32(),
	readStream.readUint32(),
	readStream.readUint32(),
	readStream.readUint32(),
	readStream.readUint32(),

	readStream.readInt8(),
	readStream.readInt8(),
	readStream.readInt8(),
	readStream.readInt8(),
	readStream.readInt8(),
	readStream.readInt8(),
	readStream.readInt8(),

	readStream.readInt16(),
	readStream.readInt16(),
	readStream.readInt16(),
	readStream.readInt16(),
	readStream.readInt16(),
	readStream.readInt16(),
	readStream.readInt16(),
	readStream.readInt16(),
	readStream.readInt16(),
	readStream.readInt16(),
	readStream.readInt16(),

	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),
	readStream.readInt24(),

	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),
	readStream.readInt32(),

	readStream.readString(),
];

for (let i = 0; i < Math.max(after.length, before.length); i++) {
	if (before[i] !== after[i]) {
		console.log(i, before[i], after[i]);
	}
}
console.log('Test Succeeded');

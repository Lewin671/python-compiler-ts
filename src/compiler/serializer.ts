import * as zlib from 'zlib';
import { ByteCode } from '../types';

/**
 * ByteCode Serializer/Deserializer
 * Handles serialization of ByteCode including BigInt support which JSON lacks.
 * Uses Gzip compression to produce binary output.
 */
export class Serializer {
    /**
     * Serialize ByteCode to compressed Buffer
     */
    static serialize(bytecode: ByteCode): Buffer {
        const jsonString = JSON.stringify(bytecode, (_, value) => {
            if (typeof value === 'bigint') {
                return { __type: 'bigint', value: value.toString() };
            }
            return value;
        });
        return zlib.gzipSync(jsonString);
    }

    /**
     * Deserialize compressed Buffer to ByteCode
     */
    static deserialize(buffer: Buffer): ByteCode {
        const jsonString = zlib.gunzipSync(buffer).toString('utf-8');
        return JSON.parse(jsonString, (_, value) => {
            if (value && typeof value === 'object' && value.__type === 'bigint') {
                return BigInt(value.value);
            }
            return value;
        });
    }
}

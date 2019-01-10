export class DataViewHelper {
    private byteOffset = 0;

    constructor(private dataView: DataView) {}

    public setOffset(offset: number) {
        this.byteOffset = offset;
    }

    public isAtEndOfBuffer() {
        return this.byteOffset >= this.dataView.buffer.byteLength;
    }

    public skipBytes(count: number) {
        this.byteOffset += count;
    }

    public consumeUint8() {
        const value = this.dataView.getUint32(this.byteOffset);
        this.byteOffset += 1;
        return value;
    }

    public consumeUint16() {
        const value = this.dataView.getUint32(this.byteOffset);
        this.byteOffset += 2;
        return value;
    }

    public consumeUint32() {
        const value = this.dataView.getUint32(this.byteOffset);
        this.byteOffset += 4;
        return value;
    }

    public consumeString(length: number) {
        let stringValue = '';

        for (let i = 0; i < length; i++) {
            const charValue = this.dataView.getUint8(this.byteOffset).toString(16);
            stringValue += (charValue.length === 1) ? '0' + charValue : charValue;
            this.byteOffset++;
        }

        return stringValue;
    }
}
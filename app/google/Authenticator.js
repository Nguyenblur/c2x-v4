class GoogleAuthenticator {
    constructor() {
        this._codeLength = 6;
    }

    getCode(secret, timeSlice = null) {
        if (timeSlice === null) {
            timeSlice = Math.floor(Date.now() / 1000 / 30); // Thời gian tính theo 30 giây
        }

        const secretkey = this._base32Decode(secret);
        const time = Buffer.alloc(8);
        time.writeUInt32BE(timeSlice, 4);

        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha1', secretkey);
        hmac.update(time);

        const hash = hmac.digest();
        const offset = hash[hash.length - 1] & 0x0F;
        const hashpart = hash.slice(offset, offset + 4);

        let code = hashpart.readUInt32BE(0) & 0x7FFFFFFF;
        code %= Math.pow(10, this._codeLength);

        return code.toString().padStart(this._codeLength, '0');
    }

    _base32Decode(secret) {
        const base32chars = this._getBase32LookupTable();
        const base32charsFlipped = {};
        for (let i = 0; i < base32chars.length; i++) {
            base32charsFlipped[base32chars[i]] = i;
        }

        secret = secret.replace(/=+$/, '');
        const charCount = secret.length;
        const bits = [];
        let buffer = 0, bitsLength = 0;

        for (let i = 0; i < charCount; i++) {
            const value = base32charsFlipped[secret[i]];
            if (value === undefined) {
                throw new Error('Invalid base32 character');
            }

            buffer = (buffer << 5) | value;
            bitsLength += 5;

            if (bitsLength >= 8) {
                bits.push((buffer >> (bitsLength - 8)) & 0xFF);
                bitsLength -= 8;
            }
        }

        return Buffer.from(bits);
    }

    _getBase32LookupTable() {
        return [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
            'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
            'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
            'Y', 'Z', '2', '3', '4', '5', '6', '7',
            '='
        ];
    }
}

module.exports = GoogleAuthenticator;

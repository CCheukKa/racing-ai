export class MathExtra {

    static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    static map(value: number, inMin: number, inMax: number, outMin: number, outMax: number, clamped?: boolean): number {
        const mappedValue = (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
        if (clamped) {
            return this.clamp(mappedValue, outMin, outMax);
        }
        return mappedValue;
    }

    static interpolate(value: number, inPoints: number[], outPoints: number[]): number {
        if (inPoints.length !== outPoints.length) {
            throw new Error('Input and output points must have the same length');
        }
        if (value < inPoints[0]!) {
            return outPoints[0]!;
        }
        if (value > inPoints[inPoints.length - 1]!) {
            return outPoints[outPoints.length - 1]!;
        }

        let output = outPoints[0]!;
        for (let i = 0; i < inPoints.length - 1; i++) {
            if (value >= inPoints[i]! && value <= inPoints[i + 1]!) {
                const ratio = (value - inPoints[i]!) / (inPoints[i + 1]! - inPoints[i]!);
                output = outPoints[i]! + ratio * (outPoints[i + 1]! - outPoints[i]!);
                break;
            }
        }

        return output;
    }

    static sha1(...inputs: string[]): string {
        let input = inputs.join('|');

        // Adapted from https://geraintluff.github.io/sha1/
        function rotate_left(n: number, s: number) { return (n << s) | (n >>> (32 - s)); }
        function cvt_hex(val: number) {
            let str = "";
            for (let i = 7; i >= 0; i--) {
                str += ((val >>> (i * 4)) & 0x0f).toString(16);
            }
            return str;
        }
        let blockStart;
        const W = new Array(80);
        let H0 = 0x67452301;
        let H1 = 0xEFCDAB89;
        let H2 = 0x98BADCFE;
        let H3 = 0x10325476;
        let H4 = 0xC3D2E1F0;
        let A, B, C, D, E;
        let temp;

        // UTF-8 encode
        input = unescape(encodeURIComponent(input));
        const str_len = input.length;

        const word_array = [];
        for (let i = 0; i < str_len - 3; i += 4) {
            word_array.push(
                (input.charCodeAt(i) << 24) |
                (input.charCodeAt(i + 1) << 16) |
                (input.charCodeAt(i + 2) << 8) |
                (input.charCodeAt(i + 3))
            );
        }
        let i = str_len % 4;
        let tmp = 0;
        if (i === 0) {
            tmp = 0x080000000;
        } else if (i === 1) {
            tmp = (input.charCodeAt(str_len - 1) << 24) | 0x0800000;
        } else if (i === 2) {
            tmp = (input.charCodeAt(str_len - 2) << 24) | (input.charCodeAt(str_len - 1) << 16) | 0x08000;
        } else if (i === 3) {
            tmp = (input.charCodeAt(str_len - 3) << 24) | (input.charCodeAt(str_len - 2) << 16) | (input.charCodeAt(str_len - 1) << 8) | 0x80;
        }
        word_array.push(tmp);

        while ((word_array.length % 16) !== 14) word_array.push(0);

        word_array.push(str_len >>> 29);
        word_array.push((str_len << 3) & 0x0ffffffff);

        for (blockStart = 0; blockStart < word_array.length; blockStart += 16) {
            for (let i = 0; i < 16; i++) W[i] = word_array[blockStart + i];
            for (let i = 16; i < 80; i++) W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

            A = H0;
            B = H1;
            C = H2;
            D = H3;
            E = H4;

            for (let i = 0; i < 80; i++) {
                let f, k;
                if (i < 20) {
                    f = (B & C) | ((~B) & D);
                    k = 0x5A827999;
                } else if (i < 40) {
                    f = B ^ C ^ D;
                    k = 0x6ED9EBA1;
                } else if (i < 60) {
                    f = (B & C) | (B & D) | (C & D);
                    k = 0x8F1BBCDC;
                } else {
                    f = B ^ C ^ D;
                    k = 0xCA62C1D6;
                }
                temp = (rotate_left(A, 5) + f + E + k + W[i]) & 0x0ffffffff;
                E = D;
                D = C;
                C = rotate_left(B, 30);
                B = A;
                A = temp;
            }

            H0 = (H0 + A) & 0x0ffffffff;
            H1 = (H1 + B) & 0x0ffffffff;
            H2 = (H2 + C) & 0x0ffffffff;
            H3 = (H3 + D) & 0x0ffffffff;
            H4 = (H4 + E) & 0x0ffffffff;
        }
        return cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    }
}
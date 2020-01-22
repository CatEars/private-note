import 'jest'

import * as hex from './hex'

test('Can encode the simple cases', () => {
    const cases = [
        [0, '00'],
        [1, '01'],
        [2, '02'],
        [3, '03'],
        [10, '0a'],
        [50, '32'],
        [250, 'fa'],
        [254, 'fe'],
        [255, 'ff'],
    ]
    for (const [value, expected] of cases) {
        expect(hex.encodeByte(value)).toEqual(expected)
    }
})

test('Can encode byte always outputs a string', () => {
    for (let idx = -100; idx < 1000; ++idx) {
        const res = hex.encodeByte(idx)
        expect(typeof res).toEqual('string')
        // Even if we input "bad values" we want to end up with "sensible" values.
        expect(res).toMatch(/[0-9abcdef][0-9abcdef]/)
    }
})

test('Can encode a byte array', () => {
    const bytes = [0, 1, 2, 10, 50, 250, 255]
    const hexString = hex.hexEncode(bytes)
    expect(hexString).toEqual('0001020a32faff')
})

test('Can decode a hexstring', () => {
    const hexString = '0001020a32faff'
    const expected = [0, 1, 2, 10, 50, 250, 255]
    const res = hex.hexDecode(hexString)
    expect(res).toEqual(expected)
})

test('Can decode any hex byte', () => {
    const strItems = '0123456789abcdef'
    for (let first = 0; first < 16; ++first) {
        for (let second = 0; second < 16; ++second) {
            const hexCase = strItems[first] + strItems[second]
            const expected = first * 16 + second
            expect(hex.decodeByte(hexCase)).toEqual(expected)
        }
    }
})

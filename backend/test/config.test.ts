import 'jest'

import * as config from '../src/config'

test('Can set config and that updates the config values', () => {
    config.setConfiguration({
        'enable-express-logging': false,
    })

    expect(config.Config.enableExpressLogging()).toEqual(false)

    config.setConfiguration({
        'enable-express-logging': true,
    })

    expect(config.Config.enableExpressLogging()).toEqual(true)
})

import 'jest'
import * as fs from 'fs'

import * as config from '../src/config'
import { logger } from '../src/logger'

logger.level = 'silent'

const CONFIG_FILE = './test_config.json'

const sleepMs = (ms: number) =>
    new Promise((resolve, reject) => {
        setTimeout(resolve, ms)
    })

const writeConfigFile = (data: any) => {
    const content = JSON.stringify(data)
    fs.writeFileSync(CONFIG_FILE, content, { encoding: 'utf8' })
}

const removeConfigFile = () => {
    fs.unlinkSync(CONFIG_FILE)
}

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

test('Can read configuration files', () => {
    writeConfigFile({ 'enable-express-logging': true })

    config.initConfigurationWatch(CONFIG_FILE)
    const value = config.Config.enableExpressLogging()
    expect(value).toEqual(true)

    removeConfigFile()
})

import EventEmitter from 'events'
import * as fs from 'fs'
import { logger } from './logger'
import * as _ from 'lodash'

export const ENABLE_EXPRESS_LOGGING = process.env.ENABLE_EXPRESS_LOGGING || ''

export const CONFIGURATION_FILE = process.env.CONFIGURATION_FILE || ''

const configUpdatedEmitter = new EventEmitter()

export const reloadConfiguration = () => {
    const data = JSON.parse(
        fs.readFileSync(CONFIGURATION_FILE, { encoding: 'utf8' })
    )
    setConfiguration(data)
}

export const setConfiguration = (data: any) => {
    configUpdatedEmitter.emit('config-updated', data)
}

export const initConfigurationWatch = () => {
    if (CONFIGURATION_FILE && fs.existsSync(CONFIGURATION_FILE)) {
        fs.watchFile(CONFIGURATION_FILE, (curr: fs.Stats, prev: fs.Stats) => {
            const itemsOfInterest = {
                mtime: curr.mtime,
                previousMtime: prev.mtime,
            }
            logger.info(itemsOfInterest, 'Configuration file updated')
            reloadConfiguration()
        })
        reloadConfiguration()
    } else if (CONFIGURATION_FILE) {
        throw new Error(
            `Configuration file: ${CONFIGURATION_FILE} does not exist`
        )
    } else {
        logger.info(
            'No configuration file specified, wont watch for configuration updates'
        )
    }
}

export const ConfigLink = (configPath: string, defaultValue: any) => {
    let value = defaultValue
    configUpdatedEmitter.on('config-updated', (data: any) => {
        value = _.get(data, configPath)
    })

    return () => value
}

export const Config = {
    enableExpressLogging: ConfigLink(
        'enable-express-logging',
        ENABLE_EXPRESS_LOGGING
    ),
}

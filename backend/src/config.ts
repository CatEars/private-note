import EventEmitter from 'events'
import * as fs from 'fs'
import { logger } from './logger'
import * as _ from 'lodash'

export const ENABLE_EXPRESS_LOGGING = process.env.ENABLE_EXPRESS_LOGGING || ''

export const CONFIGURATION_FILE = process.env.CONFIGURATION_FILE || ''

const configUpdatedEmitter = new EventEmitter()

export const reloadConfiguration = (
    configFile: string = CONFIGURATION_FILE
) => {
    const data = JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8' }))
    setConfiguration(data)
}

export const setConfiguration = (data: any) => {
    configUpdatedEmitter.emit('config-updated', data)
}

export const initConfigurationWatch = (
    configFile: string = CONFIGURATION_FILE
) => {
    if (configFile && fs.existsSync(configFile)) {
        fs.watchFile(configFile, (curr: fs.Stats, prev: fs.Stats) => {
            const itemsOfInterest = {
                mtime: curr.mtime,
                previousMtime: prev.mtime,
            }
            logger.info(itemsOfInterest, 'Configuration file updated')
            reloadConfiguration(configFile)
        })
        logger.info(
            `Configuration file ${configFile} available. Watch for changes!`
        )
        reloadConfiguration(configFile)
    } else if (configFile) {
        throw new Error(
            `Configuration file: ${configFile} does not exist, cannot watch`
        )
    } else {
        logger.info(
            'No configuration file specified, wont watch for configuration updates'
        )
    }
}

export const stopConfigurationWatch = (
    configFile: string = CONFIGURATION_FILE
) => {
    if (configFile && fs.existsSync(configFile)) {
        fs.unwatchFile(configFile)
        logger.info(`No longer watching config file: ${configFile}`)
    } else if (configFile) {
        throw new Error(
            `Configuration file: ${configFile} does not exist, cannot unwatch`
        )
    } else {
        logger.info('No configuration file specified, wont unwatch')
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

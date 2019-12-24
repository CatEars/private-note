import { ERROR_FILE, INFO_FILE, LOG_MODE, LOG_PLUGIN_FILE } from './config'

import winston from 'winston'

export const logger = winston.createLogger({
    level: LOG_MODE,
    format: winston.format.json(),
    defaultMeta: {
        service: 'private-note',
    },

    transports: [
        new winston.transports.File({
            filename: ERROR_FILE,
            level: 'error',
        }),
        new winston.transports.File({
            filename: INFO_FILE,
        }),
    ],
})

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    )
}

if (LOG_PLUGIN_FILE) {
    try {
        const logPlugin = require(LOG_PLUGIN_FILE) as LogPlugin
        logPlugin.applyPlugin(logger)
    } catch (err) {
        logger.error({
            message: `Could not load logPlugin from: ${LOG_PLUGIN_FILE}`,
            error: err,
        })
    }
}

/**
 * Interface that any log plugin has to conform to.
 */
export interface LogPlugin {
    /**
     * Takes a single argument, the winston logger, and applies anything in the
     * plugin to that logger.
     */
    applyPlugin(logger: winston.Logger)
}

const fs = require('fs')
const path = require('path')
const colors = require('colors')
const moment = require('moment')
const mkdirp = require('mkdirp')
const winston = require('winston')
require('winston-daily-rotate-file')
const { calculateTime, handleDatum, handleDefault, levels } = require('./utils/common')

const localPath = path.join(path.dirname(__dirname), '../logs')
const servePath = `/data/logs/`
const development = process.env.NODE_ENV === 'development'
const production = process.env.NODE_ENV === 'production'
const situation = !(development || production)
const root = !situation ? servePath : localPath

/**
 * Main Process
 * @param {Object} config attribute
 */
function logger (config = {}) {
  // default
  const defaults = {
    appName: 'app',
    automate: true,
    dailyRotateFile: {
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
    },
    fileName: 'app',
    format: winston.format.json(),
    root,
    useKoa: false,
  }

  // merge
  const options = Object.assign({}, defaults, config)
  let logsPath = path.join(options.root, options.appName)

  // log output directory
  if (!fs.existsSync(logsPath)) {
    try {
      mkdirp.sync(logsPath)
    } catch (err) {
      console.log(colors.red(`Create '${servePath}' directory is failure!`))
      logsPath = path.join(localPath, options.appName)
      mkdirp.sync(logsPath)
    }
  }

  const createLogger = data => winston.createLogger(data)
  const timestamp = () => moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  const { datePattern, maxFiles, maxSize } = options.dailyRotateFile

  const openMeans = {}
  const colorize = () => options.useKoa ? { message: true } : {}
  levels.forEach(data => {
    const logger = createLogger({
      level: 'verbose',
      format: options.format,
      transports: [
        new (winston.transports.DailyRotateFile)({
          datePattern,
          filename: path.join(logsPath, `${options.fileName}.${data.type}-%DATE%.log`),
          maxFiles,
          maxSize,
        }),
      ],
    })

    // local or not “verbose”, log will output in Terminal
    if (situation || data.type !== 'verbose') {
      logger.add(new winston.transports.Console({
        format: winston.format.combine(
          // winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize(colorize()),
          winston.format.printf(info => {
            const { level, message } = info
            const news = options.useKoa ? message : colors[data.color](JSON.stringify(message))
            const response = `[${timestamp()}][${data.type}] ${data.icon} \n${news}`
            return response
          }),
        ),
      }))
    }

    openMeans[data.type] = logger
  })

  /**
   * Write access to the records
   * @param {Object} data
   */
  function handleLogger ({ level, datum } = {}) {
    const data = Object.assign({}, datum, {
      appName: options.appName,
      level: level.type,
      timestamp: timestamp(),
    })
    openMeans[level.type][level.type](data)
  }

  /**
   * bind ctx.logger
   * @param {Object} ctx
   */
  function handleDaily ({ ctx } = {}) {
    const result = {}
    levels.forEach(data => {
      const content = {
        error: null,
        message: {},
      }

      result[data.type] = (...args) => {
        if (args.length > 0) {
          const temp = args[0]
          if (data.type === 'error') {
            content.error = temp
            content.message = args[1] || {}
          } else {
            content.message = temp
          }
        }

        let datum = {}
        if (options.useKoa) {
          datum = handleDatum({ ctx, err: content.error, message: content.message })
        } else {
          datum = handleDefault({ err: content.error, message: content.message })
        }

        handleLogger({
          level: data,
          datum,
        })
      }
    })

    return result
  }

  /**
   * return middleware function
   * @param {Object} ctx
   * @param {Function} next
   */
  async function log (ctx, next) {
    const start = Date.now()
    const regex = /\.(js|css|png|ico|bmp|jpg|gif|webp|jpe|js?.|css?.|png?.|ico?.|bmp?.|jpg?.|gif?.|webp?.|jpe?.|redirect?.)/ig

    ctx.logger = handleDaily({ ctx })

    if (options.automate) {
      ctx.res.on('finish', () => {
        if (regex.test(ctx.req.url)) {
          return false
        }
        handleLogger({
          level: { type: 'verbose', icon: '✈' },
          datum: handleDatum({ ctx, time: calculateTime(start) }),
        })
      })
    }
    return next().catch(err => {
      handleLogger({
        level: { type: 'error', icon: '✖' },
        datum: handleDatum({ ctx, err, time: calculateTime(start) }),
      })
    })
  }

  if (options.useKoa) {
    return log
  } else {
    return handleDaily()
  }
}

module.exports = logger

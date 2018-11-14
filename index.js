const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const moment = require('moment')
const mkdirp = require('mkdirp')
const winston = require('winston')
require('winston-daily-rotate-file')
const { calculateTime, handleDatum, handleDefault, levels } = require('./utils/common')

const development = process.env.NODE_ENV === 'development'
const production = process.env.NODE_ENV === 'production'
const situation = !(development || production)

/**
 * 处理日志的主流程〜
 * @param {Object} config 自定义的属性
 */
function logger (config = {}) {
  // 默认配置
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
    root: path.join(path.dirname(__dirname), '../logs'),
    useKoa: false,
  }

  // 合并配置
  const options = Object.assign({}, defaults, config)
  // 日志输出目录
  const logsPath = path.join(options.root, options.appName)
  if (!fs.existsSync(logsPath)) {
    mkdirp.sync(logsPath)
  }

  const createLogger = data => winston.createLogger(data)
  const timestamp = () => moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  const { datePattern, maxFiles, maxSize } = options.dailyRotateFile

  const openMeans = {}
  const colorize = () => options.useKoa ? { message: true } : {}
  levels.forEach(data => {
    // 创建输出目录、日记文件
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

    // 本地、其它环境非verbose都输出到控制台
    if (situation || data.type !== 'verbose') {
      logger.add(new winston.transports.Console({
        format: winston.format.combine(
          // winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize(colorize()),
          winston.format.printf(info => {
            const { level, message } = info
            const news = options.useKoa ? message : chalk[data.color](JSON.stringify(message))
            const response = `[${timestamp()}][${level}] ${data.icon} \n${news}`
            return response
          }),
        ),
      }))
    }

    openMeans[data.type] = logger
  })

  /**
   * 往文档里写访问记录
   * @param {Object} 对象
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
   * 公开日志方法到ctx.logger上
   * @param {Object} ctx
   */
  function handleDaily ({ ctx } = {}) {
    const result = {}
    levels.forEach(data => {
      const content = {
        error: null,
        message: {},
      }

      // 公开的方法只有为error时接收两个参数（第一个参数为err，第二个为message），其它情况为一个(message)
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
   * 返回中间件函数
   * @param {Object} ctx
   * @param {Function} next
   */
  async function log (ctx, next) {
    const start = Date.now()

    // 把公开的日志方法挂载到ctx.logger
    ctx.logger = handleDaily({ ctx })

    // 是否需要自动记所有请求的日志
    if (options.automate) {
      ctx.res.on('finish', () => {
        // 排除掉请求favicon.ico的情况
        const regex = /\.(js|css|png|ico|bmp|jpg|gif|webp|jpe|js?.|css?.|png?.|ico?.|bmp?.|jpg?.|gif?.|webp?.|jpe?.)/ig
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

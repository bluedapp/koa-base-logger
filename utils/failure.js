const path = require('path')
const fse = require('fs-extra')
const chalk = require('chalk')
const moment = require('moment')
const fastSafeStringify = require('fast-safe-stringify')

const { times, logTypes, takeReq, takeRes } = {
  times: {
    now: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    day: moment(new Date()).format('YYYY-MM-DD'),
  },
  logTypes: [
    {
      type: 'access',
      color: 'green',
      icon: '✔',
    },
    {
      type: 'error',
      color: 'red',
      icon: '✖',
    },
    {
      type: 'log',
      color: 'cyan',
      icon: '☞',
    },
    {
      type: 'warn',
      color: 'yellow',
      icon: '✎',
    },
  ],
  takeReq (ctx) {
    return {
      url: ctx.url,
      headers: ctx.request.header,
      method: ctx.method,
      ip: ctx.ip,
      protocol: ctx.protocol,
      originalUrl: ctx.originalUrl,
      request: ctx.request.body,
      query: ctx.query,
    }
  },
  takeRes (ctx) {
    return {
      statusCode: ctx.status,
      responseTime: ctx.responseTime,
      headers: ctx.response.header,
      response: ctx.response.body,
    }
  },
  judgeType (param) {
    // [object String]\[object Number]\[object Array]\[object Object]\[object Promise]
    // [object Boolean]\[object Undefined]\[object Null]\[object Date]\[object Function]
    // [object RegExp]\[object Error]\[object HTMLDocument]\[object global]\[object Symbol]\[object Set]
    return Object.prototype.toString.call(param).slice(8, -1).toLocaleLowerCase()
  },
}

function writeLogFile (options) {
  const filePath = path.resolve(options.defaultPath, `${options.applicationName}.${options.type}-${times.day}.log`)
  fse.outputFile(filePath, options.write, { flag: 'a' }).catch(err => {
    console.log(err)
  })
}

function handleRequest (ctx, options, args) {
  return {
    appName: options.applicationName,
    message: args,
    req: takeReq(ctx),
  }
}

function handleVerbose (ctx, options, args) {
  const returnData = handleRequest(ctx, options, args)
  returnData.res = takeRes(ctx)
  return returnData
}

function handleError (ctx, options, err, args) {
  return Object.assign(handleRequest(ctx, options, args), {
    err: {
      type: err.constructor.name,
      message: err.message,
      stack: err.stack,
    },
  })
}

function getLogType (type) {
  return logTypes.find(fruit => {
    let result = {}
    if (fruit.type === type) {
      result = fruit
    }
    return result
  })
}

function outputStream (options) {
  return new Promise(resolve => {
    if (options.defaultPath) {
      resolve()
    }
  })
}

function handleLogger (data) {
  const { opts, autoFunc, logType } = data
  const line = `\n`
  const icon = logType.icon || '☞'
  const message = fastSafeStringify(autoFunc)
  const information = `[${times.now}]→[${logType.type}] ${icon} ${message}`

  const write = information + line
  const print = chalk[logType.color](information)

  if (opts.type !== 'access') {
    console.log(print)
  }

  outputStream(opts.options).then(() => {
    fse.ensureDir(opts.options.defaultPath).then(() => {
      writeLogFile(Object.assign(opts.options, { type: logType.type, write }))
    }).catch(err => {
      console.log(err)
      throw new Error('your folder does not exist, create your folder first.')
    })
  })
}

function createLog (opts) {
  let logType = getLogType('access')
  let autoFunc = handleVerbose(opts.ctx, opts.options, 'auto')
  if (opts.type === 'error') {
    logType = getLogType('error')
    autoFunc = handleError(opts.ctx, opts.options, opts.err, 'auto')
  }

  handleLogger({ logType, autoFunc, opts })
}

function factoryLog (opts) {
  const result = {}
  logTypes.forEach(logType => {
    let message = null
    result[logType.type] = (...args) => {
      if (args.length > 0) {
        message = args
        if (opts.err) {
          message = message.concat(opts.err)
        }
      }
      const autoFunc = handleRequest(opts.ctx, opts.options, message || '')
      handleLogger({ logType, autoFunc, opts })
    }
  })

  return result
}

function logger (config) {
  const defaults = {
    defaultPath: '',
    applicationName: '',
    auto: false,
  }
  const options = Object.assign(defaults, config)

  function log (ctx, next) {
    ctx.logger = factoryLog({ ctx, options })
    if (options.auto) {
      ctx.res.on('finish', () => {
        createLog({
          ctx,
          options,
          type: 'access',
        })
      })
    }
    return next().catch(err => {
      createLog({
        ctx,
        options,
        err,
        type: 'error',
      })
      throw err
    })
  }

  return log
}

module.exports = logger

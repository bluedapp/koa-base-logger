const humanize = require('humanize-number')
const events = require('events')

class Logger extends events.EventEmitter { }

const loggerError = new Logger()

/**
 * time
 * @param {Number} start milliseconds
 */
function calculateTime (start) {
  const delta = Date.now() - start
  return humanize(delta < 10000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`)
}

/**
 * Error Messages
 * @param {Object} err error
 */
function handleError (err, ctx) {
  let error = null

  if (err) {
    loggerError.emit('error', err, ctx || {})
  }

  if (judgeType(err) === 'error') {
    error = {
      name: err.name,
      message: err.message,
      stack: err.stack,
      fileName: err.fileName || '',
      lineNumber: err.lineNumber || '',
      columnNumber: err.columnNumber || '',
    }
  }

  return error
}

/**
 * Custom Messages
 * @param {Object} data
 */
function handleMessage (data) {
  let result = null
  const type = judgeType(data)

  if (!data) {
    result = null
  } else if (type === 'object') {
    result = data
  } else if (Array.isArray(data)) {
    result = data.join(',')
  } else if (type === 'string') {
    result = data
  }

  return result
}

/**
 * Koa
 * Log Messages
 * @param {Object} {} data
 */
function handleDatum ({
  ctx,
  err,
  message,
  recordBody,
  responseTime,
  verbose,
} = {}) {
  const response = {
    msg: handleMessage(message),
  }

  if (verbose) {
    const req = ctx.request
    const res = ctx.response

    response.app = ctx.app

    response.req = {
      uid: ctx.cookies.get('uid') || '',
      href: req.href,
      body: req.body,
      method: ctx.method,
      header: req.header,
      type: ctx.type,
      length: ctx.length || '',
      protocol: ctx.protocol,
      charset: ctx.charset || '',
      ip: req.ip,
      ips: req.ips,
    }
    response.res = {
      status: res.status,
      message: res.message,
      type: res.type,
    }

    if (recordBody) {
      response.res.body = res.body
    }
  }

  const error = handleError(err, ctx)
  if (error) {
    response.error = error
  }

  if (responseTime) {
    response.responseTime = responseTime
  }

  return response
}

/**
 * other
 * Log Messages
 * @param {Object} {} err、message、time
 */
function handleDefault ({ err, message, time } = {}) {
  const response = {
    msg: handleMessage(message),
  }

  const error = handleError(err)
  if (error) {
    response.error = error
  }

  if (time) {
    response.res.responseTime = time
  }

  return response
}

/**
 * Type
 * @param {anything} param value
 * [object String]\[object Number]\[object Array]\[object Object]\[object Promise]
 * [object Boolean]\[object Undefined]\[object Null]\[object Date]\[object Function]
 * [object RegExp]\[object Error]\[object HTMLDocument]\[object global]\[object Symbol]\[object Set]
 */

function judgeType (param) {
  return Object.prototype.toString.call(param).slice(8, -1).toLocaleLowerCase()
}

// log type
const levels = [
  {
    color: 'red',
    icon: '✖',
    type: 'error',
  },
  {
    color: 'yellow',
    icon: '✎',
    type: 'warn',
  },
  {
    color: 'green',
    icon: '✔',
    type: 'info',
  },
  {
    color: 'cyan',
    icon: '✈',
    type: 'verbose',
  },
]

module.exports = {
  calculateTime,
  handleDatum,
  handleDefault,
  judgeType,
  levels,
  loggerError,
}

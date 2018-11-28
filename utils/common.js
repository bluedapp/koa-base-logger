const humanize = require('humanize-number')

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
function handleError (err) {
  let error = null
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
  let result = ''
  if (data && judgeType(data) === 'object') {
    result = data
  } else if (Array.isArray(data)) {
    result = data.join(',')
  } else {
    result = data || {}
  }
  return result
}

/**
 * Koa
 * Log Messages
 * @param {Object} {} data
 */
function handleDatum ({ ctx, err, message, responseTime } = {}) {
  const req = ctx.request
  const res = ctx.response

  const response = {
    msg: handleMessage(message),
    app: ctx.app,
    req: {
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
    },
    res: {
      status: res.status,
      message: res.message,
      type: res.type,
      state: ctx.state,
    },
  }

  const error = handleError(err)
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
}

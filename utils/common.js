const humanize = require('humanize-number')

/**
 * time 计算服务端响应时间
 * @param {Number} start 毫秒数
 */
function calculateTime (start) {
  const delta = Date.now() - start
  return humanize(delta < 10000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`)
}

/**
 * 返回报错信息
 * @param {Object} err 错误
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
 * 返回自定义信息
 * @param {Object} data 信息
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
 * koa框架
 * 返回日志内容
 * @param {Object} {} 参数
 */
function handleDatum ({ ctx, err, message, responseTime } = {}) {
  const req = ctx.request
  const res = ctx.response

  const response = {
    msg: handleMessage(message),
    app: ctx.app,
    req: {
      uid: ctx.cookies.get('uid') || '',
      url: req.url,
      href: req.href,
      body: req.body,
      method: ctx.method,
      header: req.header,
      type: ctx.type,
      length: ctx.length || '',
      protocol: ctx.protocol,
      charset: ctx.charset || '',
      origin: ctx.origin,
      originalUrl: ctx.originalUrl,
      'x-requested-with': req.header['x-requested-with'] || '',
      'x-forwarded-proto': req.header['x-forwarded-proto'] || '',
      'x-forwarded-for': req.header['x-forwarded-for'] || '',
      ip: req.ip,
      ips: req.ips,
    },
    res: {
      status: res.status,
      message: res.message,
      type: res.type,
      // headers: res.header,
      state: ctx.state,
    },
  }

  const error = handleError(err)
  if (error) {
    response.error = error
  }

  if (responseTime) {
    response.res.responseTime = responseTime
  }

  return response
}

/**
 * 非koa框架
 * 返回日志内容
 * @param {Object} {} 参数err、message、time
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
 * 类型判断
 * @param {anything} param 需要判断的值
 * [object String]\[object Number]\[object Array]\[object Object]\[object Promise]
 * [object Boolean]\[object Undefined]\[object Null]\[object Date]\[object Function]
 * [object RegExp]\[object Error]\[object HTMLDocument]\[object global]\[object Symbol]\[object Set]
 */

function judgeType (param) {
  return Object.prototype.toString.call(param).slice(8, -1).toLocaleLowerCase()
}

// 日志类型
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

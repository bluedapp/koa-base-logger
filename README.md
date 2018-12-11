koa-base-logger
===

koa logger middleware

## Installation

[https://npmjs.org/package/koa-base-logger](https://npmjs.org/package/koa-base-logger)

```bash
$ npm install koa-base-logger
```

## Usage

```javascript
const Koa = require('koa')
const Router = require('koa-router')
const baselogger = require('koa-base-logger')

const app = new Koa()
const router = new Router()

app.use(baselogger({
  appName: 'app',
  fileName: 'file',
  useKoa: true,
}))

router.get('/', (ctx, next) => {
  ctx.logger.info({ notice: 'I lose what i love most...' })
  ctx.logger.warn({ notice: 'I also want to look for a girlfriend...' })
  try {
    alert(err)
  } catch (err) {
    ctx.logger.error(err, { notice: 'Who is my love match?' })
  }

  ctx.body = 'Hello World'
})

app.use(router.routes())

app.listen(0258)

```

## Options
```javascript
// example
const logger = require('koa-base-logger')()

logger.info({ notice: 'I lose what i love most...' })
logger.warn({ notice: 'I also want to look for a girlfriend...' })
logger.error(err, { notice: 'Who is my love match?' })

// example - koa
const baselogger = require('koa-base-logger')

app.use(baselogger({ useKoa: true }))
// or
app.use(baselogger({
  appName: 'app',
  fileName: 'file',
  useKoa: true,
}))

ctx.logger.info({ notice: 'I lose what i love most...' })
ctx.logger.warn({ notice: 'I also want to look for a girlfriend...' })
ctx.logger.error(err, { notice: 'Who is my love match?' })

// defaults options
{
  appName: 'app',
  automate: true,
  dailyRotateFile: {
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    maxSize: '100m',
  },
  fileName: 'app',
  recordBody: false,
  root: path.join(path.dirname(__dirname), '../logs'),
  useKoa: false,
}

```

## License
[MIT License](http://www.opensource.org/licenses/mit-license.php)

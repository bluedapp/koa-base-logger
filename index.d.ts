import { Middleware } from 'koa'

declare namespace logger {
  interface options {
    appName?: string
    automate?: boolean
    fileName?: string
    recordBody?: boolean
    root?: string
  }
}

declare namespace logger.options {
  interface dailyRotateFile {
    datePattern?: string
    maxFiles?: string
    maxSize?: string
  }
}

declare function BaseLogger(config?: logger.options): Middleware

export {
  BaseLogger,
  loggerError
} 

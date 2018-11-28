import { Middleware } from 'koa'

declare namespace logger {
  interface options {
    appName?: string
    automate?: boolean
    fileName?: string
    root?: string
    useKoa?: boolean
  }
}

declare namespace logger.options {
  interface dailyRotateFile {
    datePattern?: string
    maxFiles?: string
    maxSize?: string
  }
}

declare function logger(config?: logger.options): Middleware

export = logger

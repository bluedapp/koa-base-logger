import { Middleware } from 'koa'
import event from 'events'
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

export declare function BaseLogger(config?: logger.options): Middleware
export declare const loggerError: event.EventEmitter

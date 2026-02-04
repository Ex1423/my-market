/**
 * 日志工具
 * 在生产环境中限制 console.log 输出
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * 开发环境输出日志，生产环境静默
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * 始终输出错误日志（生产环境也需要）
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * 开发环境输出警告，生产环境静默
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * 开发环境输出调试信息，生产环境静默
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * 始终输出信息（用于重要的业务日志）
   */
  info: (...args: any[]) => {
    console.info(...args);
  }
};

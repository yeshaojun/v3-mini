/**
 * 判断是否为一个数组
 */
export const isArray = Array.isArray

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

/**
 * 对比两个数据是否发生了改变
 */
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)

export const extend = Object.assign
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

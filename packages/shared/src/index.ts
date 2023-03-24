const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null)
  return ((str: string) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }) as T
}

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

/**
 * 合并对象
 */
export const extend = Object.assign

/**
 * 是否为函数
 */
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

/**
 * 只读的空对象
 */
export const EMPTY_OBJ: { readonly [key: string]: any } = {}

/**
 * 判断是否为一个 string
 */
export const isString = (val: unknown): val is string => typeof val === 'string'

const onRE = /^on[^a-z]/
/**
 * 是否 on 开头
 */
export const isOn = (key: string) => onRE.test(key)

export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'

/**
 * @private
 */
export const capitalize = cacheStringFunction(
  (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
)

/**
 * @private
 */
export const toHandlerKey = cacheStringFunction((str: string) =>
  str ? `on${capitalize(str)}` : ``
)

const camelizeRE = /-(\w)/g
/**
 * @private
 */
export const camelize = cacheStringFunction((str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})

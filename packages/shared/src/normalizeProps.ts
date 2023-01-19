import { isArray, isObject, isString } from '.'

/**
 * @param value 规范class类
 */
export function normalizeClass(value: unknown): string {
  let res = ''
  if (isString(value)) {
    res = value
  } else if (isArray(value)) {
    // 遍历
    for (let i = 0; i < value.length; i++) {
      // 递归拼接
      const normalized = normalizeClass(value[i])
      if (normalized) {
        res += normalized + ' '
      }
    }
  } else if (isObject(value)) {
    // for in 获取到所有的 key，这里的 key（name） 即为 类名。value 为 boolean 值
    for (const name in value as object) {
      // 把 value 当做 boolean 来看，拼接 name
      if ((value as object)[name]) {
        res += name + ' '
      }
    }
  }

  return res.trim()
}

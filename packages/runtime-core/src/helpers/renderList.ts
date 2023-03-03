import { isArray, isString } from '@vue/shared'

export function renderList(source, renderItem) {
  let ret
  if (isArray(source) || isString(source)) {
    ret = new Array(source.length)
    for (let i = 0, l = source.length; i < l; i++) {
      ret[i] = renderItem(source[i], i)
    }
    return ret
  }
}

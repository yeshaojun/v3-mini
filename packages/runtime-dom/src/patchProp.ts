import { patchClass } from './modules/class'

export const patchProp = (el, key, prevValue, nextValue) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    // style
    // patchStyle(el, prevValue, nextValue)
  } else {
  }
}

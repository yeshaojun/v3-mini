export const FRAGMENT = Symbol(`Fragment`)
export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode')
export const CREATE_VNODE = Symbol('createVNode')
export const TO_DISPLAY_STRING = Symbol('toDisplayString')
export const CREATE_COMMENT = Symbol(`createCommentVNode`)
export const RENDER_LIST = Symbol(`renderList`)

/**
 * const {xxx} = Vue
 * 即：从 Vue 中可以被导出的方法，我们这里统一使用  createVNode
 */
export const helperNameMap = {
  [FRAGMENT]: `Fragment`,
  // 在 renderer 中，通过 export { createVNode as createElementVNode }
  [CREATE_ELEMENT_VNODE]: 'createElementVNode',
  [CREATE_VNODE]: 'createVNode',
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [CREATE_COMMENT]: 'createCommentVNode',
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [RENDER_LIST]: 'renderList'
}

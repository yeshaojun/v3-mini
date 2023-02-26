import { isArray, isFunction, isObject, isString } from '@vue/shared'
import { normalizeClass } from 'packages/shared/src/normalizeProps'
import { ShapeFlags } from 'packages/shared/src/shapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Comment = Symbol('Comment')

/**
 * VNode
 */
export interface VNode {
  __v_isVNode: true
  key: any
  type: any
  props: any
  children: any
  shapeFlag: number
}

export function createVNode(type, props, children?): VNode {
  // type是组件？
  // 暂不考虑
  // 通过 bit 位处理 shapeFlag 类型
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0

  if (props) {
    // 处理 class
    let { class: klass, style } = props
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass)
    }
  }
  return createBaseVNode(type, props, children, shapeFlag)
}

export { createVNode as createElementVNode }

/**
 * 构建基础 vnode
 */
function createBaseVNode(type, props, children, shapeFlag) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    shapeFlag,
    key: props?.key || null
  } as VNode

  normalizeChildren(vnode, children)
  return vnode
}

export function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0
  const { shapeFlag } = vnode
  if (children == null) {
    children = null
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (typeof children === 'object') {
    // object,则有可能是插槽，也有可能是vNode
    if (shapeFlag & (ShapeFlags.ELEMENT | ShapeFlags.TELEPORT)) {
      const slot = (children as any).default
      if (slot) {
        // _c marker is added by withCtx() indicating this is a compiled slot
        slot._c && (slot._d = false)
        normalizeChildren(vnode, slot())
        slot._c && (slot._d = true)
      }
      return
    } else {
      // type = ShapeFlags.SLOTS_CHILDREN
      // const slotFlag = children._
    }
  } else if (isFunction(children)) {
    // function，则表示插槽
    children = { default: children }
    type = ShapeFlags.SLOTS_CHILDREN
  } else {
    // children 为 string
    children = String(children)
    // 为 type 指定 Flags
    type = ShapeFlags.TEXT_CHILDREN
  }
  // 修改 vnode 的 chidlren
  vnode.children = children
  // 按位或赋值
  vnode.shapeFlag |= type
}

export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false
}

/**
 * 根据 key || type 判断是否为相同类型节点
 */
export function isSameVNodeType(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type && n1.key === n2.key
}

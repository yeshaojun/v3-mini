import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { createVNode } from './vnode'

/**
 * 标准化 VNode
 */
export function normalizeVNode(child) {
  if (typeof child === 'object') {
    return cloneIfMounted(child)
  } else {
    return createVNode(Text, null, String(child))
  }
}

/**
 * clone VNode
 */
export function cloneIfMounted(child) {
  return child
}

export function renderComponentRoot(instance) {
  const { vnode, render, data = {} } = instance
  let result
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 执行render，并把this绑定到data返回的对象上
      // core源码中是绑定到proxy上下文中
      result = normalizeVNode(render!.call(data, data))
    }
  } catch (error) {
    console.log(error)
  }
  return result
}

export function shouldUpdateComponent(oldVNode, newVNode): boolean {
  return false
}

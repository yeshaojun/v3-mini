import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { Comment, Fragment, Text, isSameVNodeType } from './vnode'
import { EMPTY_OBJ, isString } from '@vue/shared'
import {
  normalizeVNode,
  renderComponentRoot,
  shouldUpdateComponent
} from './componentRenderUtils'
import { createComponentInstance, setupComponent } from './component'
import { ReactiveEffect } from 'packages/reactivity/src/effect'
import { queuePreFlushCb } from './scheduler'

export interface RendererOptions {
  /**
   * 为指定 element 的 prop 打补丁
   */
  patchProp(el: Element, key: string, prevValue: any, nextValue: any): void
  /**
   * 为指定的 Element 设置 text
   */
  setElementText(node: Element, text: string): void
  /**
   * 插入指定的 el 到 parent 中，anchor 表示插入的位置，即：锚点
   */
  insert(el, parent: Element, anchor?): void
  /**
   * 创建指定的 Element
   */
  createElement(type: string)
  /**
   * 卸载指定dom
   */
  remove(el): void
  /**
   * 创建 Text 节点
   */
  createText(text: string)
  /**
   * 设置 text
   */
  setText(node, text): void
  /**
   * 设置 text
   */
  createComment(text: string)
}

export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options)
}

function baseCreateRenderer(options: RendererOptions) {
  /**
   * 解构 options，获取所有的兼容性方法
   */
  const {
    insert: hostInsert,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
    createComment: hostCreateComment
  } = options

  /**
   * Element 的打补丁操作
   */
  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode === null) {
      // 挂载操作
      mountElement(newVNode, container, anchor)
    } else {
      // 更新操作
      patchElement(oldVNode, newVNode)
    }
  }

  /**
   * 更新节点，打补丁
   */
  const patchElement = (oldVNode, newVNode) => {
    const el = (newVNode.el = oldVNode.el!)
    // 新旧 props
    const oldProps = oldVNode.props || EMPTY_OBJ
    const newProps = newVNode.props || EMPTY_OBJ

    // 更新子节点
    patchChildren(oldVNode, newVNode, el, null)
  }

  const patchChildren = (oldVNode, newVNode, container, anchor) => {
    const c1 = oldVNode && oldVNode.children
    const prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0
    const c2 = newVNode.children
    // 新节点的 shapeFlag
    const { shapeFlag } = newVNode
    // 新旧节点，一共有3中情况，文本，空，数组
    // 判断新节点类型
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 卸载旧子节点，设置成新得节点文本
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2 as string)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 这里要进行 diff 运算
          patchKeyChildren(c1, c2, container, anchor)
        }
        // 新子节点不为 ARRAY_CHILDREN，则直接卸载旧子节点
        else {
          // TODO: 卸载
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, '')
        }

        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 挂载
        }
      }
    }
  }

  /**
   * diff比对
   */
  const patchKeyChildren = (
    oldChildren,
    newChildren,
    container,
    parentAnchor
  ) => {
    let i = 0
    // 新节点长度
    const newChildrenLength = newChildren.length
    // 旧节点最大下标
    let oldChildrenEnd = oldChildren.length - 1
    // 新节点最大下标
    let newChildrenEnd = newChildrenLength - 1

    // 1. sync from start(之前向后对比)
    // (a b) c
    // (a b) d e
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVNode = oldChildren[i]
      // 新节点标准化
      const newVNode = normalizeVNode(newChildren[i])
      if (isSameVNodeType(oldVNode, newVNode)) {
        patch(oldVNode, newVNode, container, null)
      } else {
        break
      }
      i++
    }

    // 2. sync from end(自后向前对比)
    // a (b c)
    // d e (b c)

    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVNode = oldChildren[oldChildrenEnd]
      const newVNode = normalizeVNode(newChildren[newChildrenEnd])
      if (isSameVNodeType(oldVNode, newVNode)) {
        patch(oldVNode, newVNode, container, null)
      } else {
        break
      }
      oldChildrenEnd--
      newChildrenEnd--
    }

    // 3. common sequence + mount( 新节点多与旧节点时的 diff 比对)
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0
    if (i > oldChildrenEnd) {
      // 新节点多
      if (i <= newChildrenEnd) {
        const nextPos = newChildrenEnd + 1
        const anchor =
          nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor
        while (i <= newChildrenEnd) {
          // 挂载新节点
          patch(null, normalizeVNode(newChildren[i]), container, anchor)
          i++
        }
      }
    }
    // 4. common sequence + unmount
    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a (b c)
    // (b c)
    // i = 0, e1 = 0, e2 = -1
    else if (i > newChildrenEnd) {
      // 旧节点多
      while (i <= oldChildrenEnd) {
        unmount(oldChildren[i])
        i++
      }
    }
  }

  /**
   * element 的挂载操作
   */
  const mountElement = (vnode, container, anchor) => {
    const { type, props, shapeFlag } = vnode

    // 创建 element
    const el = (vnode.el = hostCreateElement(type))

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 设置 文本子节点
      hostSetElementText(el, vnode.children as string)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 设置 Array 子节点
      //   mountChildren(vnode.children, el, anchor)
    }

    // 处理 props
    if (props) {
      // 遍历 props 对象
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    // 插入 el 到指定的位置
    hostInsert(el, container, anchor)
  }

  const processText = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === null) {
      newVNode.el = hostCreateText(newVNode.children)
      hostInsert(newVNode.el, container, anchor)
    } else {
      const el = (newVNode.el = oldVNode.el!)
      if (newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children as string)
      }
    }
  }

  const processComponent = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === null) {
      // keep-alive 暂未实现
      // 挂载
      mountComponent(newVNode, container, anchor)
    } else {
      // 更新
      updateComponent(oldVNode, newVNode)
    }
  }

  const updateComponent = (oldVNode, newVNode) => {
    const instance = (oldVNode.component = newVNode.component)!
    if (shouldUpdateComponent(oldVNode, newVNode)) {
    } else {
      newVNode.el = oldVNode.el
      instance.vnode = newVNode
    }
  }

  const mountComponent = (initialVNode, container, anchor) => {
    // 实例, 定义对象，并赋值，此时并无渲染方法
    const instance = (initialVNode.component =
      createComponentInstance(initialVNode))

    // 标准化组件数据，确保instance里面是有render的
    setupComponent(instance)

    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  const setupRenderEffect = (instance, initialVNode, container, anchor) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        // 获取 hook
        const { bm, m } = instance
        if (bm) {
          bm()
        }
        const subTree = (instance.subTree = renderComponentRoot(instance))
        console.log('subTree', subTree)
        patch(null, subTree, container, anchor)
        if (m) {
          m()
        }

        initialVNode.el = subTree.el
        instance.isMounted = true
      } else {
        let { next, vnode } = instance
        if (!next) {
          next = vnode
        }

        const nextTree = renderComponentRoot(instance)

        // 保存对应的 subTree，以便进行更新操作
        const prevTree = instance.subTree
        instance.subTree = nextTree

        patch(prevTree, nextTree, container, anchor)

        // 更新 next
        next.el = nextTree.el
      }
    }

    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queuePreFlushCb(update)
    ))

    const update = (instance.update = () => effect.run())

    update()
  }

  /**
   * Comment 的打补丁操作
   */
  const processCommentNode = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      // 生成节点
      newVNode.el = hostCreateComment((newVNode.children as string) || '')
      // 挂载
      hostInsert(newVNode.el, container, anchor)
    } else {
      // 无更新
      newVNode.el = oldVNode.el
    }
  }

  /**
   * Fragment 的打补丁操作
   */

  const processFragment = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountChildren(newVNode.children, container, anchor)
    } else {
      patchChildren(oldVNode, newVNode, container, anchor)
    }
  }

  /**
   * 挂载子节点
   */
  const mountChildren = (children, container, anchor) => {
    // 处理 Cannot assign to read only property '0' of string 'xxx'
    if (isString(children)) {
      children = children.split('')
    }
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))
      patch(null, child, container, anchor)
    }
  }

  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === newVNode) {
      return
    }

    // 判断是否为相同类型的节点
    if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
      unmount(oldVNode)
      oldVNode = null
    }

    const { type, shapeFlag } = newVNode
    switch (type) {
      case Text:
        processText(oldVNode, newVNode, container, anchor)
        break
      case Comment:
        processCommentNode(oldVNode, newVNode, container, anchor)
        break
      case Fragment:
        processFragment(oldVNode, newVNode, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, newVNode, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 组件
          processComponent(oldVNode, newVNode, container, anchor)
        }
    }
  }

  const unmount = vnode => {
    hostRemove(vnode.el!)
  }

  const render = (vnode, container) => {
    if (vnode === null) {
      // 卸载
      if (container._vnode) {
        unmount(container._vnode)
      }
    } else {
      // 打补丁
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }

  return {
    render
  }
}

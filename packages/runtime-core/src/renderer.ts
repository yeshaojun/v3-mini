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
    // 5. unknown sequence
    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5
    else {
      // 1. 前4步处理完之后，剩下需要[c d e] 变成 [e d c h]
      // 这个i是比对之后的i,也就是2
      const oldStartIndex = i
      const newStartIndex = i

      // 5.1 创建一个map，将新节点的key，以及序号做关联
      const keyToNewIndexMap = new Map()
      for (i = newStartIndex; i <= newChildrenEnd; i++) {
        // 从 newChildren 中根据开始索引获取每一个 child（c2 = newChildren）
        const nextChild = normalizeVNode(newChildren[i])
        // child 必须存在 key（这也是为什么 v-for 必须要有 key 的原因）
        if (nextChild.key != null) {
          // 把 key 和 对应的索引，放到 keyToNewIndexMap 对象中
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }

      // 5.2循环oldChildren,并尝试进行 patch（打补丁）或 unmount（删除）旧节点
      // 只查看旧节点的key在新节点中是否有对应，有的话，打补丁，没有的话则删除，移动以及新增在5.3
      let j
      // 已经修复节点数量
      let patched = 0
      // 待修复节点数量
      const toBePatched = newChildrenEnd - newStartIndex + 1
      // 标记是否需要移动
      let moved = false
      // 配合 moved 进行使用，它始终保存当前最大的 index 值
      let maxNewIndexSoFar = 0
      // 创建一个 Array 的对象，用来确定最长递增子序列。它的下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》，元素表示：《对应旧节点的下标（oldIndex），永远 +1》
      // 但是，需要特别注意的是：oldIndex 的值应该永远 +1 （ 因为 0 代表了特殊含义，他表示《新节点没有找到对应的旧节点，此时需要新增新节点》）。即：旧节点下标为 0， 但是记录时会被记录为 1
      const newIndexToOldIndexMap = new Array(toBePatched)
      // 遍历 toBePatched ，为 newIndexToOldIndexMap 进行初始化，初始化时，所有的元素为 0
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
      // 遍历 oldChildren（s1 = oldChildrenStart; e1 = oldChildrenEnd），获取旧节点，如果当前 已经处理的节点数量 > 待处理的节点数量，那么就证明：《所有的节点都已经更新完成，剩余的旧节点全部删除即可》
      for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
        const prevChild = oldChildren[i]
        if (patched >= toBePatched) {
          // 所有的节点都已经更新完成，剩余的旧节点全部删除即可,不需要再进行遍历
          unmount(prevChild)
          continue
        }
        // 新节点需要存在的位置，需要根据旧节点来进行寻找（包含已处理的节点。即：n-c 被认为是 1）
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // 旧节点的 key 不存在（无 key 节点）
          // 那么我们就遍历所有的新节点，找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》，如果能找到，那么 newIndex = 该新节点索引
          for (j = newStartIndex; j <= newChildrenEnd; j++) {
            // 找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》
            if (
              newIndexToOldIndexMap[j - newStartIndex] === 0 &&
              isSameVNodeType(prevChild, newChildren[j])
            ) {
              // 如果能找到，那么 newIndex = 该新节点索引
              newIndex = j
              break
            }
          }
        }
        // 最终没有找到新节点的索引，则证明：当前旧节点没有对应的新节点
        if (newIndex === undefined) {
          // 此时，直接删除即可
          unmount(prevChild)
        }
        // 没有进入 if，则表示：当前旧节点找到了对应的新节点，那么接下来就是要判断对于该新节点而言，是要 patch（打补丁）还是 move（移动）
        else {
          // 为 newIndexToOldIndexMap 填充值：下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》，元素表示：《对应旧节点的下标（oldIndex），永远 +1》
          // 因为 newIndex 包含已处理的节点，所以需要减去 s2（s2 = newChildrenStart）表示：不计算已处理的节点
          newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1
          // maxNewIndexSoFar 会存储当前最大的 newIndex，它应该是一个递增的，如果没有递增，则证明有节点需要移动
          if (newIndex >= maxNewIndexSoFar) {
            // 持续递增
            maxNewIndexSoFar = newIndex
          } else {
            // 没有递增，则需要移动，moved = true
            moved = true
          }
          // 打补丁
          patch(prevChild, newChildren[newIndex], container, null)
          // 自增已处理的节点数量
          patched++
        }
      }

      // 5.3 针对移动和挂载的处理 [c d e] 变成 [e d c h]
      // 仅当节点需要移动的时候，我们才需要生成最长递增子序列，否则只需要有一个空数组即可
      // 新节点为下标，对应的旧节点位置
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []

      j = increasingNewIndexSequence.length - 1 // 最后一个值的下标
      // 倒序循环，以便我们可以使用最后修补的节点作为锚点
      for (i = toBePatched - 1; i >= 0; i--) {
        // nextIndex（需要更新的新节点下标） = newChildrenStart + i
        // 换算成实际的下标
        const nextIndex = newStartIndex + i
        // 根据 nextIndex 拿到要处理的 新节点
        const nextChild = newChildren[nextIndex]
        // 锚dian
        const anchor =
          nextIndex + 1 < newChildrenLength
            ? newChildren[nextIndex + 1].el
            : parentAnchor
        // 如果 newIndexToOldIndexMap 中保存的 value = 0，则表示：新节点没有用对应的旧节点，此时需要挂载新节点
        if (newIndexToOldIndexMap[i] === 0) {
          // 挂载新节点
          patch(null, nextChild, container, anchor)
        }
        // 则移动
        else if (moved) {
          // j < 0 表示：不存在 最长递增子序列
          // i !== increasingNewIndexSequence[j] 表示：当前节点不在最后位置
          // 那么此时就需要 move （移动）
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor)
          } else {
            // j 随着循环递减
            j--
          }
        }
      }
    }
  }

  /**
   * 移动节点到指定位置
   */
  const move = (vnode, container, anchor) => {
    const { el } = vnode
    hostInsert(el!, container, anchor)
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

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
// 1.如果后续值比result中的最大值还大，直接push
// 2.如果比最大值小，则使用二分法进行查询需要替换的目标位置
// 3.但是这个二分查找可能有问题，比如5，6，1，会被替换成1，6，所以需要一个额外的p来进行回溯哦，也就说进行纠错，变成5，6
function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

import { createVNodeCall, NodeTypes } from '../ast'

export const transformElement = (node, context) => {
  return function postTransformElement() {
    node = context.currentNode!

    // 仅处理 ELEMENT 类型
    if (node.type !== NodeTypes.ELEMENT) {
      return
    }

    const { tag } = node

    let vnodeTag = `"${tag}"`
    let vnodeProps = []
    let vnodeChildren = node.children

    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren
    )
  }
}

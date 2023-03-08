import { createVNodeCall, NodeTypes } from '../ast'

export const transformElement = (node, context) => {
  return function postTransformElement() {
    node = context.currentNode!

    // 仅处理 ELEMENT 类型
    if (node.type !== NodeTypes.ELEMENT) {
      return
    }

    const { tag, props } = node

    let vnodeTag = `"${tag}"`
    let vnodeProps = []
    if (props.length > 0) {
      const propsBuildResult = buildProps(node, context, null)
      vnodeProps = propsBuildResult.props as any
    }

    let vnodeChildren = node.children

    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren
    )
  }
}

export function buildProps(node, context, props = node.props) {
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    if (prop.type === NodeTypes.ATTRIBUTE) {
    } else {
      const { name, exp } = prop
      const isVBind = name === 'bind'
      const isVOn = name === 'on'
      const directiveTransform = context.directiveTransforms[name]
      if (directiveTransform) {
        const { props } = directiveTransform(prop, node, context)
      }
    }
  }
  let propsExpression = undefined
  return {
    props: propsExpression
  }
}

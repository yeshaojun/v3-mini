import {
  createObjectProperty,
  createSimpleExpression,
  createVNodeCall,
  NodeTypes
} from '../ast'
import { createObjectExpression } from '../utils'

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
      const propsBuildResult = buildProps(node, context)
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
  let properties: any = []
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    if (prop.type === NodeTypes.ATTRIBUTE) {
      const { name, value } = prop
      properties.push(
        createObjectProperty(
          createSimpleExpression(name, true),
          createSimpleExpression(value ? value.content : '', true)
        )
      )
    } else {
      const { name, exp } = prop
      const isVBind = name === 'bind'
      const isVOn = name === 'on'
      const directiveTransform = context.directiveTransforms[name]
      console.log('node', directiveTransform)
      if (directiveTransform) {
        const { props } = directiveTransform(prop, node, context)
        properties.push(...props)
      }
    }
  }
  let propsExpression: any = undefined

  propsExpression = createObjectExpression(dedupeProperties(properties))
  return {
    props: propsExpression
  }
}

function dedupeProperties(properties: []) {
  const knownProps = new Map()
  const deduped: any = []
  for (let i = 0; i < properties.length; i++) {
    const prop: any = properties[i]
    const name = prop.key.content
    const existing = knownProps.get(name)
    if (existing) {
    } else {
      knownProps.set(name, prop)
      deduped.push(prop)
    }
  }
  return deduped
}

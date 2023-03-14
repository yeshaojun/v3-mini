import { camelize, toHandlerKey } from '@vue/shared'
import {
  createCompoundExpression,
  createObjectProperty,
  createSimpleExpression,
  ElementTypes,
  NodeTypes
} from '../ast'

export const transformOn = (dir, node, context) => {
  const { exp } = dir
  let eventName
  if (exp.type === NodeTypes.SIMPLE_EXPRESSION) {
    let rawName = exp.content
    const eventString =
      node.tagType !== ElementTypes.ELEMENT ||
      rawName.startsWith('vnode') ||
      !/[A-Z]/.test(rawName)
        ? // for non-element and vnode lifecycle event listeners, auto convert
          // it to camelCase. See issue #2249
          toHandlerKey(camelize(rawName))
        : // preserve case for plain element listeners that have uppercase
          // letters, as these may be custom elements' custom events
          `on:${rawName}`
    eventName = createSimpleExpression(eventString, true)
  } else {
  }
  return {
    props: [createObjectProperty(eventName, exp)]
  }
}

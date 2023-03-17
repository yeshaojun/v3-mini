import { camelize, toHandlerKey } from '@vue/shared'
import {
  createCompoundExpression,
  createObjectProperty,
  createSimpleExpression,
  ElementTypes,
  NodeTypes
} from '../ast'
import { isMemberExpressionBrowser } from '../utils'

const fnExpRE =
  /^\s*([\w$_]+|(async\s*)?\([^)]*?\))\s*(:[^=]+)?=>|^\s*(async\s+)?function(?:\s+[\w$]+)?\s*\(/

export const transformOn = (dir, node, context) => {
  let { exp, arg } = dir
  let eventName
  if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
    let rawName = arg.content
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

  if (exp) {
    const isMemberExp = isMemberExpressionBrowser(exp.content)
    const isInlineStatement = !(isMemberExp || fnExpRE.test(exp.content))
    const hasMultipleStatements = exp.content.includes(`;`)
    if (isInlineStatement) {
      exp = createCompoundExpression(
        [
          `${isInlineStatement ? `$event` : `(...args)`} => ${
            hasMultipleStatements ? `{` : `(`
          }`,
          exp,
          hasMultipleStatements ? `}` : `)`
        ],
        undefined
      )
    }
  }

  return {
    props: [createObjectProperty(eventName, exp)]
  }
}

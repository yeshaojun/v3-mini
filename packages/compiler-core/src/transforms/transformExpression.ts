import { NodeTypes } from '../ast'
import { validateBrowserExpression } from '../validateExpression'

export const transformExpression = (node, context) => {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content, context)
  }
}

export function processExpression(node, context) {
  validateBrowserExpression(node, context)
  return node
}

import { Fragment } from '@vue/runtime-core'
import {
  createCallExpression,
  createSimpleExpression,
  createVNodeCall,
  NodeTypes
} from '../ast'
import { RENDER_LIST } from '../runtimeHelpers'
import {
  createStructuralDirectiveTransform,
  TransformContext
} from '../transform'

const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
export const transformFor = createStructuralDirectiveTransform(
  'for',
  (node, dir, context) => {
    return processFor(node, dir, context, forNode => {
      const renderExp = createCallExpression(context.helper(RENDER_LIST), [
        forNode.source
      ])
      return () => {
        forNode.codegenNode = createVNodeCall(
          context,
          Fragment,
          undefined,
          renderExp
        )
      }
    })
  }
)

export function processFor(
  node,
  dir,
  context: TransformContext,
  processCodegen?: (node) => (() => void) | undefined
) {
  if (dir.name === 'for') {
    const parseResult = parseForExpression(dir.exp, context)
    const forNode = {
      type: NodeTypes.FOR,
      loc: node.loc,
      source: parseResult?.source
      //   branches: [branch]
    }
    context.replaceNode(forNode)
    // 生成对应的 codegen 属性
    if (processCodegen) {
      return processCodegen(forNode)
    }
  }
}

export function parseForExpression(input, context) {
  const loc = input.loc
  const exp = input.content
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) return

  const [, LHS, RHS] = inMatch

  const result = {
    source: createAliasExpression(
      loc,
      RHS.trim(),
      exp.indexOf(RHS, LHS.length)
    ),
    value: undefined,
    key: undefined,
    index: undefined
  }
  return result
}

function createAliasExpression(range, content: string, offset: number) {
  return createSimpleExpression(content, false)
}

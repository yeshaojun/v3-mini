import { FRAGMENT } from '../runtimeHelpers'
import {
  createCallExpression,
  createFunctionExpression,
  createSimpleExpression,
  createVNodeCall,
  NodeTypes
} from '../ast'
import { RENDER_LIST } from '../runtimeHelpers'
import {
  createStructuralDirectiveTransform,
  TransformContext
} from '../transform'
import { isTemplateNode } from '../utils'

const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
const stripParensRE = /^\(|\)$/g
export const transformFor = createStructuralDirectiveTransform(
  'for',
  (node, dir, context) => {
    return processFor(node, dir, context, forNode => {
      const renderExp = createCallExpression(context.helper(RENDER_LIST), [
        forNode.source
      ])
      forNode.codegenNode = createVNodeCall(
        context,
        FRAGMENT,
        undefined,
        renderExp
      )
      return () => {
        let childBlock: any = null
        const { children } = forNode
        childBlock = children[0].codegenNode
        childBlock.isBlock = true
        if (childBlock.isBlock) {
          //
          // context.helper
        }
        renderExp.arguments.push(
          createFunctionExpression(
            createForLoopParams(forNode.parseResult),
            childBlock,
            true /* force newline */
          )
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
      source: parseResult?.source,
      children: isTemplateNode(node) ? node.children : [node],
      parseResult
      //   branches: [branch]
    }
    context.replaceNode(forNode)
    // 生成对应的 codegen 属性
    const onExit = processCodegen && processCodegen(forNode)

    return () => {
      onExit && onExit()
    }
  }
}

export function parseForExpression(input, context) {
  const loc = input.loc
  const exp = input.content
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) return

  const [, LHS, RHS] = inMatch
  let valueContent = LHS.trim().replace(stripParensRE, '').trim()
  const trimmedOffset = LHS.indexOf(valueContent)
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

  result.value = createAliasExpression(loc, valueContent, trimmedOffset) as any
  return result
}

function createAliasExpression(range, content: string, offset: number) {
  return createSimpleExpression(content, false)
}

export function createForLoopParams({ value, key, index }, memoArgs = []) {
  return createParamsList([value, key, index, ...memoArgs])
}

function createParamsList(args) {
  let i = args.length
  while (i--) {
    if (args[i]) break
  }
  return args
    .slice(0, i + 1)
    .map((arg, i) => arg || createSimpleExpression(`_`.repeat(i + 1), false))
}

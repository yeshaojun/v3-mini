import { createCallExpression, createVNodeCall, NodeTypes } from '../ast'
import { RENDER_LIST } from '../runtimeHelpers'
import {
  createStructuralDirectiveTransform,
  TransformContext
} from '../transform'

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
          'Fragment',
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
    const forNode = {
      type: NodeTypes.FOR,
      loc: node.loc
      //   branches: [branch]
    }
    context.replaceNode(forNode)
    // 生成对应的 codegen 属性
    if (processCodegen) {
      return processCodegen(forNode)
    }
  }
}

// export const transformIf = createStructuralDirectiveTransform(
//     /^(if|else|else-if)$/,
//     (node, dir, context) => {
//       return processIf(node, dir, context, (ifNode, branch, isRoot) => {
//         // TODO: 目前无需处理兄弟节点情况
//         let key = 0

//         // 退出回调。当所有子节点都已完成时，完成codegenNode
//         return () => {
//           if (isRoot) {
//             ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context)
//           } else {
//             // TODO: 非根
//           }
//         }
//       })
//     }
//   )

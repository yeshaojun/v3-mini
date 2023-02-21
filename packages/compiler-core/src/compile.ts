import { extend } from '@vue/shared'
import { generate } from './codegen'
import { baseParse } from './parse'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformText } from './transforms/transformText'

export function baseCompile(template: string, options = {}) {
  const ast = baseParse(template.trim())
  console.log('ast before', JSON.stringify(ast))
  transform(
    ast,
    extend(options, {
      nodeTransforms: [transformElement, transformText]
    })
  )
  return generate(ast)
}

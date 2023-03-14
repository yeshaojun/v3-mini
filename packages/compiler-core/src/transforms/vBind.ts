import { createObjectProperty } from '../ast'

export const transformBind = (dir, _node, context) => {
  console.log('dir', dir, _node, context)
  const { exp } = dir
  const arg = dir.arg!
  return {
    props: [createObjectProperty(exp, exp)]
  }
}

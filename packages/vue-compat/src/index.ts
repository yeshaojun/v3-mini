import { compile } from '@vue/compiler-dom'

function compileToFunction(template, options?) {
  const { code } = compile(template, options)

  const code1 = `
    const _Vue = Vue

    return function render(_ctx, _cache) {
      with (_ctx) {
        const { createElementVNode: _createElementVNode } = _Vue

        return _createElementVNode("div", [], [" hello world "])
      }
  }`
  console.log('code1', code1 === code)
  const render = new Function(code)()

  return render
}

export { compileToFunction as compile }

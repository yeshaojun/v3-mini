export function validateBrowserExpression(node, context) {
  const exp = node.content
  if (!exp.trim()) {
    return
  }

  new Function(`return (${exp})`)
}

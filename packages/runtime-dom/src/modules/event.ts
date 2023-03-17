export function patchEvent(
  el: Element & { _vei: object },
  rawName: string,
  prevValue,
  nextValue
) {
  // vei = vue event invokers
  // 缓存事件，防止重复挂载
  const invokers = el._vei || (el._vei = {})
  // 是否存在

  const existingInvoker = invokers[rawName]
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue
  } else {
    const name = parseName(rawName)

    if (nextValue) {
      const invoker = (invokers[rawName] = createInvoker(nextValue))
      el.addEventListener(name, invoker)
    } else {
      // remove
      el.removeEventListener(name, existingInvoker)
      // 删除缓存
      invokers[rawName] = undefined
    }
  }
}

/**
 * 直接返回剔除 on，其余转化为小写的事件名即可
 */
function parseName(name: string) {
  return name.slice(2).toLowerCase()
}

/**
 * 生成 invoker 函数
 */
function createInvoker(initialValue) {
  const invoker = (e: Event) => {
    invoker.value && invoker.value(e)
  }
  // value 为真实的事件行为
  invoker.value = initialValue
  return invoker
}

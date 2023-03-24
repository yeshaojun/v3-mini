import { ReactiveEffect } from './effect'
import { mutableHandlers } from './baseHandlers'
import { isObject } from '@vue/shared'

export const reactiveMap = new WeakMap<object, any>()
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

// 创建proxy代理
function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) {
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`)
    return target
  }
  // 做个缓存
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  const proxy = new Proxy(target, baseHandlers)
  proxy[ReactiveFlags.IS_REACTIVE] = true
  proxyMap.set(target, proxy)
  return proxy
}

// 判断是否为对象，是则转位reactive
export const toReactive = <T extends unknown>(value: T): T => {
  return isObject(value) ? reactive(value as object) : value
}

// 是否为reactive对象
export const isReactive = (value): boolean =>
  !!(value && value[ReactiveFlags.IS_REACTIVE])

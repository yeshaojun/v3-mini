import { reactive } from '@vue/reactivity'
import { isArray, isObject } from '@vue/shared'
import { track, trigger } from './effect'

const get = createGetter()
const set = createSetter()

function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver)
    track(target, key)
    if (isObject(res)) {
      return reactive(res)
    }
    return res
  }
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    const result = Reflect.set(target, key, value, receiver)
    trigger(target, key, value)
    return result
  }
}

function deleteProperty(target: object, key: string) {
  // const oldValue = (target as any)[key]
  const result = Reflect.deleteProperty(target, key)
  if (result) {
    trigger(target, key, result)
  }
  return result
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty
}

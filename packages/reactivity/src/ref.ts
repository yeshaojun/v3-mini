import { hasChanged } from '@vue/shared'
import { createDep } from './deps'
import { activeEffect, trackEffects, triggerEffects } from './effect'
import { toReactive } from './reactive'

export interface Ref<T = any> {
  value: T
}

export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}

export function ref(value?: unknown) {
  return createRef(value, false)
}

function createRef(rawValue: unknown, shallow: boolean) {
  return new RefImpl(rawValue, shallow)
}

class RefImpl<T> {
  private _value: T
  private _rawValue: T
  // 标记是否是ref实例
  public readonly __v_isRef = true
  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._value = __v_isShallow ? value : toReactive(value)
    this._rawValue = value
  }
  get value() {
    // 收集依赖
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    if (hasChanged(newVal, this._rawValue)) {
      // 更新原始数据
      this._rawValue = newVal
      // 更新 .value 的值
      this._value = toReactive(newVal)
      // 触发依赖
      triggerRefValue(this)
    }
  }
}

export function trackRefValue(ref) {
  console.log('ref', ref, activeEffect)
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

/**
 * 为 ref 的 value 进行触发依赖工作
 */
export function triggerRefValue(ref) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}

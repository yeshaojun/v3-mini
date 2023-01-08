import { isArray } from '@vue/shared'
import { Dep, createDep } from './deps'
export let activeEffect: ReactiveEffect | undefined
type KeyToDepMap = Map<any, Dep>

const targetMap = new WeakMap<any, KeyToDepMap>()

// 依赖收集
export function track(target: object, key: unknown) {
  if (!activeEffect) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }

  trackEffects(dep)
}

// 利用dep 依次跟踪指定的key的所有effect
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}

// 依赖触发
export function trigger(traget: object, key: unknown, newValue: unknown) {
  const depsMap = targetMap.get(traget)
  if (!depsMap) {
    return
  }
  const dep = depsMap.get(key)
  if (!dep) {
    return
  }
  triggerEffects(dep)
}

export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep]
  for (const effect of effects) {
    triggerEffect(effect)
  }
}
export function triggerEffect(effets: ReactiveEffect) {
  effets.fn()
}

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}
  run() {
    activeEffect = this
    return this.fn()
  }
}

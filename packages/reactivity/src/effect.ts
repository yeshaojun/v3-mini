import { extend, isArray } from '@vue/shared'
import { Dep, createDep } from './deps'
import { ComputedRefImpl } from './computed'

export let activeEffect: ReactiveEffect | undefined
export type EffectScheduler = (...args: any[]) => any

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
  activeEffect!.deps.push(dep)
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

  // for (const effect of effects) {
  //   if (effect.computed) {
  //     triggerEffect(effect)
  //   }
  // }

  // for (const effect of effects) {
  //   if (!effect.computed) {
  //     triggerEffect(effect)
  //   }
  // }

  for (const effect of effects) {
    triggerEffect(effect)
  }
}
export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
}

export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const _effect = new ReactiveEffect(fn)
  if (options) {
    extend(_effect, options)
  }
  if (!options || !options.lazy) {
    // 执行 run 函数
    _effect.run()
  }
}

export class ReactiveEffect<T = any> {
  deps: Dep[] = []
  computed?: ComputedRefImpl<T>
  // 如果当前是自己，则延迟清理
  private deferStop?: boolean
  // 监听停止
  onStop?: () => void
  // 是否停止
  active = true
  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null
  ) {}
  run() {
    if (!this.active) {
      return this.fn()
    }
    try {
      activeEffect = this
      return this.fn()
    } finally {
      if (this.deferStop) {
        this.stop()
      }
    }
  }
  stop() {
    console.log('effect stop')
    debugger
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

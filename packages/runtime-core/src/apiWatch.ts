import { EMPTY_OBJ, hasChanged, isObject } from '@vue/shared'
import { isReactive } from 'packages/reactivity/src/reactive'
import { queuePreFlushCb } from './scheduler'
import { ReactiveEffect } from 'packages/reactivity/src/effect'

export interface WatchOptions<Immediate = boolean> {
  immediate?: Immediate
  deep?: boolean
}

export function watch(source, cb: Function, options?: WatchOptions) {
  return doWatch(source, cb, options)
}

function doWatch(
  source,
  cb: Function,
  { immediate, deep }: WatchOptions = EMPTY_OBJ
) {
  let getter: () => any
  if (isReactive(source)) {
    getter = () => source
    deep = true
  } else {
    // 暂未实现
    getter = () => {}
  }

  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  let oldValue = {}
  // 执行job执行方法
  const job = () => {
    if (cb) {
      const newValue = effect.run()
      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue)
        oldValue = newValue
      }
    }
  }

  // 调度器
  // 一个reactive的watch监听，可能触发多次scheduler，queuePreFlushCb的作用其实就是将更新触发加入队列，并只执行一次
  let scheduler = () => queuePreFlushCb(job)

  const effect = new ReactiveEffect(getter, scheduler)
  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run()
  }

  return () => {
    effect.stop()
  }
}

function traverse(value: unknown, seen?: Set<unknown>) {
  if (!isObject(value)) {
    return value
  }
  seen = seen || new Set()

  seen.add(value)

  for (const key in value as object) {
    traverse((value as any)[key], seen)
  }
  return value
}

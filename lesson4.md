---
theme: channing-cyan
---

# computed 你可能不知道的一些特性

computed 大家应该都用过,大概是下面这样子的。

```
        const { reactive, computed } = Vue

        const person = reactive({
            firstname: "zhang",
            lastname: "xx"
        })

        const personInfo = computed(() => {
            return person.firstname + person.lastname
        })
```

好，那么问题来了。

**1. computed 只能接受函数吗？**

**2. computed 返回的值是什么类型，可以修改吗？**

**3. computed 是怎么实现，数据变化，重新计算的？**

如果你对这些答案不是很确定，那么这篇文章都会从源码的角度告诉你答案。

# effect 侦听器回顾

在我们自己动手开始实现 computed 功能之前，我们先回顾一下，上一讲中的 effect 侦听器。

在上一篇数据响应式中，我们创建了一个 effect 侦听器，并实现了数据的监听功能，当触发 person.name 的 set 事件时，会重新触发 console.log 打印。

这部分如果有不清楚的，[建议先看这里](https://juejin.cn/post/7215226343713669181)

文章代码可以[看这里](https://github.com/yeshaojun)选择对应的分支即可

```
    function effect(fn,options = {}) {
        const effectFn = () => {
          try {
            activeEffect = effectFn
            return fn()
          } catch (error) {
            activeEffect = null
          }
        }
        if (!options.lazy) {
          effectFn()
        }
        effectFn.scheduler = options.scheduler
        return effectFn
      }

      effect(() => {
        console.log('effect person', person.name)
      })

      setTimeout(() => {
        person.name = 'setTimeout world'
      }, 2000)
```

在函数的定义中，我们可以看出来，effect 函数除了 fn 还接收一个 options 参数。

该参数中有两个值，一个 lazy，一个 scheduler。

**lazy 很好理解，就是第一次是否执行 effectFn。跟 watch 中的 immediate 是一个意思。**

**scheduler 可以理解为调度器，会优先执行,在触发依赖的时候会判断，优先执行 scheduler**

```
   effect(() => {
    console.log('effect person', person.name)
  }, {
    scheduler: () => {
      console.log('scheduler')
    }
  })

  setTimeout(() => {
    person.name = 'setTimeout world'
  }, 2000)

  // 2s 后输出scheduler
```

为了跟源码保持一致，我们对 effect 做一点改造。

```
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
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

```

主要就是 run 方法，内部的实现跟 effect 是一样的。

核心就是两行代码

```
      activeEffect = this
      return this.fn()
```

回顾到这，你肯定知道了，可以用 effect 来监听呀。

是不是呢？我们来看看源码是如何实现的。

# 手写一个 computed

首先，从使用方法上，我们很容易可以分析出来，computed 是一个函数，并返回一个值。

那这个 option 是什么格式呢？

我们可以看一下官网的说明。

**参数可以接收函数，跟对象，返回值是一个只读的 ref 的对象。**

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d177ed99f793480890021cbe37bc9a12~tplv-k3u1fbpfcp-watermark.image?)

有了这两点，就可以去写我们的函数了。

```
    function computed(options) {
        let getter
        let setter
        if(typeof options === 'function') {
            getter = options
            setter = () =>  console.warn('哥们是只读的')
        } else {
            getter = options.getter
            setter = options.setter
        }
        // 返回的ref，跟之前一样，也用类创建
        const cRef = new ComputedRefImpl(getter, setter)
        return cRef
    }

```

ReactiveEffect 其实就是之前的 effet 函数。

```
 export class ComputedRefImpl<T> {
  public readonly effect: ReactiveEffect<T>
  public _dirty = true
  private _value!: T
  constructor(getter, private readonly _setter, isReadonly: boolean) {
    this.effect = new ReactiveEffect(getter, () => {
      // 判断当前脏的状态，如果为 false，表示需要《触发依赖》
      if (!this._dirty) {
        // 将脏置为 true，表示
        this._dirty = true
        triggerRefValue(this)
      }
    })
    this.effect.computed = this
  }

  get value() {
    // 收集依赖
    trackRefValue(this)
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newValue) {
    this._setter(newValue)
  }
}
```

这个代码也不复杂。

首先是加一个\_dirty 的变量来控制，当第一次触发 get 的时候，执行一遍 run,也就是 computed 里面的计算函数。

当第二次访问的时候，因为\_dirty 已经改为 false 了，所以不会重新计算。

当 computed 里面的值发生变化的时候，则走到 scheduler 里面的逻辑，触发一次 triggerRefValue，重新执行一遍计算。

到这里，看起来没有什么问题了，我们写个 demo 试一下。

```
    const { reactive, effect, ref, computed } = Vue

    const obj = reactive({
      name: '张三'
    })

    // C1
    const computedObj = computed(() => {
      console.log('computed')
      return '姓名：' + obj.name
    })

    // e1
    effect(() => {
      document.querySelector('#app').innerHTML = computedObj.value
    })

    setTimeout(() => {
      obj.name = '李四'
    }, 2000)

```

我们来看看结果，执行了两次计算，是符合预期的。

我们再试试访问两次，看有没有什么不同。

因为从代码中我们可以看到，由于\_dirty 的控制，computed 多次访问是不会触发重新执行的，只有改变值才会重新执行。

我们把 e1 改成如下

```
  effect(() => {
      document.querySelector('#app').innerHTML = computedObj.value
      document.querySelector('#app').innerHTML = computedObj.value
  })
```

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fa42864e75c84f52ae68f217e9f07bd0~tplv-k3u1fbpfcp-watermark.image?)

预期应该是计算三次对吧，但是实际上会一直执行计算。

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c809be30655d42a694c421412377febd~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

这个问题解释起来比较复杂，下一篇我们再聊。

# 总结

computed 的实现，主要是通过 effect 来监听数值变化，通过\_dirty 变量来控制是否需要重新计算。

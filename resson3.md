关于 vue 的响应式数据，你可能有很多疑惑。

**比如为什么要改用 proxy?**

**比如为什么有 reactive 和 ref 两个 api?**

**比如 vue 是如何实现响应式的？**

其实这些在源码中，都能找到答案。

在第一篇 vue3 有哪些升级中，我也提了一下使用 proxy 的好处，以及 Object.defineProperty 的缺陷。但是今天，我想换个角度，让 chatGPT 来回答一下这个问题。

嗯，我感觉比我总结的好。

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f4c58161ae8a4055a70fed7b5cd17ad9~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

那继续下一个问题。

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f25bf169b6c140d287a6bac14dabe89d~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

这个回答感觉就比较官方了，没有回答到我想要的答案。

**理由其实很简单，因为 proxy 方法不能代理值类型，只能代理对象。所以需要一个额外的方法，来处理值类型的数据。**

**当然你也可以一个 ref 走天下，vue 源码做了兼容会自动进行转换**

有了这些理解之后，我们来看今天的重头戏，自己仿照 vue3 源码，实现一个响应式系统。

[相关代码可以点击查看](https://github.com/yeshaojun/v3-mini)，根据文章的标题选择不同的分支即可。

# 实现 reactive

在前文我们也介绍了，reactive 其实用的是 proxy 代理对象。

我们可以使用 proxy 实现一个简单的代理函数 reactive。

```
      function reactive(target) {
        const isObject = (val) =>  val !== null && typeof val === 'object'

        if (!isObject(target)) {
          console.warn(`数据必须是对象: ${String(target)}`)
          return target
        }

        const proxy = new Proxy(target, {
          get: (target, key, receiver) => {
            console.log('get', key)
            const res = Reflect.get(target, key, receiver)
            // track(target, key)
            // 这句很关键，不然嵌套数据，里面的不会响应
            if (isObject(res)) {
              return reactive(res)
            }
            return res
          },
          set: (target, key, value, receiver) => {
            console.log('set', key, value)
            const result = Reflect.set(target, key, value, receiver)
            // trigger(target, key, value)
            return result
          },
          deleteProperty: () => {
            const result = Reflect.deleteProperty(target, key)
            return result
          }
        })
        return proxy
      }

      const person = reactive({
        name: '',
        age: 18,
        like: ['apple']
      })

      person.name  = 'vue test'
```

**注意：Reflect**

Reflect.get(target, key）跟直接访问 target[key]是有一点差别的。

当代理对象中，有 get,set 等 this 指向的时候，可以重定向 this。

举个例子：

```
        const person = new Proxy({
            name: "vue test",
            age: 18,
            get info() {
                return 'name is :' + this.name + ' age is:' + this.age
            }
        }, {
            get: (target, key, receiver) => {
                console.log('get', key)
                // return target[key]
                return Reflect.get(target, key, receiver)
            }
        })
        console.log(person.info)
```

使用 Reflect，我们在访问 name, age 的时候均可以触发。
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/44b183bdea3a4bf58cd43c25c8ec2121~tplv-k3u1fbpfcp-watermark.image?)

改成 target 之后，则只会在 info 触发一次。

```
return target[key]
```

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6621eb036d9743a09f0cec236aeca91a~tplv-k3u1fbpfcp-watermark.image?)

# 实现 ref

在 vue3 中，ref 是通过 get 和 set 来实现的。

跟上面类似，也还是先声明一个函数，然后通过 get，set 来访问数据。

```
      function ref(value) {
        return new RefImpl(value)
      }

      class RefImpl {
        constructor(value) {
          // 如果值是对象，则用reactive处理
          this._value = isObject(value) ? reactive(value) : value
          // 记录一下初始值
          this._rawValue = value
        }
        get value() {
          // trackRefValue(this)
          return this._value
        }

        set value(newVal) {
          if (!Object.is(newVal, this._rawValue)) {
            // 更新原始数据
            this._rawValue = newVal
            // 更新 .value 的值
            this._value = isObject(newVal) ? reactive(newVal) : value
            // triggerRefValue(this)
          }
        }
      }
```

源码也很直观的解释了，为什么 ref 的使用一定要用.value 的方式使用，因为 get/set 就是通过 value 来设置的。

# 添加依赖收集与触发

数据代理我们已经完成了，但是数据更改之后，怎么通知组件实现双向绑定呢？

答案就是依赖手机与触发，也就是当触发 get 的时候，我把触发 get 的这个条件【函数】给保存起来，当触发 set 的时候，重新执行一下触发一下这个条件【函数】不就行了吗。

还是来看代码，我加一个 track 收集的方法，加一个 target 触发的方法。（也就是上面代码片段注释掉的两行代码）

除此之外，还需要一个 effect 函数来管理触发函数。

```
      let activeEffect = null
      const targetMap = new WeakMap()
      // 依赖收集/触发
      function track(target, key) {
        let depsMap = targetMap.get(target)
        if (!depsMap) {
          targetMap.set(target, (depsMap = new Map()))
        }
        let dep = depsMap.get(key)
        if (!dep) {
          dep = new Set()
        }
        dep.add(activeEffect)
        depsMap.set(key, dep)
      }

      function trigger(target, key, value) {
        const depsMap = targetMap.get(target)
        if (!depsMap) {
          return
        }
        const deps = depsMap.get(key)
        if (!deps) {
          return
        }

        deps.forEach(effectFn => {
          if (effectFn.scheduler) {
            effectFn.scheduler()
          } else {
            effectFn()
          }
        })
      }

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
      const person = reactive({
        name: "hello world"
      })
      effect(() => {
        console.log('effect person', person.name)
      })

      setTimeout(() => {
        person.name = 'setTimeout world'
      }, 2000)

```

activeEffect 用来存触发的条件函数。

targetMap 用来存放依赖字典，格式如下

```
{
    target: {
        key: []
    }
}
```

输出结果为 hello world，2 秒之后，重新执行依赖性函数，输出 setTimeout world

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bcefd6255f2e485cbac690d35b5d5e3f~tplv-k3u1fbpfcp-watermark.image?)

# 总结

数据的代理并不复杂，就是在 proxy 的基础上，加上一些边界处理。而要实现响应式则需要加上依赖收集，依赖触发的实现。

effect 是一个很重要的函数，很多 api 是基于这个函数开发的，比如 useEffect, watch。组件的更新也是基于 effect 函数，这个后续还会提到。

如果不太理解 effect,可以梳理一下执行顺序。

- **1.调用 effect 函数，并传入参数 fn**
- **2.申明一个 effectFn 函数，并执行，将函数保存为 activeEffect**
- **3.执行 fn，读取 person.name**
- **4.走 proxy 的 get 代理**
- **5.收集依赖，将 activeEffect 保存的函数存到全局 map 中**
- **6.此时，effect 函数执行完毕，等待数据更新**
- **7.2s 后，走 proxy 的 set 代理**
- **8.执行全局 map 中保存的函数，重新执行 effect 函数，再次回到步骤 1**

[相关代码可以点击查看](https://github.com/yeshaojun/v3-mini)，选择 lesson3 分支即可。

文章相关代码，可在 vue/examples 中查看，仿 vue 实现版本可在 packages/reactivity 中查看。

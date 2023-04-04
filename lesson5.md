# 先简单回顾一下。

在上一篇中，我们仿 vue 源码自己实现了一个 computed。

写了如下的测试代码。

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
        document.querySelector('#app').innerHTML = computedObj.value
      })

      setTimeout(() => {
        obj.name = '李四'
      }, 2000)
```

我们发现 computed 多次访问的时候，会出现死循环。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d8dde83df8274784bdf1f189291c739a~tplv-k3u1fbpfcp-watermark.image?)

# 为什么会有死循环

这个问题出在哪了呢？

我们先看一下这段代码的执行情况。（当时看源码，我也是理了好几遍，才理出头绪。有条件的话，还是建议 clone 代码自己调试一遍）

我们直接看 effect。

**1.先执行 effect 函数，设置 activeEffect 为传进来的参数，也就是挂载 dom 的这个函数，我们把这个函数就叫 e1。**

```
//叫e1
() => {
   document.querySelector('#app').innerHTML = computedObj.value
   document.querySelector('#app').innerHTML = computedObj.value
}
```

**2.执行 e1 函数**

第一次执行 computedObj.value，此时会执行如下代码。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b6b5607617ed43c9ab79127a1733bd49~tplv-k3u1fbpfcp-watermark.image?)

先是收集依赖，将 e1 收集起来；

【此时，key 为 computedObj， activeEffect 为 e1】

因为此时，\_dirty 是 true，所以会执行 computed 计算函数。

执行 effect.run,也就是下面这段逻辑，我们把这个函数叫做 c1

```
// 叫c1
() => {
  console.log('con')
  return '姓名：' + obj.name
}
```

执行 obj.name 触发 reactive 的 get，将 C1 收集起来。

【此时，key 为 obj, activeEffect 被改为 C1】

**3 第二次执行 computedObj.value**

依旧会触发一次依赖收集。

【此时，key 为 computedObj， activeEffect 已经被改为为 C1 了】

此时\_dirty 为 false,则不会执行计算。

**effct 执行完毕，此时 computedObj 有两个依赖，分别是 e1 和 c1。obj 上有一个依赖，为 c1**

**4.在 2 秒后，触发 obj.name 的 set 事件，则触发 obj 上的依赖函数，开始遍历执行。**

注意，因为 computed 中使用了 scheduler,所以此时的 c1。

所以会执行如下代码

```
    this.effect = new ReactiveEffect(getter, () => {
      // 判断当前脏的状态，如果为 false，表示需要《触发依赖》
      if (!this._dirty) {
        // 将脏置为 true，表示
        this._dirty = true
        triggerRefValue(this)
      }
    })
```

**5.执行 triggerRefValue(this)**

triggerRefValue(this)会触发 computedObj 上的依赖。

此时 dirty = true， 并遍历执行 e1，c1 依赖函数。

```
  for (const effect of effects) {
     triggerEffect(effect)
  }
```

**6.当执行 e1 函数时，又会触发 computed.get，并将 e1 加入依赖。**

此时【key 为 computedObj， activeEffect 为 e1】

由于此时，\_dirty 是 true，则又会执行 run,重新计算。

此时【key 为， activeEffect 为 c1】

**7.当执行 c1 时，因为之前 e1 函数已经将\_dirty 改为 false 了，于是又会开始执行 triggerRefValue(this)，遍历 computedObj 上的依赖 c1 和 e1。**

因为此时 computedObj 依旧是有 e1 和 c1 两个依赖，又会重新回到第 5 步，造成死循环。

# 如何解决死循环

那找到了问题，如何解决呢？

其实方法也很简单，在第 6 步的时候，我们只要确保让 c1 先执行，e1 后执行就行，

先执行 c1 时，因为此时 dirty 是 true,所以不会重复执行 triggerRefValue(this)。

然后再执行 e1,添加依赖。

vue 源码也是这么实现的，先把 computed 的依赖执行完，然后再执行其他依赖。

这也就是为什么，vue 源码中触发依赖，有两次遍历。

```
export function triggerEffects(
  dep: Dep | ReactiveEffect[],
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
  // spread into array for stabilization
  const effects = isArray(dep) ? dep : [...dep]
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect, debuggerEventExtraInfo)
    }
  }
  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect, debuggerEventExtraInfo)
    }
  }
}

```

# 总结

不管是数据的响应式，还是 computed 的实现，亦或是 vue 组件的更新。

本质都是通过 effec 侦听器来实现的。

对于 effec 有几点要理解清楚。

**1.activeEffect 是会不断变化的，这就导致，同样的代码，可能收集到的依赖函数是不一样的。**

比如上文的 computedObj 对象，两次收集得依赖就是不同的，因为第二次没有计算函数的执行。

**2.设置了 scheduler，再次触发的时候，执行函数就变成了 scheduler。**

比如上文收集的依赖函数 c1。

到这里，effet 应该有比较深入的认识了，下一篇再讲讲如何通过 effec 侦听器来控制更新的时机，来实现组件更新。

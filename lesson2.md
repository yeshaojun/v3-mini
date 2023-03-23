```
        <div id="app">{{msg}}</div>
        <script>
          const { createApp } = Vue
          const APP = {
            data() {
              return {
                msg: 1
              }
            }
          }
          const app = createApp(APP)
          app.mount('#app')
        </script>
```

我们以这样一段代码为例。

今天来聊聊 vue 的 createApp 方法是怎么把 vue 组件变成真实 dom 的。

我们自己可以从需求出发，先分析一下。

# createApp 要做哪些事？

首先 createApp 是一个函数，接受一个对象参数。

其次 createApp 返回了一个对象，对象中有个 mount 方法。

根据这两点，我们可以很简单的写一个如下的 createApp 函数。

```
  function createApp(app) {
    return {
      mount(el) {
        const dom = document.querySelector(el)
        dom.innerText = app.data().msg
      }
    }
  }
```

但是这里有几个问题，**一个是数据改变了，dom 需要重新渲染。另一个是赋值操作，我们是写死的，这个应该根据语法判断。**

所以我们至少要加上 3 个步骤。【伪代码】

```
  function createApp(app) {
    return {
      mount(el) {
        const dom = document.querySelector(el)
        // 1.监听数据变化
        const $proxy = new Proxy(app.data(), {
            get: () => {},
            set: () => {}
        })
        // 2.当数据变化时，更新dom
        updateComponent()
        // 3.语法分析，将值绑定到dom
        dom.innerText = app.data().msg
      }
    }
  }
```

理解到这里，我们再去看看 vue 是如何实现的。

# vue 是如何渲染 dom 的？

### 1.调用 createApp 方法，创建实例

跟我们自己写的 demo 类似，vue 也是先创建一个实例，返回 app 对象。

只不过 vue 返回的 app 对象，上面定义了很多方法和属性。

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/28af501769844d0a9e021a1fde4b7cc3~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

### 2.调用 mount

将 id=app 的 div 元素作为根节点，{{msg}}作为 tempalte,创建虚拟节点，然后调用 render 函数渲染。

**从这里可以看出，vue 渲染 dom 是将 dom 先转化为虚拟 dom,然后通过 render 函数渲染。**

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/10407a13e5744a21966d55005cd6341f~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

### 3.调用 render 函数【虚拟 dom 暂时先不看】

render 方法，就是 runtime 的一个核心了。

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/60b8ca0750974a6ebdd26ef70b85288e~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

第一次调用，直接走 patch 方法。

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b15b681a8b348c0b9c18949ccdbbb09~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

在 patch 中会根据虚拟节点的类型，做不同的处理。

此处，我们是组件，所以会调动 processComponent 处理组件。

因为是第一次执行，所以会走 mountComponent 方法。

### 4.调用 mountComponent

在这个方法中做了几件事情，是比较重要的。

**- 4.1.创建组件实例**
组件的数据，方法都会挂载到实例上。

**- 4.2.处理组件的数据，包括数据代理，props 处理等**

在挂载组件的过程中，会判断组件是否有 render 函数，如果没有，则调用 compiler 去解析 template,并返回一个 render 函数。

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7aea9899593b46a7a5ab6571205dd04d~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

compiler 模块就是在这里与 runtime 模块做交互的。

**- 4.3.添加监听器，当有数据改变时，重新渲染 dom**

组件挂载前，会创建一个监听器，当组件内部有数据变化时，会触发更新函数，重新渲染组件。更新的时候，就涉及到 dom diff 算法了，这个后面我们再说。

# vue 核心模块是如何工作的？

梳理了一遍源码逻辑，我们对 vue 的各个模块应该有了初步的了解。

从 vue 源码的目录结构，我们可以很清楚地看到，vue 有几个核心模块。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0b00fb755b634afe9ff3bdd0b1fd64d8~tplv-k3u1fbpfcp-watermark.image?)

从名字中，我们也能大概看出来，vue 核心逻辑可以分为 3 大块。(SSR 服务渲染，sfc 单文件渲染暂时不管，只看核心逻辑)

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/189d76cad8644bc8aa694ec62f31743d~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

根据 vue 渲染 dom 的逻辑，我们可以得出如下的渲染步骤。

- 1.创建虚拟 dom
- 2.调用 render 函数挂载组件
- 3.挂载过程需要处理组件内的数据，并创建监听器
  - 3.1 当有数据变化时，通知监听器，调用更新组件方法
  - 3.2 比对新旧组件
- 4.渲染真实 dom

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/265fa67035b44802a068ee065bb5f80b~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

# 为什么建议你读一读 vue 源码？

做了多年的前端，感觉每天都在重复的调接口。技术栈学了好多，但水平感觉没有涨多少，对很多问题也是一知半解。

如果你也有这样的困惑，那读源码可能是最好的突破口。

所以我今年也是立了个 flag,希望可以多看一些源码。

看源码，肯定得从最熟悉的 vue 开始了。

vue 源码内容还是挺多的，而且代码需要考虑各种边界情况，所以阅读起来还是有一定难度，所以本人在肝了 3 个月后，准备来谈谈对 vue3 的理解，希望可以梳理出一条清晰的逻辑线。

文章为系列文章，最终会实现一个最简单的 todo,大概长这样。

```
      <header>
        <input type="text" :value="todo" @input="input"></input>
      </header>
      <main>
        <button @click="add">add todo</button>
        <ul>
          <li v-for="item in list" :key="item">
            {{ item.name }}
            <button @click="remove(item.id)">remove</button>
          </li>
        </ul>
      </main>
```

```
      const { createApp } = Vue
      const APP = {
        data() {
          return {
            list: [{
              name: "吃饭",
                id: 1
            }],
            todo: ""
          }
        },
        methods: {
          add() {
              this.list.push({
                  name: this.todo,
                  id: new Date().getTime()
              })
              this.todo = ''
            },
            input(e) {
              this.todo = e.target.value
            },
            remove(id) {
              const index = this.list.findIndex(item => item.id == id);
              this.list.splice(index, 1)
            }
        },
        mounted() {
          this.todo = 'init todo'
        },
      }
      const app = createApp(APP)
      app.mount('#app')
```

虽然代码很简单，但是可以把 vue 的整个核心逻辑走一遍，包括响应式数据，运行时，模板编译，diff 比对等

代码地址为https://github.com/yeshaojun/v3-mini, 后续文章会单独开一个分支出来，不同的文章对应不同的分支。

# vue3 有哪些变化

在开始之前，先看看 vue3 的一些变化，为什么会有这些变化？

### 1.对 ts 的支持

现在 ts 越来越普及，基本上已经成为前端的标配了。

而用过 vue2 的应该都知道，vue2 对 ts 的支持并不友好。当然这并不是因为 vue2 的类型管理是用 Flow.js 写的，而是因为 vue2 的实例化是通过 new 方法来创建的，数据绑定在 this 中，ts 很难对 this 中的静态方法做类型推导。

**那就又有一个问题了，为什么 this 很难做类型推导呢？**

这就涉及 tree shaking 的原理了，感兴趣的可以看这篇文https://blog.csdn.net/qq_34629352/article/details/104256311

我截取了其中一个回答，意思就是 javascript 动态语言的特性使得静态分析比较困难
<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/411cd90c248a44169ba7974aeeefc726~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

**那 vue3 是怎么做的呢？**

```
import { createApp } from 'vue';
createApp({
    template: "<div>hello world</div>"
}).mount('#app')
```

细心的你应该也已经发现了，vue3 实例化的方式，是通过函数的方式创建的，而函数对 ts 的支持是很好的。

### 2.响应式实现方式改变了

vue 的响应式数据是一大特色，而 vue2 的响应式是基于 Object.defineProperty()这个 api 实现的，有很多缺陷，无法监听数组，也无法监听删除事件。基于这个缺陷，在 vue2 中做了很多判断以及兼容。（比如对数组操作的方法扩展等）

而在 vue3 中，则改成了 proxy，实现了真正的代理，并提升了性能。

### 3.Composition API 组合语法（这个特性非常棒）

vue2 采用的 Option API 对于代码量大的情况下并不友好，会有反复横跳的问题，而且代码很难复用。而如果使用 mixins,会有变量重复，数据来源不清晰等问题。

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/baa633b98fdc4b1fa39f738e62c18c54~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

有了 Composition API， 就可以方便的写 hook 了，这将大大的提高开发效率。

举个简单的例子，api 请求。

在 vue2 中，写法大概是这样的。

```
this.loading = true
api().then(res =>{
    this.result = res
}).error(err => {
    this.error = err
}).finally(() =>{
    this.loading = false
})
```

使用 hook，则只需要一行代码。

```
const { data, loading, error } = useFetch()
```

### 4.vue3 更快更高效了

在 vue 的编译阶段，以及 dom 树比对阶段都做了大量的优化，使 vue3 速度更快。最主要的就是**补丁标记和动态属性记录**，除此之外还有事件缓存，使用微任务更新组件等

具体的可以查看官方对渲染的说明，还提供了在线体验的地址。https://cn.vuejs.org/guide/extras/rendering-mechanism.html#virtual-dom

### 5.扩展性更好了

vue 中是使用虚拟节点, 也就是一段 js 来表示 dom 节点的。

既然是 js,就可以编译成不同的语法，而不仅仅只是 dom。

在 vue3 中，所有跟平台的操作，都进行了拆包，那就是拆包，使用最近流行的 monorepo 管理方式，响应式、编译和运行时全部独立了。

这一点从 vue3 的代码结构中，也很容易看出来。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2f5002739f82470aa060dec823934022~tplv-k3u1fbpfcp-watermark.image?)

剩下的一些 vue3 新特性，可以查看官方的 vue 迁移文档说明 https://v3-migration.vuejs.org/zh/

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8ea684917bc544728a6845dd5fab56e7~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

# 如何开始调试源码

想要调试源码，肯定要先下载源码。

不知道怎么找的，可以直接打开 vue3 官网，点击右上角的 github 连接就行。

vue3 的源码是 core 这个仓库，找到之后就是下载，安装依赖。

```
1. git clone https://github.com/vuejs/core

2. cd core

3.pnpm i

4.将package.json中的dev改为"dev": "node scripts/dev.js --sourcemap",

5.pnpm run dev

```

看源码肯定需要断点调试，这个大家应该都会。（老手可以跳过了，新手还是简单提醒一下）

当前执行函数，当前脚本中的变量可以在作用域中查看，如果有些变量，作用域中没有，可以在监视中自行添加。

设置完断点之后，可在右侧断点位置切换与取消。

还有一个常用的地方是调用栈，特别是分支多的时候，追踪函数执行非常的方便，可以直接点击列表查看调用关系。

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0590bda1e3ea46e6bf45a22d530d1f71~tplv-k3u1fbpfcp-watermark.image?" alt="image.png" width="100%" />

在 packages/vue/examples 中有很多例子，接下来就开始愉快的调试源码吧。

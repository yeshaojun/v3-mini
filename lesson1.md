### 为什么建议你读一读 vue 源码？

做了多年的前端，感觉每天都在重复的调接口。技术栈学了好多，但水平感觉没有涨多少，对很多问题也是一知半解。所以今年立了 flag,希望可以多看一些源码。

看源码，肯定得从最熟悉的 vue 开始了。

在开始之前，先看看 vue3 的一些变化，为什么会有这些变化？

1.对 ts 的支持

现在 ts 越来越普及，基本上已经成为前端的标配了。

而用过 vue2 的应该都知道，vue2 对 ts 的支持并不友好。当然这并不是因为 vue2 的类型管理是用 Flow.js 写的，而是因为 vue2 的实例化是通过 new 方法来创建的，数据绑定在 this 中，ts 很难对 this 中的静态方法做类型推导。

那就又有一个问题了，为什么 this 很难做类型推导呢？

这就涉及 tree shaking 的原理了，感兴趣的可以看这篇文章https://blog.csdn.net/qq_34629352/article/details/104256311

那 vue3 是怎么做的呢？

细心的你应该也已经发现了，vue3 实例化的方式，是通过函数的方式创建的，而函数对 ts 的支持是很好的。

2.响应式实现方式改变了

vue 的响应式数据是一大特色，而 vue2 的响应式是基于 Object.defineProperty()这个 api 实现的，有很多缺陷，无法监听数组，也无法监听删除事件。基于这个缺陷，在 vue2 中做了很多判断以及兼容。（比如对数组操作的方法扩展等）

而在 vue3 中，则改成了 proxy，实现了真正的代理，并提升了性能。

3.Composition API 组合语法（这个特性非常棒）

好多事情，做之前并不知道会有什么意义，做着做着，就会找到意义
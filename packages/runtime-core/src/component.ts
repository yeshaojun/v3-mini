import { reactive } from '@vue/reactivity'
import { isFunction, isObject } from '@vue/shared'
import { compile } from '@vue/vue-compat'
import { onBeforeMount, onMounted } from './apiLifecycle'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'

/**
 * 生命周期钩子
 */
export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm'
}

let uid = 0

/**
 * 规范化组件实例数据
 */
export function setupComponent(instance) {
  // initprops initSlots
  // 为 render 赋值
  const setupResult = setupStatefulComponent(instance)
  return setupResult
}

function setupStatefulComponent(instance) {
  const Component = instance.type
  const { setup } = Component
  // 存在 setup ，则直接获取 setup 函数的返回值即可
  if (setup) {
    // instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
  } else {
    // 获取组件实例
    finishComponentSetup(instance)
  }
}

/**
 * 创建组件实例
 */
export function createComponentInstance(vnode) {
  const type = vnode.type

  const instance = {
    uid: uid++, // 唯一标记
    vnode, // 虚拟节点
    type, // 组件类型
    subTree: null!, // render 函数的返回值
    effect: null!, // ReactiveEffect 实例
    update: null!, // update 函数，触发 effect.run
    render: null, // 组件内的 render 函数
    // 生命周期相关
    isMounted: false, // 是否挂载
    bc: null, // beforeCreate
    c: null, // created
    bm: null, // beforeMount
    m: null // mounted
  }

  return instance
}

export function handleSetupResult(instance, setupResult) {
  // 存在 setupResult，并且它是一个函数，则 setupResult 就是需要渲染的 render
  // console.log('handleSetupResult', isFunction(setupResult))
  if (isFunction(setupResult)) {
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    instance.data = setupResult
  }
  finishComponentSetup(instance)
}

export function finishComponentSetup(instance) {
  const Component = instance.type
  // 存在render, 不需要处理
  // 组件不存在 render 时，才需要重新赋值
  if (!instance.render) {
    // 存在编辑器，并且组件中不包含 render 函数，同时包含 template 模板，则直接使用编辑器进行编辑，得到 render 函数
    if (compile && !Component.render) {
      if (Component.template) {
        // 这里就是 runtime 模块和 compile 模块结合点
        const template = Component.template
        Component.render = compile(template)
      }
    }
    // 为 render 赋值
    instance.render = Component.render
  }

  // 改变 options 中的 this 指向
  applyOptions(instance)
}

function applyOptions(instance: any) {
  const {
    data: dataOptions,
    beforeCreate,
    created,
    beforeMount,
    mounted,
    methods
  } = instance.type

  // hooks
  if (beforeCreate) {
    callHook(beforeCreate, instance.data)
  }

  // 存在 data 选项时
  if (dataOptions) {
    // 触发 dataOptions 函数，拿到 data 对象
    const data = dataOptions.call(instance)
    // 如果拿到的 data 是一个对象
    if (isObject(data)) {
      // 则把 data 包装成 reactiv 的响应性数据，赋值给 instance
      instance.data = reactive(data)
    }
  }

  if (methods) {
    for (const key in methods) {
      const methodHandler = methods[key]
      if (isFunction(methodHandler)) {
        instance.data[key] = methodHandler.bind(instance.data)
      }
    }
  }

  // hooks
  if (created) {
    callHook(created, instance.data)
  }

  function registerLifecycleHook(register: Function, hook?: Function) {
    register(hook?.bind(instance.data), instance)
  }

  console.log('data', instance.data)
  // 注册 hooks
  registerLifecycleHook(onBeforeMount, beforeMount)
  registerLifecycleHook(onMounted, mounted)
}

/**
 * 触发 hooks
 */
function callHook(hook: Function, proxy) {
  hook.bind(proxy)()
}

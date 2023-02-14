var Vue = (function (exports) {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    /**
     * 判断是否为一个数组
     */
    var isArray = Array.isArray;
    var isObject = function (val) {
        return val !== null && typeof val === 'object';
    };
    /**
     * 对比两个数据是否发生了改变
     */
    var hasChanged = function (value, oldValue) {
        return !Object.is(value, oldValue);
    };
    /**
     * 合并对象
     */
    var extend = Object.assign;
    /**
     * 是否为函数
     */
    var isFunction = function (val) {
        return typeof val === 'function';
    };
    /**
     * 只读的空对象
     */
    var EMPTY_OBJ = {};
    /**
     * 判断是否为一个 string
     */
    var isString = function (val) { return typeof val === 'string'; };
    var onRE = /^on[^a-z]/;
    /**
     * 是否 on 开头
     */
    var isOn = function (key) { return onRE.test(key); };

    var createDep = function (effects) {
        var dep = new Set(effects);
        return dep;
    };

    var activeEffect;
    var targetMap = new WeakMap();
    // 依赖收集
    function track(target, key) {
        if (!activeEffect) {
            return;
        }
        var depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        var dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        trackEffects(dep);
    }
    // 利用dep 依次跟踪指定的key的所有effect
    function trackEffects(dep) {
        activeEffect.deps.push(dep);
        dep.add(activeEffect);
    }
    // 依赖触发
    function trigger(traget, key, newValue) {
        var depsMap = targetMap.get(traget);
        if (!depsMap) {
            return;
        }
        var dep = depsMap.get(key);
        if (!dep) {
            return;
        }
        triggerEffects(dep);
    }
    function triggerEffects(dep) {
        var e_1, _a, e_2, _b;
        var effects = isArray(dep) ? dep : __spreadArray([], __read(dep), false);
        try {
            for (var effects_1 = __values(effects), effects_1_1 = effects_1.next(); !effects_1_1.done; effects_1_1 = effects_1.next()) {
                var effect_1 = effects_1_1.value;
                if (effect_1.computed) {
                    triggerEffect(effect_1);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (effects_1_1 && !effects_1_1.done && (_a = effects_1.return)) _a.call(effects_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var effects_2 = __values(effects), effects_2_1 = effects_2.next(); !effects_2_1.done; effects_2_1 = effects_2.next()) {
                var effect_2 = effects_2_1.value;
                if (!effect_2.computed) {
                    triggerEffect(effect_2);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (effects_2_1 && !effects_2_1.done && (_b = effects_2.return)) _b.call(effects_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    function triggerEffect(effect) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
    function effect(fn, options) {
        var _effect = new ReactiveEffect(fn);
        if (options) {
            extend(_effect, options);
        }
        if (!options || !options.lazy) {
            // 执行 run 函数
            _effect.run();
        }
    }
    var ReactiveEffect = /** @class */ (function () {
        function ReactiveEffect(fn, scheduler) {
            if (scheduler === void 0) { scheduler = null; }
            this.fn = fn;
            this.scheduler = scheduler;
            this.deps = [];
            // 是否停止
            this.active = true;
        }
        ReactiveEffect.prototype.run = function () {
            if (!this.active) {
                return this.fn();
            }
            try {
                activeEffect = this;
                return this.fn();
            }
            finally {
                if (this.deferStop) {
                    this.stop();
                }
            }
        };
        ReactiveEffect.prototype.stop = function () {
            console.log('effect stop');
            debugger;
            if (this.active) {
                cleanupEffect(this);
                if (this.onStop) {
                    this.onStop();
                }
                this.active = false;
            }
        };
        return ReactiveEffect;
    }());
    function cleanupEffect(effect) {
        var deps = effect.deps;
        if (deps.length) {
            for (var i = 0; i < deps.length; i++) {
                deps[i].delete(effect);
            }
            deps.length = 0;
        }
    }

    var get = createGetter();
    var set = createSetter();
    function createGetter() {
        return function get(target, key, receiver) {
            var res = Reflect.get(target, key, receiver);
            track(target, key);
            return res;
        };
    }
    function createSetter() {
        return function set(target, key, value, receiver) {
            var result = Reflect.set(target, key, value, receiver);
            trigger(target, key);
            return result;
        };
    }
    var mutableHandlers = {
        get: get,
        set: set
        //   deleteProperty,
        //   has,
        //   ownKeys
    };

    var reactiveMap = new WeakMap();
    function reactive(target) {
        return createReactiveObject(target, mutableHandlers, reactiveMap);
    }
    // 创建proxy代理
    function createReactiveObject(target, baseHandlers, proxyMap) {
        if (!isObject(target)) {
            console.warn("value cannot be made reactive: ".concat(String(target)));
            return target;
        }
        var existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        var proxy = new Proxy(target, baseHandlers);
        proxy["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */] = true;
        proxyMap.set(target, proxy);
        return proxy;
    }
    // 判断是否为对象，是则转位reactive
    var toReactive = function (value) {
        return isObject(value) ? reactive(value) : value;
    };
    // 是否为reactive对象
    var isReactive = function (value) {
        return !!(value && value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */]);
    };

    function isRef(r) {
        return !!(r && r.__v_isRef === true);
    }
    function ref(value) {
        return createRef(value, false);
    }
    function createRef(rawValue, shallow) {
        return new RefImpl(rawValue, shallow);
    }
    var RefImpl = /** @class */ (function () {
        function RefImpl(value, __v_isShallow) {
            this.__v_isShallow = __v_isShallow;
            // 标记是否是ref实例
            this.__v_isRef = true;
            this._value = __v_isShallow ? value : toReactive(value);
            this._rawValue = value;
        }
        Object.defineProperty(RefImpl.prototype, "value", {
            get: function () {
                // 收集依赖
                trackRefValue(this);
                return this._value;
            },
            set: function (newVal) {
                if (hasChanged(newVal, this._rawValue)) {
                    // 更新原始数据
                    this._rawValue = newVal;
                    // 更新 .value 的值
                    this._value = toReactive(newVal);
                    // 触发依赖
                    triggerRefValue(this);
                }
            },
            enumerable: false,
            configurable: true
        });
        return RefImpl;
    }());
    function trackRefValue(ref) {
        console.log('ref', ref, activeEffect);
        if (activeEffect) {
            trackEffects(ref.dep || (ref.dep = createDep()));
        }
    }
    /**
     * 为 ref 的 value 进行触发依赖工作
     */
    function triggerRefValue(ref) {
        if (ref.dep) {
            triggerEffects(ref.dep);
        }
    }

    var ComputedRefImpl = /** @class */ (function () {
        function ComputedRefImpl(getter, _setter, isReadonly) {
            var _this = this;
            this._setter = _setter;
            this._dirty = true;
            this.effect = new ReactiveEffect(getter, function () {
                // 判断当前脏的状态，如果为 false，表示需要《触发依赖》
                if (!_this._dirty) {
                    // 将脏置为 true，表示
                    _this._dirty = true;
                    triggerRefValue(_this);
                }
            });
            this.effect.computed = this;
        }
        Object.defineProperty(ComputedRefImpl.prototype, "value", {
            get: function () {
                // 收集依赖
                trackRefValue(this);
                if (this._dirty) {
                    this._dirty = false;
                    this._value = this.effect.run();
                }
                return this._value;
            },
            set: function (newValue) {
                this._setter(newValue);
            },
            enumerable: false,
            configurable: true
        });
        return ComputedRefImpl;
    }());
    // 计算属性
    function computed(getterOrOptions) {
        var getter;
        var setter;
        var onlyGetter = isFunction(getterOrOptions);
        if (onlyGetter) {
            getter = getterOrOptions;
            setter = function () {
                return console.warn('Write operation failed: computed value is readonly');
            };
        }
        else {
            getter = getterOrOptions.get;
            setter = getterOrOptions.set;
        }
        var cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter);
        return cRef;
    }

    // 对应 promise 的 pending 状态
    var isFlushPending = false;
    /**
     * promise.resolve()
     */
    var resolvedPromise = Promise.resolve();
    /**
     * 待执行的任务队列
     */
    var pendingPreFlushCbs = [];
    /**
     * 队列预处理函数
     */
    function queuePreFlushCb(cb) {
        queueCb(cb, pendingPreFlushCbs);
    }
    /**
     * 队列处理函数
     */
    function queueCb(cb, pendingQueue) {
        // 将所有的回调函数，放入队列中
        pendingQueue.push(cb);
        queueFlush();
    }
    /**
     * 依次处理队列中执行函数
     */
    function queueFlush() {
        if (!isFlushPending) {
            isFlushPending = true;
            resolvedPromise.then(flushJobs);
        }
    }
    /**
     * 处理队列
     */
    function flushJobs() {
        isFlushPending = false;
        flushPreFlushCbs();
    }
    /**
     * 依次处理队列中的任务
     */
    function flushPreFlushCbs() {
        if (pendingPreFlushCbs.length) {
            // 去重
            var activePreFlushCbs = __spreadArray([], __read(new Set(pendingPreFlushCbs)), false);
            // 清空就数据
            pendingPreFlushCbs.length = 0;
            // 循环处理
            for (var i = 0; i < activePreFlushCbs.length; i++) {
                activePreFlushCbs[i]();
            }
        }
    }

    function callWithErrorHandling(fn, type, args) {
        var res;
        try {
            res = args ? fn.apply(void 0, __spreadArray([], __read(args), false)) : fn();
        }
        catch (err) {
            console.log(err);
        }
        return res;
    }

    function watch(source, cb, options) {
        return doWatch(source, cb, options);
    }
    function watchEffect(effect) {
        return doWatch(effect, null);
    }
    function doWatch(source, cb, _a) {
        var _b = _a === void 0 ? EMPTY_OBJ : _a, immediate = _b.immediate, deep = _b.deep;
        var getter;
        if (isRef(source)) {
            getter = function () { return source.value; };
        }
        else if (isReactive(source)) {
            getter = function () { return source; };
            deep = true;
        }
        else if (isFunction(source)) {
            getter = function () { return callWithErrorHandling(source); };
        }
        else {
            getter = function () { };
        }
        if (cb && deep) {
            var baseGetter_1 = getter;
            getter = function () { return traverse(baseGetter_1()); };
        }
        var oldValue = {};
        // 执行job执行方法
        var job = function () {
            if (cb) {
                var newValue = effect.run();
                if (deep || hasChanged(newValue, oldValue)) {
                    cb(newValue, oldValue);
                    oldValue = newValue;
                }
            }
            else {
                effect.run();
            }
        };
        // 调度器
        // 一个reactive的watch监听，可能触发多次scheduler，queuePreFlushCb的作用其实就是将更新触发加入队列，并只执行一次
        var scheduler = function () { return queuePreFlushCb(job); };
        var effect = new ReactiveEffect(getter, scheduler);
        if (cb) {
            if (immediate) {
                job();
            }
            else {
                oldValue = effect.run();
            }
        }
        else {
            effect.run();
        }
        return function () {
            effect.stop();
        };
    }
    function traverse(value, seen) {
        if (!isObject(value)) {
            return value;
        }
        seen = seen || new Set();
        seen.add(value);
        for (var key in value) {
            traverse(value[key], seen);
        }
        return value;
    }

    /**
     * @param value 规范class类
     */
    function normalizeClass(value) {
        var res = '';
        if (isString(value)) {
            res = value;
        }
        else if (isArray(value)) {
            // 遍历
            for (var i = 0; i < value.length; i++) {
                // 递归拼接
                var normalized = normalizeClass(value[i]);
                if (normalized) {
                    res += normalized + ' ';
                }
            }
        }
        else if (isObject(value)) {
            // for in 获取到所有的 key，这里的 key（name） 即为 类名。value 为 boolean 值
            for (var name_1 in value) {
                // 把 value 当做 boolean 来看，拼接 name
                if (value[name_1]) {
                    res += name_1 + ' ';
                }
            }
        }
        return res.trim();
    }

    var Fragment = Symbol('Fragment');
    var Text$1 = Symbol('Text');
    var Comment = Symbol('Comment');
    function createVNode(type, props, children) {
        // type是组件？
        // 暂不考虑
        // 通过 bit 位处理 shapeFlag 类型
        var shapeFlag = isString(type)
            ? 1 /* ShapeFlags.ELEMENT */
            : isObject(type)
                ? 4 /* ShapeFlags.STATEFUL_COMPONENT */
                : 0;
        if (props) {
            // 处理 class
            var klass = props.class; props.style;
            if (klass && !isString(klass)) {
                props.class = normalizeClass(klass);
            }
        }
        return createBaseVNode(type, props, children, shapeFlag);
    }
    /**
     * 构建基础 vnode
     */
    function createBaseVNode(type, props, children, shapeFlag) {
        var vnode = {
            __v_isVNode: true,
            type: type,
            props: props,
            shapeFlag: shapeFlag,
            key: (props === null || props === void 0 ? void 0 : props.key) || null
        };
        normalizeChildren(vnode, children);
        return vnode;
    }
    function normalizeChildren(vnode, children) {
        var type = 0;
        var shapeFlag = vnode.shapeFlag;
        if (children == null) {
            children = null;
        }
        else if (isArray(children)) {
            type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
        }
        else if (typeof children === 'object') {
            // object,则有可能是插槽，也有可能是vNode
            if (shapeFlag & (1 /* ShapeFlags.ELEMENT */ | 64 /* ShapeFlags.TELEPORT */)) {
                var slot = children.default;
                if (slot) {
                    // _c marker is added by withCtx() indicating this is a compiled slot
                    slot._c && (slot._d = false);
                    normalizeChildren(vnode, slot());
                    slot._c && (slot._d = true);
                }
                return;
            }
        }
        else if (isFunction(children)) {
            // function，则表示插槽
            children = { default: children };
            type = 32 /* ShapeFlags.SLOTS_CHILDREN */;
        }
        else {
            // children 为 string
            children = String(children);
            // 为 type 指定 Flags
            type = 8 /* ShapeFlags.TEXT_CHILDREN */;
        }
        // 修改 vnode 的 chidlren
        vnode.children = children;
        // 按位或赋值
        vnode.shapeFlag |= type;
    }
    function isVNode(value) {
        return value ? value.__v_isVNode === true : false;
    }
    /**
     * 根据 key || type 判断是否为相同类型节点
     */
    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }

    function h(type, propsOrChildren, children) {
        var l = arguments.length;
        if (l === 2) {
            if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
                // 对象
                if (isVNode(propsOrChildren)) {
                    return createVNode(type, null, [propsOrChildren]);
                }
                return createVNode(type, propsOrChildren);
            }
            else {
                return createVNode(type, null, propsOrChildren);
            }
        }
        else {
            if (l > 3) {
                children = Array.prototype.slice.call(arguments, 2);
            }
            else if (l === 3 && isVNode(children)) {
                children = [children];
            }
            return createVNode(type, propsOrChildren, children);
        }
    }

    /**
     * 标准化 VNode
     */
    function normalizeVNode(child) {
        if (typeof child === 'object') {
            return cloneIfMounted(child);
        }
        else {
            return createVNode(Text, null, String(child));
        }
    }
    /**
     * clone VNode
     */
    function cloneIfMounted(child) {
        return child;
    }
    function renderComponentRoot(instance) {
        var vnode = instance.vnode, render = instance.render, _a = instance.data, data = _a === void 0 ? {} : _a;
        var result;
        try {
            if (vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
                // 执行render，并把this绑定到data返回的对象上
                // core源码中是绑定到proxy上下文中
                result = normalizeVNode(render.call(data, data));
            }
        }
        catch (error) {
            console.log(error);
        }
        return result;
    }

    function injectHook(type, hook, target) {
        // 将 hook 注册到 组件实例中
        if (target) {
            target[type] = hook;
            return hook;
        }
    }
    /**
     * 创建一个指定的 hook
     * @param lifecycle 指定的 hook enum
     * @returns 注册 hook 的方法
     */
    var createHook = function (lifecycle) {
        return function (hook, target) { return injectHook(lifecycle, hook, target); };
    };
    var onBeforeMount = createHook("bm" /* LifecycleHooks.BEFORE_MOUNT */);
    var onMounted = createHook("m" /* LifecycleHooks.MOUNTED */);

    var uid = 0;
    /**
     * 规范化组件实例数据
     */
    function setupComponent(instance) {
        // initprops initSlots
        // 为 render 赋值
        var setupResult = setupStatefulComponent(instance);
        return setupResult;
    }
    function setupStatefulComponent(instance) {
        var Component = instance.type;
        var setup = Component.setup;
        // 存在 setup ，则直接获取 setup 函数的返回值即可
        if (setup) {
            var setupResult = setup();
            handleSetupResult(instance, setupResult);
        }
        else {
            // 获取组件实例
            finishComponentSetup(instance);
        }
    }
    /**
     * 创建组件实例
     */
    function createComponentInstance(vnode) {
        var type = vnode.type;
        var instance = {
            uid: uid++,
            vnode: vnode,
            type: type,
            subTree: null,
            effect: null,
            update: null,
            render: null,
            // 生命周期相关
            isMounted: false,
            bc: null,
            c: null,
            bm: null,
            m: null // mounted
        };
        return instance;
    }
    function handleSetupResult(instance, setupResult) {
        // 存在 setupResult，并且它是一个函数，则 setupResult 就是需要渲染的 render
        // console.log('handleSetupResult', isFunction(setupResult))
        if (isFunction(setupResult)) {
            instance.render = setupResult;
        }
        finishComponentSetup(instance);
    }
    function finishComponentSetup(instance) {
        var Component = instance.type;
        // 存在render, 不需要处理
        // 组件不存在 render 时，才需要重新赋值
        if (!instance.render) {
            // 存在编辑器，并且组件中不包含 render 函数，同时包含 template 模板，则直接使用编辑器进行编辑，得到 render 函数
            // if (compile && !Component.render) {
            // 	if (Component.template) {
            // 		// 这里就是 runtime 模块和 compile 模块结合点
            // 		const template = Component.template
            // 		Component.render = compile(template)
            // 	}
            // }
            // 为 render 赋值
            instance.render = Component.render;
        }
        // 改变 options 中的 this 指向
        applyOptions(instance);
    }
    function applyOptions(instance) {
        var _a = instance.type, dataOptions = _a.data, beforeCreate = _a.beforeCreate, created = _a.created, beforeMount = _a.beforeMount, mounted = _a.mounted;
        // hooks
        if (beforeCreate) {
            callHook(beforeCreate, instance.data);
        }
        // 存在 data 选项时
        if (dataOptions) {
            // 触发 dataOptions 函数，拿到 data 对象
            var data = dataOptions();
            // 如果拿到的 data 是一个对象
            if (isObject(data)) {
                // 则把 data 包装成 reactiv 的响应性数据，赋值给 instance
                instance.data = reactive(data);
            }
        }
        // hooks
        if (created) {
            callHook(created, instance.data);
        }
        function registerLifecycleHook(register, hook) {
            register(hook === null || hook === void 0 ? void 0 : hook.bind(instance.data), instance);
        }
        // 注册 hooks
        registerLifecycleHook(onBeforeMount, beforeMount);
        registerLifecycleHook(onMounted, mounted);
    }
    /**
     * 触发 hooks
     */
    function callHook(hook, proxy) {
        hook.bind(proxy)();
    }

    function createRenderer(options) {
        return baseCreateRenderer(options);
    }
    function baseCreateRenderer(options) {
        /**
         * 解构 options，获取所有的兼容性方法
         */
        var hostInsert = options.insert, hostPatchProp = options.patchProp, hostCreateElement = options.createElement, hostSetElementText = options.setElementText, hostRemove = options.remove, hostCreateText = options.createText, hostSetText = options.setText, hostCreateComment = options.createComment;
        /**
         * Element 的打补丁操作
         */
        var processElement = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode === null) {
                // 挂载操作
                mountElement(newVNode, container, anchor);
            }
            else {
                // 更新操作
                patchElement(oldVNode, newVNode);
            }
        };
        /**
         * 更新节点，打补丁
         */
        var patchElement = function (oldVNode, newVNode) {
            var el = (newVNode.el = oldVNode.el);
            // 新旧 props
            oldVNode.props || EMPTY_OBJ;
            newVNode.props || EMPTY_OBJ;
            // 更新子节点
            patchChildren(oldVNode, newVNode, el, null);
        };
        var patchChildren = function (oldVNode, newVNode, container, anchor) {
            var c1 = oldVNode && oldVNode.children;
            var prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0;
            var c2 = newVNode.children;
            // 新节点的 shapeFlag
            var shapeFlag = newVNode.shapeFlag;
            // 新旧节点，一共有3中情况，文本，空，数组
            // 判断新节点类型
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                if (c2 !== c1) {
                    hostSetElementText(container, c2);
                }
            }
            else {
                if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                        // 这里要进行 diff 运算
                        patchKeyChildren(c1, c2, container, anchor);
                    }
                }
                else {
                    if (prevShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                        hostSetElementText(container, '');
                    }
                }
            }
        };
        /**
         * diff比对
         */
        var patchKeyChildren = function (oldChildren, newChildren, container, parentAnchor) {
            var i = 0;
            // 新节点长度
            var newChildrenLength = newChildren.length;
            // 旧节点最大下标
            var oldChildrenEnd = oldChildren.length - 1;
            // 新节点最大下标
            var newChildrenEnd = newChildrenLength - 1;
            // 1. sync from start(之前向后对比)
            // (a b) c
            // (a b) d e
            while (i <= oldChildrenEnd && i <= newChildrenEnd) {
                var oldVNode = oldChildren[i];
                // 新节点标准化
                var newVNode = normalizeVNode(newChildren[i]);
                if (isSameVNodeType(oldVNode, newVNode)) {
                    patch(oldVNode, newVNode, container, null);
                }
                else {
                    break;
                }
                i++;
            }
            // 2. sync from end(自后向前对比)
            // a (b c)
            // d e (b c)
            while (i <= oldChildrenEnd && i <= newChildrenEnd) {
                var oldVNode = oldChildren[oldChildrenEnd];
                var newVNode = normalizeVNode(newChildren[newChildrenEnd]);
                if (isSameVNodeType(oldVNode, newVNode)) {
                    patch(oldVNode, newVNode, container, null);
                }
                else {
                    break;
                }
                oldChildrenEnd--;
                newChildrenEnd--;
            }
            // 3. common sequence + mount( 新节点多与旧节点时的 diff 比对)
            // (a b)
            // (a b) c
            // i = 2, e1 = 1, e2 = 2
            // (a b)
            // c (a b)
            // i = 0, e1 = -1, e2 = 0
            if (i > oldChildrenEnd) {
                // 新节点多
                if (i <= newChildrenEnd) {
                    var nextPos = newChildrenEnd + 1;
                    var anchor = nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor;
                    while (i <= newChildrenEnd) {
                        // 挂载新节点
                        patch(null, normalizeVNode(newChildren[i]), container, anchor);
                        i++;
                    }
                }
            }
            // 4. common sequence + unmount
            // (a b) c
            // (a b)
            // i = 2, e1 = 2, e2 = 1
            // a (b c)
            // (b c)
            // i = 0, e1 = 0, e2 = -1
            else if (i > newChildrenEnd) {
                // 旧节点多
                while (i <= oldChildrenEnd) {
                    unmount(oldChildren[i]);
                    i++;
                }
            }
            // 5. unknown sequence
            // [i ... e1 + 1]: a b [c d e] f g
            // [i ... e2 + 1]: a b [e d c h] f g
            // i = 2, e1 = 4, e2 = 5
            else {
                // 1. 前4步处理完之后，剩下需要[c d e] 变成 [e d c h]
                // 这个i是比对之后的i,也就是2
                var oldStartIndex = i;
                var newStartIndex = i;
                // 5.1 创建一个map，将新节点的key，以及序号做关联
                var keyToNewIndexMap = new Map();
                for (i = newStartIndex; i <= newChildrenEnd; i++) {
                    // 从 newChildren 中根据开始索引获取每一个 child（c2 = newChildren）
                    var nextChild = normalizeVNode(newChildren[i]);
                    // child 必须存在 key（这也是为什么 v-for 必须要有 key 的原因）
                    if (nextChild.key != null) {
                        // 把 key 和 对应的索引，放到 keyToNewIndexMap 对象中
                        keyToNewIndexMap.set(nextChild.key, i);
                    }
                }
                // 5.2循环oldChildren,并尝试进行 patch（打补丁）或 unmount（删除）旧节点
                // 只查看旧节点的key在新节点中是否有对应，有的话，打补丁，没有的话则删除，移动以及新增在5.3
                var j 
                // 已经修复节点数量
                = void 0;
                // 已经修复节点数量
                var patched = 0;
                // 待修复节点数量
                var toBePatched = newChildrenEnd - newStartIndex + 1;
                // 标记是否需要移动
                var moved = false;
                // 配合 moved 进行使用，它始终保存当前最大的 index 值
                var maxNewIndexSoFar = 0;
                // 创建一个 Array 的对象，用来确定最长递增子序列。它的下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》，元素表示：《对应旧节点的下标（oldIndex），永远 +1》
                // 但是，需要特别注意的是：oldIndex 的值应该永远 +1 （ 因为 0 代表了特殊含义，他表示《新节点没有找到对应的旧节点，此时需要新增新节点》）。即：旧节点下标为 0， 但是记录时会被记录为 1
                var newIndexToOldIndexMap = new Array(toBePatched);
                // 遍历 toBePatched ，为 newIndexToOldIndexMap 进行初始化，初始化时，所有的元素为 0
                for (i = 0; i < toBePatched; i++)
                    newIndexToOldIndexMap[i] = 0;
                // 遍历 oldChildren（s1 = oldChildrenStart; e1 = oldChildrenEnd），获取旧节点，如果当前 已经处理的节点数量 > 待处理的节点数量，那么就证明：《所有的节点都已经更新完成，剩余的旧节点全部删除即可》
                for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
                    var prevChild = oldChildren[i];
                    if (patched >= toBePatched) {
                        // 所有的节点都已经更新完成，剩余的旧节点全部删除即可,不需要再进行遍历
                        unmount(prevChild);
                        continue;
                    }
                    // 新节点需要存在的位置，需要根据旧节点来进行寻找（包含已处理的节点。即：n-c 被认为是 1）
                    var newIndex = void 0;
                    if (prevChild.key != null) {
                        newIndex = keyToNewIndexMap.get(prevChild.key);
                    }
                    else {
                        // 旧节点的 key 不存在（无 key 节点）
                        // 那么我们就遍历所有的新节点，找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》，如果能找到，那么 newIndex = 该新节点索引
                        for (j = newStartIndex; j <= newChildrenEnd; j++) {
                            // 找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》
                            if (newIndexToOldIndexMap[j - newStartIndex] === 0 &&
                                isSameVNodeType(prevChild, newChildren[j])) {
                                // 如果能找到，那么 newIndex = 该新节点索引
                                newIndex = j;
                                break;
                            }
                        }
                    }
                    // 最终没有找到新节点的索引，则证明：当前旧节点没有对应的新节点
                    if (newIndex === undefined) {
                        // 此时，直接删除即可
                        unmount(prevChild);
                    }
                    // 没有进入 if，则表示：当前旧节点找到了对应的新节点，那么接下来就是要判断对于该新节点而言，是要 patch（打补丁）还是 move（移动）
                    else {
                        // 为 newIndexToOldIndexMap 填充值：下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》，元素表示：《对应旧节点的下标（oldIndex），永远 +1》
                        // 因为 newIndex 包含已处理的节点，所以需要减去 s2（s2 = newChildrenStart）表示：不计算已处理的节点
                        newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1;
                        // maxNewIndexSoFar 会存储当前最大的 newIndex，它应该是一个递增的，如果没有递增，则证明有节点需要移动
                        if (newIndex >= maxNewIndexSoFar) {
                            // 持续递增
                            maxNewIndexSoFar = newIndex;
                        }
                        else {
                            // 没有递增，则需要移动，moved = true
                            moved = true;
                        }
                        // 打补丁
                        patch(prevChild, newChildren[newIndex], container, null);
                        // 自增已处理的节点数量
                        patched++;
                    }
                }
                // 5.3 针对移动和挂载的处理 [c d e] 变成 [e d c h]
                // 仅当节点需要移动的时候，我们才需要生成最长递增子序列，否则只需要有一个空数组即可
                // 新节点为下标，对应的旧节点位置
                var increasingNewIndexSequence = moved
                    ? getSequence(newIndexToOldIndexMap)
                    : [];
                j = increasingNewIndexSequence.length - 1; // 最后一个值的下标
                // 倒序循环，以便我们可以使用最后修补的节点作为锚点
                for (i = toBePatched - 1; i >= 0; i--) {
                    // nextIndex（需要更新的新节点下标） = newChildrenStart + i
                    // 换算成实际的下标
                    var nextIndex = newStartIndex + i;
                    // 根据 nextIndex 拿到要处理的 新节点
                    var nextChild = newChildren[nextIndex];
                    // 锚dian
                    var anchor = nextIndex + 1 < newChildrenLength
                        ? newChildren[nextIndex + 1].el
                        : parentAnchor;
                    // 如果 newIndexToOldIndexMap 中保存的 value = 0，则表示：新节点没有用对应的旧节点，此时需要挂载新节点
                    if (newIndexToOldIndexMap[i] === 0) {
                        // 挂载新节点
                        patch(null, nextChild, container, anchor);
                    }
                    // 则移动
                    else if (moved) {
                        // j < 0 表示：不存在 最长递增子序列
                        // i !== increasingNewIndexSequence[j] 表示：当前节点不在最后位置
                        // 那么此时就需要 move （移动）
                        if (j < 0 || i !== increasingNewIndexSequence[j]) {
                            move(nextChild, container, anchor);
                        }
                        else {
                            // j 随着循环递减
                            j--;
                        }
                    }
                }
            }
        };
        /**
         * 移动节点到指定位置
         */
        var move = function (vnode, container, anchor) {
            var el = vnode.el;
            hostInsert(el, container, anchor);
        };
        /**
         * element 的挂载操作
         */
        var mountElement = function (vnode, container, anchor) {
            var type = vnode.type, props = vnode.props, shapeFlag = vnode.shapeFlag;
            // 创建 element
            var el = (vnode.el = hostCreateElement(type));
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 设置 文本子节点
                hostSetElementText(el, vnode.children);
            }
            // 处理 props
            if (props) {
                // 遍历 props 对象
                for (var key in props) {
                    hostPatchProp(el, key, null, props[key]);
                }
            }
            // 插入 el 到指定的位置
            hostInsert(el, container, anchor);
        };
        var processText = function (oldVNode, newVNode, container, anchor) {
            if (anchor === void 0) { anchor = null; }
            if (oldVNode === null) {
                newVNode.el = hostCreateText(newVNode.children);
                hostInsert(newVNode.el, container, anchor);
            }
            else {
                var el = (newVNode.el = oldVNode.el);
                if (newVNode.children !== oldVNode.children) {
                    hostSetText(el, newVNode.children);
                }
            }
        };
        var processComponent = function (oldVNode, newVNode, container, anchor) {
            if (anchor === void 0) { anchor = null; }
            if (oldVNode === null) {
                // keep-alive 暂未实现
                // 挂载
                mountComponent(newVNode, container, anchor);
            }
            else {
                // 更新
                updateComponent(oldVNode, newVNode);
            }
        };
        var updateComponent = function (oldVNode, newVNode) {
            var instance = (oldVNode.component = newVNode.component);
            {
                newVNode.el = oldVNode.el;
                instance.vnode = newVNode;
            }
        };
        var mountComponent = function (initialVNode, container, anchor) {
            // 实例, 定义对象，并赋值，此时并无渲染方法
            var instance = (initialVNode.component =
                createComponentInstance(initialVNode));
            // 标准化组件数据，确保instance里面是有render的
            setupComponent(instance);
            setupRenderEffect(instance, initialVNode, container, anchor);
        };
        var setupRenderEffect = function (instance, initialVNode, container, anchor) {
            var componentUpdateFn = function () {
                if (!instance.isMounted) {
                    // 获取 hook
                    var bm = instance.bm, m = instance.m;
                    if (bm) {
                        bm();
                    }
                    var subTree = (instance.subTree = renderComponentRoot(instance));
                    console.log('subTree', subTree);
                    patch(null, subTree, container, anchor);
                    if (m) {
                        m();
                    }
                    initialVNode.el = subTree.el;
                    instance.isMounted = true;
                }
                else {
                    var next = instance.next, vnode = instance.vnode;
                    if (!next) {
                        next = vnode;
                    }
                    var nextTree = renderComponentRoot(instance);
                    // 保存对应的 subTree，以便进行更新操作
                    var prevTree = instance.subTree;
                    instance.subTree = nextTree;
                    patch(prevTree, nextTree, container, anchor);
                    // 更新 next
                    next.el = nextTree.el;
                }
            };
            var effect = (instance.effect = new ReactiveEffect(componentUpdateFn, function () { return queuePreFlushCb(update); }));
            var update = (instance.update = function () { return effect.run(); });
            update();
        };
        /**
         * Comment 的打补丁操作
         */
        var processCommentNode = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                // 生成节点
                newVNode.el = hostCreateComment(newVNode.children || '');
                // 挂载
                hostInsert(newVNode.el, container, anchor);
            }
            else {
                // 无更新
                newVNode.el = oldVNode.el;
            }
        };
        /**
         * Fragment 的打补丁操作
         */
        var processFragment = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                mountChildren(newVNode.children, container, anchor);
            }
            else {
                patchChildren(oldVNode, newVNode, container, anchor);
            }
        };
        /**
         * 挂载子节点
         */
        var mountChildren = function (children, container, anchor) {
            // 处理 Cannot assign to read only property '0' of string 'xxx'
            if (isString(children)) {
                children = children.split('');
            }
            for (var i = 0; i < children.length; i++) {
                var child = (children[i] = normalizeVNode(children[i]));
                patch(null, child, container, anchor);
            }
        };
        var patch = function (oldVNode, newVNode, container, anchor) {
            if (anchor === void 0) { anchor = null; }
            if (oldVNode === newVNode) {
                return;
            }
            // 判断是否为相同类型的节点
            if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
                unmount(oldVNode);
                oldVNode = null;
            }
            var type = newVNode.type, shapeFlag = newVNode.shapeFlag;
            switch (type) {
                case Text$1:
                    processText(oldVNode, newVNode, container, anchor);
                    break;
                case Comment:
                    processCommentNode(oldVNode, newVNode, container, anchor);
                    break;
                case Fragment:
                    processFragment(oldVNode, newVNode, container, anchor);
                    break;
                default:
                    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                        processElement(oldVNode, newVNode, container, anchor);
                    }
                    else if (shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
                        // 组件
                        processComponent(oldVNode, newVNode, container, anchor);
                    }
            }
        };
        var unmount = function (vnode) {
            hostRemove(vnode.el);
        };
        var render = function (vnode, container) {
            if (vnode === null) {
                // 卸载
                if (container._vnode) {
                    unmount(container._vnode);
                }
            }
            else {
                // 打补丁
                patch(container._vnode || null, vnode, container);
            }
            container._vnode = vnode;
        };
        return {
            render: render
        };
    }
    // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
    // 1.如果后续值比result中的最大值还大，直接push
    // 2.如果比最大值小，则使用二分法进行查询需要替换的目标位置
    // 3.但是这个二分查找可能有问题，比如5，6，1，会被替换成1，6，所以需要一个额外的p来进行回溯哦，也就说进行纠错，变成5，6
    function getSequence(arr) {
        var p = arr.slice();
        var result = [0];
        var i, j, u, v, c;
        var len = arr.length;
        for (i = 0; i < len; i++) {
            var arrI = arr[i];
            if (arrI !== 0) {
                j = result[result.length - 1];
                if (arr[j] < arrI) {
                    p[i] = j;
                    result.push(i);
                    continue;
                }
                u = 0;
                v = result.length - 1;
                while (u < v) {
                    c = (u + v) >> 1;
                    if (arr[result[c]] < arrI) {
                        u = c + 1;
                    }
                    else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1];
                    }
                    result[u] = i;
                }
            }
        }
        u = result.length;
        v = result[u - 1];
        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }
        return result;
    }

    var doc = document;
    var nodeOps = {
        /**
         * 插入指定元素到指定位置
         */
        insert: function (child, parent, anchor) {
            parent.insertBefore(child, anchor || null);
        },
        /**
         * 创建指定 Element
         */
        createElement: function (tag) {
            var el = doc.createElement(tag);
            return el;
        },
        /**
         * 为指定的 element 设置 textContent
         */
        setElementText: function (el, text) {
            el.textContent = text;
        },
        /**
         * 删除指定元素
         */
        remove: function (child) {
            var parent = child.parentNode;
            if (parent) {
                parent.removeChild(child);
            }
        },
        /**
         * 创建 Text 节点
         */
        createText: function (text) { return doc.createTextNode(text); },
        /**
         * 设置 text
         */
        setText: function (node, text) {
            node.nodeValue = text;
        },
        /**
         * 创建 Comment 节点
         */
        createComment: function (text) { return doc.createComment(text); }
    };

    /**
     * 为 class 打补丁
     */
    function patchClass(el, value) {
        if (value == null) {
            el.removeAttribute('class');
        }
        else {
            el.className = value;
        }
    }

    /**
     * 为 style 属性进行打补丁
     */
    function patchStyle(el, prev, next) {
        // 获取 style 对象
        var style = el.style;
        // 判断新的样式是否为纯字符串
        var isCssString = isString(next);
        if (next && !isCssString) {
            // 赋值新样式
            for (var key in next) {
                setStyle(style, key, next[key]);
            }
            // 清理旧样式
            if (prev && !isString(prev)) {
                for (var key in prev) {
                    if (next[key] == null) {
                        setStyle(style, key, '');
                    }
                }
            }
        }
    }
    /**
     * 赋值样式
     */
    function setStyle(style, name, val) {
        style[name] = val;
    }

    /**
     * 通过 DOM Properties 指定属性
     */
    function patchDOMProp(el, key, value) {
        try {
            el[key] = value;
        }
        catch (e) { }
    }

    /**
     * 通过 setAttribute 设置属性
     */
    function patchAttr(el, key, value) {
        if (value == null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, value);
        }
    }

    function patchEvent(el, rawName, prevValue, nextValue) {
        // vei = vue event invokers
        // 缓存事件，防止重复挂载
        var invokers = el._vei || (el._vei = {});
        // 是否存在
        var existingInvoker = invokers[rawName];
        if (nextValue && existingInvoker) {
            existingInvoker.value = nextValue;
        }
        else {
            var name_1 = parseName(rawName);
            if (nextValue) {
                var invoker = (invokers[rawName] = createInvoker(nextValue));
                el.addEventListener(name_1, invoker);
            }
            else {
                // remove
                el.removeEventListener(name_1, existingInvoker);
                // 删除缓存
                invokers[rawName] = undefined;
            }
        }
    }
    /**
     * 直接返回剔除 on，其余转化为小写的事件名即可
     */
    function parseName(name) {
        return name.slice(2).toLowerCase();
    }
    /**
     * 生成 invoker 函数
     */
    function createInvoker(initialValue) {
        var invoker = function (e) {
            invoker.value && invoker.value();
        };
        // value 为真实的事件行为
        invoker.value = initialValue;
        return invoker;
    }

    var patchProp = function (el, key, prevValue, nextValue) {
        if (key === 'class') {
            patchClass(el, nextValue);
        }
        else if (key === 'style') {
            // style
            patchStyle(el, prevValue, nextValue);
        }
        else if (isOn(key)) {
            patchEvent(el, key, prevValue, nextValue);
        }
        else if (shouldSetAsProp(el, key)) {
            patchDOMProp(el, key, nextValue);
        }
        else {
            patchAttr(el, key, nextValue);
        }
    };
    /**
     * 判断指定元素的指定属性是否可以通过 DOM Properties 指定
     */
    function shouldSetAsProp(el, key) {
        // 各种边缘情况处理
        if (key === 'spellcheck' || key === 'draggable' || key === 'translate') {
            return false;
        }
        // #1787, #2840 表单元素的表单属性是只读的，必须设置为属性 attribute
        if (key === 'form') {
            return false;
        }
        // #1526 <input list> 必须设置为属性 attribute
        if (key === 'list' && el.tagName === 'INPUT') {
            return false;
        }
        // #2766 <textarea type> 必须设置为属性 attribute
        if (key === 'type' && el.tagName === 'TEXTAREA') {
            return false;
        }
        return key in el;
    }

    var rendererOptions = extend({ patchProp: patchProp }, nodeOps);
    var renderer;
    function ensureRenderer() {
        return renderer || (renderer = createRenderer(rendererOptions));
    }
    var render = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = ensureRenderer()).render.apply(_a, __spreadArray([], __read(args), false));
    };

    /**
     * 基础的 parse 方法，生成 AST
     * @param content tempalte 模板
     * @returns
     */
    function baseParse(content) {
        // 创建 parser 对象，未解析器的上下文对象
        var context = createParserContext(content);
        var children = parseChildren(context, []);
        return createRoot(children);
    }
    /**
     * 生成 root 节点
     */
    function createRoot(children) {
        return {
            type: 0 /* NodeTypes.ROOT */,
            children: children,
            // loc：位置，这个属性并不影响渲染，但是它必须存在，否则会报错。所以我们给了他一个 {}
            loc: {}
        };
    }
    /**
     * 创建解析器上下文
     */
    function createParserContext(content) {
        // 合成 context 上下文对象
        return {
            source: content
        };
    }
    function parseChildren(context, ancestors) {
        // 存放所有 node节点数据的数组
        var nodes = [];
        /**
         * 循环解析所有 node 节点，可以理解为对 token 的处理。
         * 例如：<div>hello world</div>，此时的处理顺序为：
         * 1. <div
         * 2. >
         * 3. hello world
         * 4. </
         * 5. div>
         */
        while (!isEnd(context, ancestors)) {
            /**
             * 模板源
             */
            var s = context.source;
            // 定义 node 节点
            var node = void 0;
            if (startsWith(s, '{{')) ;
            else if (s[0] === '<') {
                // 以 < 开始，后面跟a-z 表示，这是一个标签的开始
                if (/[a-z]/i.test(s[1])) {
                    // 此时要处理 Element
                    node = parseElement(context, ancestors);
                }
            }
            if (!node) {
                node = parseText(context);
            }
            pushNode(nodes, node);
        }
        return nodes;
    }
    /**
     * 解析 Element 元素。例如：<div>
     */
    function parseElement(context, ancestors) {
        // -- 先处理开始标签 --
        var element = parseTag(context);
        //   //  -- 处理子节点 --
        ancestors.push(element);
        //   // 递归触发 parseChildren
        var children = parseChildren(context, ancestors);
        ancestors.pop();
        //   // 为子节点赋值
        element.children = children;
        //   //  -- 最后处理结束标签 --
        if (startsWithEndTagOpen(context.source, element.tag)) {
            parseTag(context);
        }
        // 整个标签处理完成
        return element;
    }
    /**
     * 解析文本。
     */
    function parseText(context) {
        /**
         * 定义普通文本结束的标记
         * 例如：hello world </div>，那么文本结束的标记就为 <
         * PS：这也意味着如果你渲染了一个 <div> hell<o </div> 的标签，那么你将得到一个错误
         */
        var endTokens = ['<', '{{'];
        // 计算普通文本结束的位置
        var endIndex = context.source.length;
        // 计算精准的 endIndex，计算的逻辑为：从 context.source 中分别获取 '<', '{{' 的下标，取最小值为 endIndex
        for (var i = 0; i < endTokens.length; i++) {
            var index = context.source.indexOf(endTokens[i], 1);
            if (index !== -1 && endIndex > index) {
                endIndex = index;
            }
        }
        // 获取处理的文本内容
        var content = parseTextData(context, endIndex);
        return {
            type: 2 /* NodeTypes.TEXT */,
            content: content
        };
    }
    /**
     * 从指定位置（length）获取给定长度的文本数据。
     */
    function parseTextData(context, length) {
        // 获取指定的文本数据
        var rawText = context.source.slice(0, length);
        // 《继续》对模板进行解析处理
        advanceBy(context, length);
        // 返回获取到的文本
        return rawText;
    }
    /**
     * 解析标签
     */
    function parseTag(context, type) {
        // -- 处理标签开始部分 --
        // 通过正则获取标签名
        var match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
        // 标签名字
        var tag = match[1];
        // 对模板进行解析处理
        advanceBy(context, match[0].length);
        //   // 属性与指令处理
        //   advanceSpaces(context)
        //   let props = parseAttributes(context, type)
        //   // -- 处理标签结束部分 --
        //   // 判断是否为自关闭标签，例如 <img />
        var isSelfClosing = startsWith(context.source, '/>');
        //   // 《继续》对模板进行解析处理，是自动标签则处理两个字符 /> ，不是则处理一个字符 >
        advanceBy(context, isSelfClosing ? 2 : 1);
        //   // 标签类型
        var tagType = 0 /* ElementTypes.ELEMENT */;
        return {
            type: 1 /* NodeTypes.ELEMENT */,
            tag: tag,
            tagType: tagType,
            // 属性与指令
            props: []
        };
    }
    /**
     * 是否以指定文本开头
     */
    function startsWith(source, searchString) {
        return source.startsWith(searchString);
    }
    /**
     * 判断是否为结束节点
     */
    function isEnd(context, ancestors) {
        var s = context.source;
        // 解析是否为结束标签
        if (startsWith(s, '</')) {
            for (var i = ancestors.length - 1; i >= 0; --i) {
                if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                    return true;
                }
            }
        }
        return !s;
    }
    /**
     * 前进一步。多次调用，每次调用都会处理一部分的模板内容
     * 以 <div>hello world</div> 为例
     * 1. <div
     * 2. >
     * 3. hello world
     * 4. </div
     * 5. >
     */
    function advanceBy(context, numberOfCharacters) {
        // template 模板源
        var source = context.source;
        // 去除开始部分的无效数据
        context.source = source.slice(numberOfCharacters);
    }
    /**
     * nodes.push(node)
     */
    function pushNode(nodes, node) {
        nodes.push(node);
    }
    /**
     * 判断当前是否为《标签结束的开始》。比如 </div> 就是 div 标签结束的开始
     * @param source 模板。例如：</div>
     * @param tag 标签。例如：div
     * @returns
     */
    function startsWithEndTagOpen(source, tag) {
        return (startsWith(source, '</') &&
            source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
            /[\t\r\n\f />]/.test(source[2 + tag.length] || '>'));
    }

    function baseCompile(template, options) {
        var ast = baseParse(template.trim());
        return ast;
    }

    function compile(template, options) {
        return baseCompile(template);
    }

    exports.compile = compile;
    exports.computed = computed;
    exports.effect = effect;
    exports.h = h;
    exports.reactive = reactive;
    exports.ref = ref;
    exports.render = render;
    exports.watch = watch;
    exports.watchEffect = watchEffect;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map

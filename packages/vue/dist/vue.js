var Vue = (function (exports) {
    'use strict';

    /**
     * 用于将 {{ Interpolation }} 值转换为显示的字符串。
     * @private
     */
    var toDisplayString = function (val) {
        return String(val);
    };

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
    var isSymbol = function (val) { return typeof val === 'symbol'; };

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
            if (isObject(res)) {
                return reactive(res);
            }
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
    var Text = Symbol('Text');
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
    function createCommentVNode(text) {
        return createVNode(Comment, null, text);
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

    var _a;
    var FRAGMENT = Symbol("Fragment");
    var CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
    var CREATE_VNODE = Symbol('createVNode');
    var TO_DISPLAY_STRING = Symbol('toDisplayString');
    var CREATE_COMMENT = Symbol("createCommentVNode");
    var RENDER_LIST = Symbol("renderList");
    /**
     * const {xxx} = Vue
     * 即：从 Vue 中可以被导出的方法，我们这里统一使用  createVNode
     */
    var helperNameMap = (_a = {},
        _a[FRAGMENT] = "Fragment",
        // 在 renderer 中，通过 export { createVNode as createElementVNode }
        _a[CREATE_ELEMENT_VNODE] = 'createElementVNode',
        _a[CREATE_VNODE] = 'createVNode',
        _a[TO_DISPLAY_STRING] = 'toDisplayString',
        _a[CREATE_COMMENT] = 'createCommentVNode',
        _a[TO_DISPLAY_STRING] = 'toDisplayString',
        _a[RENDER_LIST] = 'renderList',
        _a);

    function isText(node) {
        return node.type === 5 /* NodeTypes.INTERPOLATION */ || node.type === 2 /* NodeTypes.TEXT */;
    }
    /**
     * 返回 vnode 生成函数
     */
    function getVNodeHelper(ssr, isComponent) {
        return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
    }
    /**
     * 是否为 v-slot
     */
    function isVSlot(p) {
        return p.type === 7 /* NodeTypes.DIRECTIVE */ && p.name === 'slot';
    }
    /**
     * 创建对象表达式节点
     */
    function createObjectExpression(properties) {
        return {
            type: 15 /* NodeTypes.JS_OBJECT_EXPRESSION */,
            loc: {},
            properties: properties
        };
    }
    function injectProp(node, prop) {
        var propsWithInjection;
        var props = node.type === 13 /* NodeTypes.VNODE_CALL */ ? node.props : node.arguments[2];
        if (props == null || isString(props)) {
            propsWithInjection = createObjectExpression([prop]);
        }
        if (node.type === 13 /* NodeTypes.VNODE_CALL */) {
            node.props = propsWithInjection;
        }
    }
    /**
     * 返回 vnode 节点
     */
    function getMemoedVNodeCall(node) {
        return node;
    }
    function isTemplateNode(node) {
        return (node.type === 1 /* NodeTypes.ELEMENT */ && node.tagType === 3 /* ElementTypes.TEMPLATE */);
    }

    var aliasHelper = function (s) { return "".concat(helperNameMap[s], ": _").concat(helperNameMap[s]); };
    function createCodegenContext(ast) {
        var context = {
            // render 函数代码字符串
            code: "",
            // 运行时全局的变量名
            runtimeGlobalName: 'Vue',
            // 模板源
            source: ast.loc.source,
            // 缩进级别
            indentLevel: 0,
            // 需要触发的方法，关联 JavaScript AST 中的 helpers
            helper: function (key) {
                return "_".concat(helperNameMap[key]);
            },
            /**
             * 插入代码
             */
            push: function (code) {
                context.code += code;
            },
            /**
             * 新的一行
             */
            newline: function () {
                newline(context.indentLevel);
            },
            /**
             * 控制缩进 + 换行
             */
            indent: function () {
                newline(++context.indentLevel);
            },
            /**
             * 控制缩进 + 换行
             */
            deindent: function () {
                newline(--context.indentLevel);
            }
        };
        function newline(n) {
            context.code += '\n' + "  ".repeat(n);
        }
        return context;
    }
    function generate(ast) {
        console.log('ast', ast);
        // 生成上下文
        var context = createCodegenContext(ast);
        // 获取code拼接方法
        var push = context.push, newline = context.newline, indent = context.indent, deindent = context.deindent;
        //  生成函数的前置代码：const _Vue = Vue
        genFunctionPreamble(context);
        // 创建方法名称
        var functionName = "render";
        // 创建方法参数
        var args = ['_ctx', '_cache'];
        var signature = args.join(', ');
        // 利用方法名称和参数拼接函数声明
        push("function ".concat(functionName, "(").concat(signature, ") {"));
        // 缩进 + 换行
        indent();
        // 主要函数体
        push("with (_ctx) {");
        indent();
        var hasHelpers = ast.helpers.length > 0;
        if (hasHelpers) {
            push("const { ".concat(ast.helpers.map(aliasHelper).join(', '), " } = _Vue"));
            push("\n");
            newline();
        }
        // 最后拼接 return 的值
        newline();
        push("return ");
        if (ast.codegenNode) {
            genNode(ast.codegenNode, context);
        }
        else {
            push("null");
        }
        // with 结尾
        deindent();
        push("}");
        // 收缩缩进 + 换行
        deindent();
        push("}");
        return {
            ast: ast,
            code: context.code
        };
    }
    /**
     * 生成 "const _Vue = Vue\n\nreturn "
     */
    function genFunctionPreamble(context) {
        var push = context.push, newline = context.newline, runtimeGlobalName = context.runtimeGlobalName;
        var VueBinding = runtimeGlobalName;
        push("const _Vue = ".concat(VueBinding, "\n"));
        newline();
        push("return ");
    }
    /**
     * 区分节点进行处理
     */
    function genNode(node, context) {
        if (isSymbol(node)) {
            context.push(context.helper(node));
            return;
        }
        switch (node.type) {
            case 1 /* NodeTypes.ELEMENT */:
            case 9 /* NodeTypes.IF */:
                genNode(node.codegenNode, context);
                break;
            case 11 /* NodeTypes.FOR */:
                genNode(node.codegenNode, context);
                break;
            case 13 /* NodeTypes.VNODE_CALL */:
                genVNodeCall(node, context);
                break;
            case 2 /* NodeTypes.TEXT */:
                genText(node, context);
                break;
            // {{}} 处理
            case 8 /* NodeTypes.COMPOUND_EXPRESSION */:
                genCompoundExpression(node, context);
                break;
            // 表达式处理
            case 5 /* NodeTypes.INTERPOLATION */:
                genInterpolation(node, context);
                break;
            // 复合表达式处理
            case 4 /* NodeTypes.SIMPLE_EXPRESSION */:
                genExpression(node, context);
                break;
            // JS调用表达式的处理
            case 14 /* NodeTypes.JS_CALL_EXPRESSION */:
                genCallExpression(node, context);
                break;
            case 18 /* NodeTypes.JS_FUNCTION_EXPRESSION */:
                genFunctionExpression(node, context);
                break;
            // JS条件表达式的处理
            case 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */:
                genConditionalExpression(node, context);
                break;
        }
    }
    function genConditionalExpression(node, context) {
        var test = node.test, consequent = node.consequent, alternate = node.alternate, needNewline = node.newline;
        var push = context.push, indent = context.indent, deindent = context.deindent, newline = context.newline;
        if (test.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
            // 写入变量
            genExpression(test, context);
        }
        // 换行
        needNewline && indent();
        // 缩进++
        context.indentLevel++;
        // 写入空格
        needNewline || push(" ");
        // 写入 ？
        push("? ");
        // 写入满足条件的处理逻辑
        genNode(consequent, context);
        // 缩进 --
        context.indentLevel--;
        // 换行
        needNewline && newline();
        // 写入空格
        needNewline || push(" ");
        // 写入:
        push(": ");
        // 判断 else 的类型是否也为 JS_CONDITIONAL_EXPRESSION
        var isNested = alternate.type === 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */;
        // 不是则缩进++
        if (!isNested) {
            context.indentLevel++;
        }
        // 写入 else （不满足条件）的处理逻辑
        genNode(alternate, context);
        // 缩进--
        if (!isNested) {
            context.indentLevel--;
        }
        // 控制缩进 + 换行
        needNewline && deindent(true /* without newline */);
    }
    /**
     * JS调用表达式的处理
     */
    function genCallExpression(node, context) {
        var push = context.push, helper = context.helper;
        var callee = isString(node.callee) ? node.callee : helper(node.callee);
        push(callee + "(", node);
        genNodeList(node.arguments, context);
        push(")");
    }
    /**
     * 处理 VNODE_CALL 节点
     */
    function genVNodeCall(node, context) {
        var push = context.push, helper = context.helper;
        var tag = node.tag, props = node.props, children = node.children, patchFlag = node.patchFlag, dynamicProps = node.dynamicProps, isComponent = node.isComponent;
        // 返回 vnode 生成函数
        var callHelper = getVNodeHelper(context.inSSR, isComponent);
        push(helper(callHelper) + "(", node);
        // 获取函数参数
        var args = genNullableArgs([tag, props, children, patchFlag, dynamicProps]);
        // 处理参数的填充
        genNodeList(args, context);
        push(")");
    }
    /**
     * 处理 createXXXVnode 函数参数
     */
    function genNullableArgs(args) {
        var i = args.length;
        while (i--) {
            if (args[i] != null)
                break;
        }
        return args.slice(0, i + 1).map(function (arg) { return arg || "null"; });
    }
    /**
     * 处理参数的填充
     */
    function genNodeList(nodes, context) {
        var push = context.push; context.newline;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            // 字符串直接 push 即可
            if (isString(node)) {
                push(node);
            }
            // 数组需要 push "[" "]"
            else if (isArray(node)) {
                genNodeListAsArray(node, context);
            }
            // 对象需要区分 node 节点类型，递归处理
            else {
                genNode(node, context);
            }
            if (i < nodes.length - 1) {
                push(', ');
            }
        }
    }
    function genNodeListAsArray(nodes, context) {
        context.push("[");
        genNodeList(nodes, context);
        context.push("]");
    }
    /**
     * 处理 TEXT 节点
     */
    function genText(node, context) {
        context.push(JSON.stringify(node.content), node);
    }
    /**
     * 复合表达式处理
     */
    function genCompoundExpression(node, context) {
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (isString(child)) {
                context.push(child);
            }
            else {
                genNode(child, context);
            }
        }
    }
    /**
     * {{}} 处理
     */
    function genInterpolation(node, context) {
        var push = context.push, helper = context.helper;
        push("".concat(helper(TO_DISPLAY_STRING), "("));
        genNode(node.content, context);
        push(")");
    }
    /**
     * 表达式处理
     */
    function genExpression(node, context) {
        var content = node.content, isStatic = node.isStatic;
        context.push(isStatic ? JSON.stringify(content) : content, node);
    }
    function genFunctionExpression(node, context) {
        var push = context.push, indent = context.indent, deindent = context.deindent;
        var params = node.params, returns = node.returns, body = node.body, newline = node.newline; node.isSlot;
        push("(", node);
        if (isArray(params)) {
            genNodeList(params, context);
        }
        else {
            genNode(params, context);
        }
        push(") => ");
        if (newline || body) {
            push("{");
            indent();
        }
        if (returns) {
            if (newline) {
                push("return ");
            }
            genNode(returns, context);
        }
        if (newline || body) {
            deindent();
            push("}");
        }
    }

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
            if (startsWith(s, '{{')) {
                node = parseInterpolation(context);
            }
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
        var element = parseTag(context, 0 /* TagType.Start */);
        //   //  -- 处理子节点 --
        ancestors.push(element);
        //   // 递归触发 parseChildren
        var children = parseChildren(context, ancestors);
        ancestors.pop();
        //   // 为子节点赋值
        element.children = children;
        //   //  -- 最后处理结束标签 --
        if (startsWithEndTagOpen(context.source, element.tag)) {
            parseTag(context, 1 /* TagType.End */);
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
        advanceSpaces(context);
        var props = parseAttributes(context, type);
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
            props: props
        };
    }
    /**
     * 解析属性与指令
     */
    function parseAttributes(context, type) {
        // 解析之后的 props 数组
        var props = [];
        // 属性名数组
        var attributeNames = new Set();
        // 循环解析，直到解析到标签结束（'>' || '/>'）为止
        while (context.source.length > 0 &&
            !startsWith(context.source, '>') &&
            !startsWith(context.source, '/>')) {
            // 具体某一条属性的处理
            var attr = parseAttribute(context, attributeNames);
            // 添加属性
            if (type === 0 /* TagType.Start */) {
                props.push(attr);
            }
            advanceSpaces(context);
        }
        return props;
    }
    /**
     * 处理指定指令，返回指令节点
     */
    function parseAttribute(context, nameSet) {
        // 获取属性名称。例如：v-if
        var match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
        var name = match[0];
        // 添加当前的处理属性
        nameSet.add(name);
        advanceBy(context, name.length);
        // 获取属性值。
        var value = undefined;
        // 解析模板，并拿到对应的属性值节点
        if (/^[\t\r\n\f ]*=/.test(context.source)) {
            advanceSpaces(context);
            advanceBy(context, 1);
            advanceSpaces(context);
            value = parseAttributeValue(context);
        }
        // 针对 v- 的指令处理
        if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
            // 获取指令名称
            var match_1 = /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(name);
            // 指令名。v-if 则获取 if
            var dirName = match_1[1] ||
                (startsWith(name, ':') ? 'bind' : startsWith(name, '@') ? 'on' : 'slot');
            // TODO：指令参数  v-bind:arg
            // let arg: any
            // TODO：指令修饰符  v-on:click.modifiers
            // const modifiers = match[3] ? match[3].slice(1).split('.') : []
            return {
                type: 7 /* NodeTypes.DIRECTIVE */,
                name: dirName,
                exp: value && {
                    type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
                    content: value.content,
                    isStatic: false,
                    loc: value.loc
                },
                arg: undefined,
                modifiers: undefined,
                loc: {}
            };
        }
        return {
            type: 6 /* NodeTypes.ATTRIBUTE */,
            name: name,
            value: value && {
                type: 2 /* NodeTypes.TEXT */,
                content: value.content,
                loc: value.loc
            },
            loc: {}
        };
    }
    /**
     * 获取属性（attr）的 value
     */
    function parseAttributeValue(context) {
        var content = '';
        // 判断是单引号还是双引号
        var quote = context.source[0];
        var isQuoted = quote === "\"" || quote === "'";
        // 引号处理
        if (isQuoted) {
            advanceBy(context, 1);
            // 获取结束的 index
            var endIndex = context.source.indexOf(quote);
            // 获取指令的值。例如：v-if="isShow"，则值为 isShow
            if (endIndex === -1) {
                content = parseTextData(context, context.source.length);
            }
            else {
                content = parseTextData(context, endIndex);
                advanceBy(context, 1);
            }
        }
        return { content: content, isQuoted: isQuoted, loc: {} };
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
     * 解析插值表达式 {{ xxx }}
     */
    function parseInterpolation(context) {
        // open = {{
        // close = }}
        var _a = __read(['{{', '}}'], 2), open = _a[0], close = _a[1];
        advanceBy(context, open.length);
        // 获取插值表达式中间的值
        var closeIndex = context.source.indexOf(close, open.length);
        var preTrimContent = parseTextData(context, closeIndex);
        var content = preTrimContent.trim();
        advanceBy(context, close.length);
        return {
            type: 5 /* NodeTypes.INTERPOLATION */,
            content: {
                type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
                isStatic: false,
                content: content
            }
        };
    }
    /**
     * 前进非固定步数
     */
    function advanceSpaces(context) {
        var match = /^[\t\r\n\f ]+/.exec(context.source);
        if (match) {
            advanceBy(context, match[0].length);
        }
    }
    // "const _Vue = Vue
    // return function render(_ctx, _cache) {
    //   with (_ctx) {
    //     const { renderList: _renderList, Fragment: _Fragment, openBlock: _openBlock, createElementBlock: _createElementBlock, toDisplayString: _toDisplayString, createElementVNode: _createElementVNode } = _Vue
    //     return (_openBlock(), _createElementBlock("div", null, [
    //       _createElementVNode("ul", null, [
    //         (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(list, (item) => {
    //           return (_openBlock(), _createElementBlock("li", { key: item }, _toDisplayString(item), 1 /* TEXT */))
    //         }), 128 /* KEYED_FRAGMENT */))
    //       ])
    //     ]))
    //   }
    // }"

    /**
     * 单个元素的根节点
     */
    function isSingleElementRoot(root, child) {
        var children = root.children;
        return children.length === 1 && child.type === 1 /* NodeTypes.ELEMENT */;
    }

    /**
     *
     * @param root ast
     * @param options
     */
    function transform(root, options) {
        // 1.创建上下文
        var context = createTransformContext(root, options);
        // 按照深度优先依次处理 node 节点转化
        traverseNode(root, context);
        console.log('root', root);
        createRootCodegen(root);
        root.helpers = __spreadArray([], __read(context.helpers.keys()), false);
        root.components = [];
        root.directives = [];
        root.imports = [];
        root.hoists = [];
        root.temps = [];
        root.cached = [];
    }
    // 遍历所有的ast树，从子节点开始，依次执行nodeTransforms中的方法
    function traverseNode(node, context) {
        // 通过上下文记录当前正在处理的 node 节点
        context.currentNode = node;
        // 获取当前所有 node 节点的 transform 方法
        var nodeTransforms = context.nodeTransforms;
        // 存储转化函数的数组
        var exitFns = [];
        for (var i_1 = 0; i_1 < nodeTransforms.length; i_1++) {
            var onExit = nodeTransforms[i_1](node, context);
            if (onExit) {
                // 指令的 transforms 返回为 数组，所以需要解构
                if (isArray(onExit)) {
                    exitFns.push.apply(exitFns, __spreadArray([], __read(onExit), false));
                }
                else {
                    exitFns.push(onExit);
                }
            }
            // 这个函数为啥要放到循环里面？？？？
            if (!context.currentNode) {
                // 节点已删除
                return;
            }
            else {
                // 节点更换
                node = context.currentNode;
            }
        }
        //  转化节点
        switch (node.type) {
            case 10 /* NodeTypes.IF_BRANCH */:
            case 1 /* NodeTypes.ELEMENT */:
            case 11 /* NodeTypes.FOR */:
            case 0 /* NodeTypes.ROOT */:
                traverseChildren(node, context);
                break;
            // 处理插值表达式 {{}}
            case 5 /* NodeTypes.INTERPOLATION */:
                context.helper(TO_DISPLAY_STRING);
                break;
            // v-if 指令处理
            case 9 /* NodeTypes.IF */:
                for (var i_2 = 0; i_2 < node.branches.length; i_2++) {
                    traverseNode(node.branches[i_2], context);
                }
                break;
        }
        // 在退出时执行 transform
        context.currentNode = node;
        var i = exitFns.length;
        while (i--) {
            exitFns[i]();
        }
    }
    /**
     * 循环处理子节点
     */
    function traverseChildren(parent, context) {
        parent.children.forEach(function (node, index) {
            context.parent = parent;
            context.childIndex = index;
            traverseNode(node, context);
        });
    }
    function createTransformContext(root, _a) {
        var _b = _a.nodeTransforms, nodeTransforms = _b === void 0 ? [] : _b;
        var context = {
            nodeTransforms: nodeTransforms,
            root: root,
            helpers: new Map(),
            currentNode: root,
            parent: null,
            childIndex: 0,
            helper: function (name) {
                // 此处的逻辑是？
                // 做静态标记？？？？
                var count = context.helpers.get(name) || 0;
                context.helpers.set(name, count + 1);
                return name;
            },
            replaceNode: function (node) {
                context.parent.children[context.childIndex] = context.currentNode = node;
            }
        };
        return context;
    }
    /**
     * 生成 root 节点下的 codegen
     */
    function createRootCodegen(root) {
        var children = root.children;
        // 仅支持一个根节点的处理
        if (children.length === 1) {
            // 获取单个根节点
            var child = children[0];
            if (isSingleElementRoot(root, child) && child.codegenNode) {
                var codegenNode = child.codegenNode;
                root.codegenNode = codegenNode;
            }
        }
    }
    /**
     * 针对于指令的处理
     * @param name 正则。匹配具体的指令
     * @param fn 指令的具体处理方法，通常为闭包函数
     * @returns 返回一个闭包函数
     */
    function createStructuralDirectiveTransform(name, fn) {
        var matches = isString(name)
            ? function (n) { return n === name; }
            : function (n) { return name.test(n); };
        return function (node, context) {
            if (node.type === 1 /* NodeTypes.ELEMENT */) {
                var props = node.props;
                // 结构的转换与 v-slot 无关
                if (node.tagType === 3 /* ElementTypes.TEMPLATE */ && props.some(isVSlot)) {
                    return;
                }
                // 存储转化函数的数组
                var exitFns = [];
                // 遍历所有的 props
                for (var i = 0; i < props.length; i++) {
                    var prop = props[i];
                    // 仅处理指令，并且该指令要匹配指定的正则
                    if (prop.type === 7 /* NodeTypes.DIRECTIVE */ && matches(prop.name)) {
                        // 删除结构指令以避免无限递归
                        props.splice(i, 1);
                        i--;
                        // fn 会返回具体的指令函数
                        var onExit = fn(node, prop, context);
                        // 存储到数组中
                        if (onExit)
                            exitFns.push(onExit);
                    }
                }
                // 返回包含所有函数的数组
                return exitFns;
            }
        };
    }

    function createVNodeCall(context, tag, props, children) {
        if (context) {
            context.helper(CREATE_ELEMENT_VNODE);
        }
        return {
            type: 13 /* NodeTypes.VNODE_CALL */,
            tag: tag,
            props: props,
            children: children
        };
    }
    /**
     * return hello {{ msg }} 复合表达式
     */
    function createCompoundExpression(children, loc) {
        return {
            type: 8 /* NodeTypes.COMPOUND_EXPRESSION */,
            loc: loc,
            children: children
        };
    }
    /**
     * 创建条件表达式的节点
     */
    function createConditionalExpression(test, consequent, alternate, newline) {
        if (newline === void 0) { newline = true; }
        return {
            type: 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */,
            test: test,
            consequent: consequent,
            alternate: alternate,
            newline: newline,
            loc: {}
        };
    }
    /**
     * 创建调用表达式的节点
     */
    function createCallExpression(callee, args) {
        return {
            type: 14 /* NodeTypes.JS_CALL_EXPRESSION */,
            loc: {},
            callee: callee,
            arguments: args
        };
    }
    /**
     * 创建简单的表达式节点
     */
    function createSimpleExpression(content, isStatic) {
        return {
            type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
            loc: {},
            content: content,
            isStatic: isStatic
        };
    }
    /**
     * 创建对象属性节点
     */
    function createObjectProperty(key, value) {
        return {
            type: 16 /* NodeTypes.JS_PROPERTY */,
            loc: {},
            key: isString(key) ? createSimpleExpression(key, true) : key,
            value: value
        };
    }
    function createFunctionExpression(params, returns, newline, isSlot, loc) {
        if (returns === void 0) { returns = undefined; }
        if (newline === void 0) { newline = false; }
        if (isSlot === void 0) { isSlot = false; }
        if (loc === void 0) { loc = ''; }
        return {
            type: 18 /* NodeTypes.JS_FUNCTION_EXPRESSION */,
            params: params,
            returns: returns,
            newline: newline,
            isSlot: isSlot,
            loc: loc
        };
    }

    var transformElement = function (node, context) {
        return function postTransformElement() {
            node = context.currentNode;
            // 仅处理 ELEMENT 类型
            if (node.type !== 1 /* NodeTypes.ELEMENT */) {
                return;
            }
            var tag = node.tag;
            var vnodeTag = "\"".concat(tag, "\"");
            var vnodeProps = [];
            var vnodeChildren = node.children;
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    };

    var transformText = function (node, context) {
        if (node.type === 0 /* NodeTypes.ROOT */ ||
            node.type === 1 /* NodeTypes.ELEMENT */ ||
            node.type === 11 /* NodeTypes.FOR */ ||
            node.type === 10 /* NodeTypes.IF_BRANCH */) {
            return function () {
                // 获取所有的子节点
                var children = node.children;
                // 当前容器
                var currentContainer;
                // 循环处理所有的子节点
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (isText(child)) {
                        // j = i + 1 表示下一个节点
                        for (var j = i + 1; j < children.length; j++) {
                            var next = children[j];
                            // 当前节点 child 和 下一个节点 next 都是 Text 节点
                            if (isText(next)) {
                                if (!currentContainer) {
                                    // 生成一个复合表达式节点
                                    currentContainer = children[i] = createCompoundExpression([child], child.loc);
                                }
                                // 在 当前节点 child 和 下一个节点 next 中间，插入 "+" 号
                                currentContainer.children.push(" + ", next);
                                // 把下一个删除
                                children.splice(j, 1);
                                j--;
                            }
                            // 当前节点 child 是 Text 节点，下一个节点 next 不是 Text 节点，则把 currentContainer 置空即可
                            else {
                                currentContainer = undefined;
                                break;
                            }
                        }
                    }
                }
            };
        }
    };

    var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    var stripParensRE = /^\(|\)$/g;
    var transformFor = createStructuralDirectiveTransform('for', function (node, dir, context) {
        return processFor(node, dir, context, function (forNode) {
            var renderExp = createCallExpression(context.helper(RENDER_LIST), [
                forNode.source
            ]);
            forNode.codegenNode = createVNodeCall(context, context.helper(FRAGMENT), undefined, renderExp);
            return function () {
                var childBlock = null;
                var children = forNode.children;
                childBlock = children[0].codegenNode;
                childBlock.isBlock = true;
                if (childBlock.isBlock) ;
                renderExp.arguments.push(createFunctionExpression(createForLoopParams(forNode.parseResult), childBlock, true /* force newline */));
            };
        });
    });
    function processFor(node, dir, context, processCodegen) {
        if (dir.name === 'for') {
            var parseResult = parseForExpression(dir.exp);
            var forNode = {
                type: 11 /* NodeTypes.FOR */,
                loc: node.loc,
                source: parseResult === null || parseResult === void 0 ? void 0 : parseResult.source,
                children: isTemplateNode(node) ? node.children : [node],
                parseResult: parseResult
                //   branches: [branch]
            };
            context.replaceNode(forNode);
            // 生成对应的 codegen 属性
            var onExit_1 = processCodegen && processCodegen(forNode);
            return function () {
                onExit_1 && onExit_1();
            };
        }
    }
    function parseForExpression(input, context) {
        var loc = input.loc;
        var exp = input.content;
        var inMatch = exp.match(forAliasRE);
        if (!inMatch)
            return;
        var _a = __read(inMatch, 3), LHS = _a[1], RHS = _a[2];
        var valueContent = LHS.trim().replace(stripParensRE, '').trim();
        LHS.indexOf(valueContent);
        var result = {
            source: createAliasExpression(loc, RHS.trim(), exp.indexOf(RHS, LHS.length)),
            value: undefined,
            key: undefined,
            index: undefined
        };
        result.value = createAliasExpression(loc, valueContent);
        return result;
    }
    function createAliasExpression(range, content, offset) {
        return createSimpleExpression(content, false);
    }
    function createForLoopParams(_a, memoArgs) {
        var value = _a.value, key = _a.key, index = _a.index;
        if (memoArgs === void 0) { memoArgs = []; }
        return createParamsList(__spreadArray([value, key, index], __read(memoArgs), false));
    }
    function createParamsList(args) {
        var i = args.length;
        while (i--) {
            if (args[i])
                break;
        }
        return args
            .slice(0, i + 1)
            .map(function (arg, i) { return arg || createSimpleExpression("_".repeat(i + 1), false); });
    }

    /**
     * transformIf === exitFns。内部保存了所有 v-if、v-else、else-if 的处理函数
     */
    var transformIf = createStructuralDirectiveTransform(/^(if|else|else-if)$/, function (node, dir, context) {
        return processIf(node, dir, context, function (ifNode, branch, isRoot) {
            // TODO: 目前无需处理兄弟节点情况
            var key = 0;
            // 退出回调。当所有子节点都已完成时，完成codegenNode
            return function () {
                if (isRoot) {
                    ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context);
                }
            };
        });
    });
    /**
     * v-if 的转化处理
     */
    function processIf(node, dir, context, processCodegen) {
        // 仅处理 v-if
        if (dir.name === 'if') {
            // 创建 branch 属性
            var branch = createIfBranch(node, dir);
            // 生成 if 指令节点，包含 branches
            var ifNode = {
                type: 9 /* NodeTypes.IF */,
                loc: node.loc,
                branches: [branch]
            };
            // 切换 currentVNode，即：当前处理节点为 ifNode
            context.replaceNode(ifNode);
            // 生成对应的 codegen 属性
            if (processCodegen) {
                return processCodegen(ifNode, branch, true);
            }
        }
    }
    /**
     * 创建 if 指令的 branch 属性节点
     */
    function createIfBranch(node, dir) {
        return {
            type: 10 /* NodeTypes.IF_BRANCH */,
            loc: node.loc,
            condition: dir.exp,
            children: [node]
        };
    }
    /**
     * 生成分支节点的 codegenNode
     */
    function createCodegenNodeForBranch(branch, keyIndex, context) {
        if (branch.condition) {
            return createConditionalExpression(branch.condition, createChildrenCodegenNode(branch, keyIndex), 
            // 以注释的形式展示 v-if.
            createCallExpression(context.helper(CREATE_COMMENT), ['"v-if"', 'true']));
        }
        else {
            return createChildrenCodegenNode(branch, keyIndex);
        }
    }
    /**
     * 创建指定子节点的 codegen 节点
     */
    function createChildrenCodegenNode(branch, keyIndex) {
        var keyProperty = createObjectProperty("key", createSimpleExpression("".concat(keyIndex), false));
        var children = branch.children;
        var firstChild = children[0];
        var ret = firstChild.codegenNode;
        var vnodeCall = getMemoedVNodeCall(ret);
        // 填充 props
        injectProp(vnodeCall, keyProperty);
        return ret;
    }

    function baseCompile(template, options) {
        if (options === void 0) { options = {}; }
        var ast = baseParse(template.trim());
        transform(ast, extend(options, {
            nodeTransforms: [
                transformElement,
                transformText,
                transformIf,
                transformFor
            ]
        }));
        return generate(ast);
    }

    function compile(template, options) {
        return baseCompile(template, options);
    }

    function compileToFunction(template, options) {
        var code = compile(template, options).code;
        console.log('code1', code);
        var render = new Function(code)();
        return render;
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
            // instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
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
        else if (isObject(setupResult)) {
            instance.data = setupResult;
        }
        finishComponentSetup(instance);
    }
    function finishComponentSetup(instance) {
        var Component = instance.type;
        // 存在render, 不需要处理
        // 组件不存在 render 时，才需要重新赋值
        if (!instance.render) {
            // 存在编辑器，并且组件中不包含 render 函数，同时包含 template 模板，则直接使用编辑器进行编辑，得到 render 函数
            if (compileToFunction && !Component.render) {
                if (Component.template) {
                    // 这里就是 runtime 模块和 compile 模块结合点
                    var template = Component.template;
                    Component.render = compileToFunction(template);
                }
            }
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
            var data = dataOptions.call(instance);
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

    /**
     * 创建 app 实例，这是一个闭包函数
     */
    function createAppAPI(render) {
        return function createApp(rootComponent, rootProps) {
            if (rootProps === void 0) { rootProps = null; }
            var app = {
                _component: rootComponent,
                _container: null,
                // 挂载方法
                mount: function (rootContainer) {
                    // 直接通过 createVNode 方法构建 vnode
                    var vnode = createVNode(rootComponent, rootProps);
                    // 通过 render 函数进行挂载
                    render(vnode, rootContainer);
                }
            };
            return app;
        };
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
            else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 设置 Array 子节点
                mountChildren(vnode.children, el, anchor);
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
                case Text:
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
            render: render,
            createApp: createAppAPI(render)
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

    function renderList(source, renderItem) {
        var ret;
        if (isArray(source) || isString(source)) {
            ret = new Array(source.length);
            for (var i = 0, l = source.length; i < l; i++) {
                ret[i] = renderItem(source[i], i);
            }
            return ret;
        }
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
    var createApp = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var app = (_a = ensureRenderer()).createApp.apply(_a, __spreadArray([], __read(args), false));
        // 获取到 mount 挂载方法
        var mount = app.mount;
        // 对该方法进行重构，标准化 container，在重新触发 mount 进行挂载
        app.mount = function (containerOrSelector) {
            var container = normalizeContainer(containerOrSelector);
            if (!container)
                return;
            var component = app._component;
            if (!isFunction(component) && !component.render && !component.template) {
                component.template = "<div>".concat(container.innerHTML, "</div>");
            }
            container.innerHTML = '';
            mount(container);
        };
        return app;
    };
    /**
     * 标准化 container 容器
     */
    function normalizeContainer(container) {
        if (isString(container)) {
            var res = document.querySelector(container);
            return res;
        }
        return container;
    }

    exports.Comment = Comment;
    exports.EMPTY_OBJ = EMPTY_OBJ;
    exports.Fragment = Fragment;
    exports.Text = Text;
    exports.compile = compileToFunction;
    exports.computed = computed;
    exports.createApp = createApp;
    exports.createCommentVNode = createCommentVNode;
    exports.createElementVNode = createVNode;
    exports.createRenderer = createRenderer;
    exports.effect = effect;
    exports.extend = extend;
    exports.h = h;
    exports.hasChanged = hasChanged;
    exports.isArray = isArray;
    exports.isFunction = isFunction;
    exports.isObject = isObject;
    exports.isOn = isOn;
    exports.isString = isString;
    exports.isSymbol = isSymbol;
    exports.reactive = reactive;
    exports.ref = ref;
    exports.render = render;
    exports.renderList = renderList;
    exports.toDisplayString = toDisplayString;
    exports.watch = watch;
    exports.watchEffect = watchEffect;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map

// 用 Symbol 对 Fragment 进行抽离
const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props === null || props === void 0 ? void 0 : props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // 组件 + children object
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string" ? 1 /* ELEMENT */ : 2 /* STATEFUL_COMPONENT */;
}
// 文本节点
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            // 多渲染了一层 div
            // 优化方案：改变虚拟节点 type，在 patch 函数中增添相关分支的逻辑，处理 children 数组（slot）
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasChanged = (oldValue, newValue) => {
    return !Object.is(oldValue, newValue);
};
const isOn = (key) => /^on[A-Z]/.test(key);
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};
const EMPTY_OBJ = {};

// 依赖收集中的事件
let acativeEffect;
// 是否需要收集依赖
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        // 订阅当前事件的订阅器
        // 用 set 存储，同一个属性的订阅器只有一个不会有重复的
        this.deps = [];
        // 是否激活(stop)
        this.acative = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // stop 时 shouldTrack 为 false
        if (!this.acative) {
            // 返回传入函数的返回值
            return this._fn();
        }
        shouldTrack = true;
        acativeEffect = this;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.acative) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.acative = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
let targetMap = new Map();
// 是否收集依赖
function isTrack() {
    // // 避免没有调用 effect 时 acativeEffect 未初始化
    // if (!acativeEffect) return;
    // // 判断是否需要收集依赖，优化 ++ 时再调用一次 getter 的情况
    // if (!shouldTrack) return;
    return shouldTrack && acativeEffect !== undefined;
}
function trackEffect(dep) {
    // 已经在 dep 中
    if (dep.has(acativeEffect))
        return;
    dep.add(acativeEffect);
    acativeEffect.deps.push(dep);
}
function triggerEffect(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
// 依赖收集
function track(target, key) {
    if (!isTrack())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        // 每个属性有唯一的订阅器
        // 订阅器中是订阅的事件
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
}
// 依赖触发
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffect(dep);
}
// 创建响应式事件
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    // 返回一个 runner 函数
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// 抽离
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadOnly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // 没有在代理中对对象进行依赖收集
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} set 失败 因为 target 是 readonly`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(raw, baseHandler) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
    }
    return new Proxy(raw, baseHandler);
}

// 传入单值
// get set
// proxy -> Object
// {} -> value set get
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 原始值用于进行对比
        this._rawValue = value;
        // 若为对象转换为 reactive
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 避免等值修改
        if (hasChanged(this._rawValue, newValue)) {
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerEffect(this.dep);
        }
    }
}
function trackRefValue(ref) {
    // 避免 effect 没有调用 acativeEffect 为 undefined 的容错处理
    if (isTrack()) {
        trackEffect(ref.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // get -> ref 类型直接返回.value
            // 不是 ref 返回本身的值
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // 一般类型修改 .value
            // ref 类型直接替换
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

// 组件自定义事件
function emit(instance, event, ...args) {
    console.log("emit", event);
    // instance.props 中是否有 event 事件回调函数
    const { props } = instance;
    // TPP
    // 具体 -> 通用
    // add -> Add
    // add-foo -> AddFoo
    const handlerName = toHandlerKey(camelize(event));
    const handle = props[handlerName];
    handle && handle(...args);
}

function initProps(instance, rawProps) {
    // 避免为空的情况报错
    instance.props = rawProps || {};
    // attrs
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // if (key === "$el") {
        //   return instance.vnode.el;
        // }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // setup -> options api
        // $data
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    // 数组参数
    // instance.slots = Array.isArray(children) ? children : [children];
    // 对象形式（修改后数据结构）
    for (const key in children) {
        const value = children[key];
        // slots[key] = normalizeSlotValue(value);
        // 对作用域插槽的处理
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
// 插槽内容数组化
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    // console.log("createComponentInstance", parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: (parent === null || parent === void 0 ? void 0 : parent.provides) || {},
        parent,
        subTree: {},
        isMounted: false,
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = component;
    if (setup) {
        // function:render() 函数
        // Object:注入到组件上下文
        // 组件 proprs shallowReadOnly 浅只读
        // 实现 getCurrentInstance，在 setup 执行前进行赋值
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        // setup 执行完毕后清空
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function: render() 函数
    // Object: 注入到组件上下文
    if (typeof setupResult === "object") {
        // 对 ref 进行包裹
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    instance.render = component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
// 好处：便于在调用栈中进行调试
function setCurrentInstance(instance) {
    currentInstance = instance;
}

// 存
function provide(key, value) {
    // 必须在 setup 中使用
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 是否 init,
        if (provides === parentProvides) {
            // 原型的思路解决跨级注入
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
// 取
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    // 取得祖先组件存的 provides
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先 vnode
                // component -> vnode
                // 所有逻辑操作都会基于 vnode 做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRender(options) {
    // 不同平台渲染方式
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // patch
        // 为了方便递归处理
        // 初始化
        patch(null, vnode, container, null, null);
    }
    // n1 -> old
    // n2 -> new
    function patch(n1, n2, container, parentComponent, anchor) {
        // ShapeFlags 描述虚拟节点当前类型
        // vnode -> flag
        // element
        // 去处理组件
        // 判断是不是 element 类型
        // Fragment -> 只渲染 child
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            // 文本节点分支
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                    // STATEFUL_COMPONENT
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor);
    }
    // 挂载组件
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        // 依赖收集，处理更新
        effect(() => {
            // 区分初始化和更新可用于对比虚拟节点
            if (!instance.isMounted) {
                console.log("init");
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode -> path
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // element -> mount
                // vnode 为组件节点时需要加上子树的 el，否则为 null
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                // console.log(subTree);
                // console.log(prevSubTree);
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        });
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // console.log("patchElement");
        // console.log("n1", n1);
        // console.log("n2", n2);
        // 处理更新
        // props
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 下次更新时 n2 没有el
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
        // children
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            // ArrayToText and TextToText
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 1.老的 children 清空
                unmountChildren(n1.children);
                // 2.设置 text
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // new array
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 清空原文本
                hostSetElementText(container, "");
                // c2 仍是虚拟节点需要去 mount
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // arr diff arr
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    // 双端对比 diff 算法
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        // 首
        let i = 0;
        // 尾
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVnodeType(n1, n2)) {
                // 递归调用
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的长  创建
        // 左添加或右添加
        // 不能再尾添加，需要指定锚点 insertBefore
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                // c2[nextPos] 为老节点已挂载 el
                // <为insertBefore
                // >=为尾部添加
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                // 创建逻辑
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            // 创建新的
            // 删除老的
            // 移动
            let s1 = i;
            let s2 = i;
            // 优化点，当新的节点已经全部 patch 则老节点无需继续遍历
            // 需要 patch 总数
            const toBePatched = e2 - s2 + 1;
            // 已经 patch 数量
            let patched = 0;
            const keyToNewIndexMap = new Map();
            // 通过 key 来缩小时间复杂度，减少遍历
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 初始化
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            // 建立新子树映射表
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 遍历老节点
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 新节点已经处理完成老节点仍有未处理
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 无 key 情况，遍历寻找新子树中是否有相同节点
                    for (let j = 0; j <= e2; j++) {
                        if (isSomeVnodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 不存在相同节点情况
                if (newIndex === undefined) {
                    // 移除原节点
                    hostRemove(prevChild.el);
                }
                else {
                    // 优化
                    // 若遍历原先节点 key 在 keyToNewIndexMap 获得的下标索引不为单调递增则移动
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 相同节点比较子节点
                    // i 可能为 0，0被认为是没有建立映射关系，即没有相同节点需要创建
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 返回的是乱序数组中的最长递增子序列在乱序数组中的下标
            const increaseingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increaseingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // 为新节点
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                // 需要移动节点
                if (moved) {
                    // increaseingNewIndexSequence 中为不需要移动的节点，通过减少移动次数来进行优化。
                    if (j < 0 || i !== increaseingNewIndexSequence[j]) {
                        console.log("移动位置" + i);
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    // 判断是否同一节点
    function isSomeVnodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            // 用 EMPTY_OBJ 来避免 {}!=={}
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    // 创建元素(转换 dom 元素)
    // 改写为接口（自定义渲染器）不依赖于具体实现
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        // string array
        const { children, shapeFlag } = vnode;
        // text_children
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
            // array_children
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            // vnode
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            // if (isOn(key)) {
            //   el.addEventListener(key.slice(2).toLowerCase(), val);
            // } else {
            //   el.setAttribute(key, val);
            // }
            hostPatchProp(el, key, null, val);
        }
        // container.append(el);
        hostInsert(el, container, anchor);
    }
    // 抽离内容为 vnode 数组的情况
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            // 初始化
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        // 对插槽中虚拟节点进行处理
        // 避免插槽外多嵌套 div
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    return {
        createApp: createAppApi(render),
    };
}
// 求最长递增子序列(贪心 + 二分)
// 通过一个稳定的最长递增子序列来减少相同节点的移动次数，避免不必要的移动
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
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

// dom 平台渲染方式
function createElement(type) {
    // console.log("createElement----------------------------------------------------------------");
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    // console.log("patchProp----------------------------------------------------------------");
    if (isOn(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, parent, anchor) {
    // console.log("insert----------------------------------------------------------------");
    // parent.append(el);
    // 指定锚点
    parent.insertBefore(el, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const render = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return render.createApp(...args);
}

export { createApp, createRender, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
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

let targetMap = new Map();
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
// 依赖触发
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffect(dep);
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
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
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function: render() 函数
    // Object: 注入到组件上下文
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    instance.render = component.render;
}

// 用 Symbol 对 Fragment 进行抽离
const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
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

function render(vnode, container) {
    // patch
    // 为了方便递归处理
    patch(vnode, container);
}
function patch(vnode, container) {
    // ShapeFlags 描述虚拟节点当前类型
    // vnode -> flag
    // element
    // 去处理组件
    // 判断是不是 element 类型
    // Fragment -> 只渲染 child
    const { type, shapeFlag } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        // 文本节点分支
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ELEMENT */) {
                processElement(vnode, container);
                // STATEFUL_COMPONENT
            }
            else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                processComponent(vnode, container);
            }
            break;
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
// 挂载组件
function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode -> path
    // vnode -> element -> mountElement
    patch(subTree, container);
    // element -> mount
    // vnode 为组件节点时需要加上子树的 el，否则为 null
    initialVnode.el = subTree.el;
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 创建元素(转换 dom 元素)
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    // string array
    const { children, shapeFlag } = vnode;
    // text_children
    if (shapeFlag & 4 /* TEXT_CHILDREN */) {
        el.textContent = children;
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            if (isOn(key)) {
                el.addEventListener(key.slice(2).toLowerCase(), val);
            }
            else {
                el.setAttribute(key, val);
            }
        }
        // array_children
    }
    else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
        // vnode
        mountChildren(vnode, el);
    }
    container.append(el);
}
// 抽离内容为 vnode 数组的情况
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function processFragment(vnode, container) {
    // 对插槽中虚拟节点进行处理
    // 避免插槽外多嵌套 div
    mountChildren(vnode, container);
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先 vnode
            // component -> vnode
            // 所有逻辑操作都会基于 vnode 做处理
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
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

export { createApp, createTextVNode, h, renderSlots };

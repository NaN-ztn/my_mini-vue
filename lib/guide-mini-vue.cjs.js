'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (val) => {
    return val !== null && typeof val === "object";
};

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
    };
    return component;
}
function setupComponent(instance) {
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = component;
    if (setup) {
        // function:render() 函数
        // Object:注入到组件上下文
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function:render() 函数
    // Object:注入到组件上下文
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    instance.render = component.render;
}

function render(vnode, container) {
    // patch
    // 为了方便递归处理
    patch(vnode, container);
}
function patch(vnode, container) {
    // 去处理组件
    // 判断是不是 element 类型
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
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
    const { children } = vnode;
    if (typeof children === "string") {
        el.textContent = children;
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            el.setAttribute(key, val);
        }
    }
    else if (Array.isArray(children)) {
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

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
    };
    return vnode;
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

exports.createApp = createApp;
exports.h = h;

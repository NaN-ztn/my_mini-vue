import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
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

function handleSetupResult(instance, setupResult: any) {
  // function: render() 函数
  // Object: 注入到组件上下文
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const component = instance.type;

  instance.render = component.render;
}

let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

// 好处：便于在调用栈中进行调试
export function setCurrentInstance(instance: any) {
  currentInstance = instance;
}

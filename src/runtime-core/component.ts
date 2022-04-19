import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
  };
  return component;
}
export function setupComponent(instance) {
  // initProps()
  // initSlots()
  setupStatefulComponent(instance);
}
function setupStatefulComponent(instance: any) {
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
function handleSetupResult(instance, setupResult: any) {
  // function:render() 函数
  // Object:注入到组件上下文
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance: any) {
  const component = instance.type;

  instance.render = component.render;
}

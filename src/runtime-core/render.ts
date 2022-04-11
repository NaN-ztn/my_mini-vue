import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // patch
  // 为了方便递归处理
  patch(vnode, container);
}
function patch(vnode, container) {
  // 去处理组件
  // 判断是不是 element 类型
  // 区分 element 类型和 component
  processElement(vnode, container);
  processComponent(vnode, container);
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render();
  // vnode -> path
  // vnode -> element -> mountElement
  patch(subTree, container);
}

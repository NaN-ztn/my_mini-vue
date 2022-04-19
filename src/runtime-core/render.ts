import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // patch
  // 为了方便递归处理
  patch(vnode, container);
}
function patch(vnode, container) {
  // 去处理组件
  // 判断是不是 element 类型
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

// 挂载组件
function mountComponent(initialVnode: any, container) {
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
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

// 创建元素(转换 dom 元素)
function mountElement(vnode: any, container: any) {
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
  } else if (Array.isArray(children)) {
    // vnode
    mountChildren(vnode, el);
  }
  container.append(el);
}
// 抽离内容为 vnode 数组的情况
function mountChildren(vnode: any, container: any) {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}

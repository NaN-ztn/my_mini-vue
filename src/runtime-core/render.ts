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
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

// 创建元素(转换 dom 元素)
function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);
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

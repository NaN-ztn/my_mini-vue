import { isObject, isOn } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
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
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
    // STATEFUL_COMPONENT
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
  const { children, shapeFlag } = vnode;
  // text_children
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
    // props
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      if (isOn(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else {
        el.setAttribute(key, val);
      }
    }
    // array_children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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

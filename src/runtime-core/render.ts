import { isObject, isOn } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
  // patch
  // 为了方便递归处理
  patch(vnode, container, null);
}
function patch(vnode, container, parentComponent) {
  // ShapeFlags 描述虚拟节点当前类型
  // vnode -> flag
  // element
  // 去处理组件
  // 判断是不是 element 类型

  // Fragment -> 只渲染 child
  const { type, shapeFlag } = vnode;
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent);
      break;
    // 文本节点分支
    case Text:
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container, parentComponent);
        // STATEFUL_COMPONENT
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container, parentComponent);
      }
      break;
  }
}

function processComponent(vnode: any, container: any, parentComponent) {
  mountComponent(vnode, container, parentComponent);
}

// 挂载组件
function mountComponent(initialVnode: any, container, parentComponent) {
  const instance = createComponentInstance(initialVnode, parentComponent);
  setupComponent(instance);
  setupRenderEffect(instance, initialVnode, container);
}

function setupRenderEffect(instance, initialVnode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  // vnode -> path
  // vnode -> element -> mountElement
  patch(subTree, container, instance);
  // element -> mount
  // vnode 为组件节点时需要加上子树的 el，否则为 null
  initialVnode.el = subTree.el;
}

function processElement(vnode: any, container: any, parentComponent) {
  mountElement(vnode, container, parentComponent);
}

// 创建元素(转换 dom 元素)
function mountElement(vnode: any, container: any, parentComponent) {
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
    mountChildren(vnode, el, parentComponent);
  }
  container.append(el);
}
// 抽离内容为 vnode 数组的情况
function mountChildren(vnode: any, container: any, parentComponent) {
  vnode.children.forEach((v) => {
    patch(v, container, parentComponent);
  });
}

function processFragment(vnode: any, container: any, parentComponent) {
  // 对插槽中虚拟节点进行处理
  // 避免插槽外多嵌套 div
  mountChildren(vnode, container, parentComponent);
}

function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}

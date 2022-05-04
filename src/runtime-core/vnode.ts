import { ShapeFlags } from "../shared/ShapeFlags";
// 用 Symbol 对 Fragment 进行抽离
export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");
export { createVNode as createElementVnode };

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    component: null,
    next: null,
    key: props?.key,
    shapeFlag: getShapeFlag(type),
    el: null,
  };
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  // 组件 + children object
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}

function getShapeFlag(type) {
  return typeof type === "string" ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}

// 文本节点
export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}

// 标准化 vnode 的格式
// 其目的是为了让 child 支持多种格式
export function normalizeVNode(child) {
  // 暂时只支持处理 child 为 string 和 number 的情况
  if (typeof child === "string" || typeof child === "number") {
    return createVNode(Text, null, String(child));
  } else {
    return child;
  }
}

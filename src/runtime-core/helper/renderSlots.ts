import { createVNode, Fragment } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    if (typeof slot === "function") {
      // 多渲染了一层 div
      // 优化方案：改变虚拟节点 type，在 patch 函数中增添相关分支的逻辑，处理 children 数组（slot）
      return createVNode(Fragment, {}, slot(props));
    }
  }
}

import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  // 数组参数
  // instance.slots = Array.isArray(children) ? children : [children];
  // 对象形式（修改后数据结构）
  for (const key in children) {
    const value = children[key];
    // slots[key] = normalizeSlotValue(value);
    // 对作用域插槽的处理
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}
// 插槽内容数组化
function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}

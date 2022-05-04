export const enum ShapeFlags {
  ELEMENT = 1,
  STATEFUL_COMPONENT = 1 << 1,
  TEXT_CHILDREN = 1 << 2,
  ARRAY_CHILDREN = 1 << 3,
  SLOT_CHILDREN = 1 << 4,
}

// const ShapeFlags = {
//   ELEMENT: 0,
//   STATEFUL_COMPONENT: 0,
//   TEXT_CHILDREN: 0,
//   ARRAY_CHILDREN: 0,
// };

// 程序设计
// vnode -> stateful_component -> 1
// 1. 可以设置修改
// 2. 进行查找

// 用对象不够高效 -> 用位运算进行优化
// 可读性不高(位运算)
// 0000
// 0001 element
// 0010 stateful_component
// 0100 text_children
// 1000 array_children

import { camelize, toHandlerKey } from "../shared/index";

// 组件自定义事件
export function emit(instance, event: string, ...args) {
  console.log("emit", event);
  // instance.props 中是否有 event 事件回调函数
  const { props } = instance;
  // TPP
  // 具体 -> 通用
  // add -> Add
  // add-foo -> AddFoo

  const handlerName = toHandlerKey(camelize(event));

  const handle = props[handlerName];
  handle && handle(...args);
}

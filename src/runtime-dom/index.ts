// dom 平台渲染方式
import { createRender } from "../runtime-core";
import { isOn } from "../shared";

function createElement(type) {
  // console.log("createElement----------------------------------------------------------------");
  return document.createElement(type);
}

function patchProp(el, key, prevVal, nextVal) {
  // console.log("patchProp----------------------------------------------------------------");
  if (isOn(key)) {
    el.addEventListener(key.slice(2).toLowerCase(), nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

function insert(el, parent) {
  // console.log("insert----------------------------------------------------------------");
  parent.append(el);
}

const render: any = createRender({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  return render.createApp(...args);
}

export * from "../runtime-core";

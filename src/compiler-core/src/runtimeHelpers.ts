// 为了去除代码中（helpers）被重复使用的变量名

export const TO_DISPLAY_STRING = Symbol("toDisplayString");
export const CREATE_ELEMENT_VNODE = Symbol("toDisplayString");

export const helperMapName = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_ELEMENT_VNODE]: "createElementVnode",
};

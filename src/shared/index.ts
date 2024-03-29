export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export const hasChanged = (oldValue, newValue) => {
  return !Object.is(oldValue, newValue);
};

export const isOn = (key) => /^on[A-Z]/.test(key);

export const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : "";
  });
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};

export const EMPTY_OBJ = {};

export const isString = (value) => {
  return typeof value === "string";
};

export * from "./toDisplayString";

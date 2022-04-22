export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export const hasChanged = (oldValue, newValue) => {
  return !Object.is(oldValue, newValue);
};

export const isOn = (key) => /^on[A-Z]/.test(key);

export const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

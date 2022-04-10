export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export const hasChanged = (oldValue, newValue) => {
  return !Object.is(oldValue, newValue);
};

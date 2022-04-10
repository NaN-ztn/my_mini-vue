import { hasChanged, isObject } from "../shared";
import { isTrack, track, trackEffect, triggerEffect } from "./effect";
import { reactive } from "./reactive";

// 传入单值
// get set
// proxy -> Object
// {} -> value set get
class RefImpl {
  private _value: any;
  public dep;
  private _rawValue: any;
  public __v_isRef = true;
  constructor(value) {
    // 原始值用于进行对比
    this._rawValue = value;
    // 若为对象转换为 reactive
    this._value = convert(value);
    this.dep = new Set();
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    // 避免等值修改
    if (hasChanged(this._rawValue, newValue)) {
      this._value = convert(newValue);
      this._rawValue = newValue;
      triggerEffect(this.dep);
    }
  }
}

function trackRefValue(ref) {
  // 避免 effect 没有调用 acativeEffect 为 undefined 的容错处理
  if (isTrack()) {
    trackEffect(ref.dep);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

import { extend } from "../shared";

// 依赖收集中的事件
let acativeEffect;
// 是否需要收集依赖
let shouldTrack;

export class ReactiveEffect {
  private _fn: any;
  // 订阅当前事件的订阅器
  // 用 set 存储，同一个属性的订阅器只有一个不会有重复的
  deps = [];
  // 是否激活(stop)
  acative = true;
  onStop?: () => void;
  public scheduler: Function | undefined;
  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // stop 时 shouldTrack 为 false
    if (!this.acative) {
      // 返回传入函数的返回值
      return this._fn();
    }
    shouldTrack = true;
    acativeEffect = this;
    const result = this._fn();
    shouldTrack = false;
    return result;
  }
  stop() {
    if (this.acative) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.acative = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

let targetMap = new Map();

// 是否收集依赖
export function isTrack() {
  // // 避免没有调用 effect 时 acativeEffect 未初始化
  // if (!acativeEffect) return;
  // // 判断是否需要收集依赖，优化 ++ 时再调用一次 getter 的情况
  // if (!shouldTrack) return;
  return shouldTrack && acativeEffect !== undefined;
}

export function trackEffect(dep) {
  // 已经在 dep 中
  if (dep.has(acativeEffect)) return;
  dep.add(acativeEffect);
  acativeEffect.deps.push(dep);
}

export function triggerEffect(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

// 依赖收集
export function track(target, key) {
  if (!isTrack()) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    // 每个属性有唯一的订阅器
    // 订阅器中是订阅的事件
    dep = new Set();
    depsMap.set(key, dep);
  }
  trackEffect(dep);
}

// 依赖触发
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  triggerEffect(dep);
}

// 创建响应式事件
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  extend(_effect, options);
  _effect.run();
  // 返回一个 runner 函数
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

// 停止响应式
export function stop(runner) {
  runner.effect.stop();
}

import { extend } from "../shared";

class ReactiveEffect {
  private _fn: any;
  deps = [];
  acative = true;
  onStop?: () => void;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    acativeEffect = this;
    // 返回传入函数的返回值
    return this._fn();
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
}

// 依赖收集中的事件
let acativeEffect;
let targetMap = new Map();

// 依赖收集
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  if (!acativeEffect) return;
  dep.add(acativeEffect);
  acativeEffect.deps.push(dep);
}

// 依赖触发
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
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

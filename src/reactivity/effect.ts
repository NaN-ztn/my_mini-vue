import { extend } from '../shared/index';

// 依赖收集中的事件
// TODO：effect 嵌套的情况下，使用栈结构获取 activeEffect(完成)
// TODO：run方法执行前，需清空当前事件依赖集合中当前的事件，从而实现分支切换，对响应式的优化，这样会有新的问题：Set 数据结构在 for 循环下无限循环，可拷贝一份副本用于解决无限循环的问题
let activeEffect;
// effect 嵌套栈
let effectStack: ReactiveEffect[] = [];

export class ReactiveEffect {
  private _fn: any;
  // 订阅当前事件的订阅器
  // 用 set 存储，同一个属性的订阅器只有一个不会有重复的
  deps = [];
  // 是否激活(stop)
  active = true;
  onStop?: () => void;
  public scheduler: Function | undefined;
  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // stop 时 shouldTrack 为 false
    if (!this.active) {
      // 返回传入函数的返回值
      return this._fn();
    }
    activeEffect = this;
    effectStack.push(this);
    const result = this._fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return result;
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
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
  // v2: 用 activeEffect 变化来实现 ++ 时调用 getter 的情况
  return activeEffect !== undefined;
}

export function trackEffect(dep) {
  // 已经在 dep 中
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

export function triggerEffect(dep) {
  for (const effect of dep) {
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
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
  if (!depsMap) {
    return;
  }
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

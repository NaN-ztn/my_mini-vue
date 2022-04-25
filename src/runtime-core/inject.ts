import { getCurrentInstance } from "./component";

// 存
export function provide(key, value) {
  // 必须在 setup 中使用
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProvides = currentInstance.parent.provides;
    // 是否 init,
    if (provides === parentProvides) {
      // 原型的思路解决跨级注入
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}

// 取
export function inject(key, defaultValue) {
  const currentInstance: any = getCurrentInstance();
  // 取得祖先组件存的 provides
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}

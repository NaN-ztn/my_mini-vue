// 组件 provide 和 inject 功能
import {
  h,
  provide,
  inject,
} from "../../lib/guide-mini-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)])
  }
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo", "fooTwo");
    const foo = inject("foo");
    return {
      foo
    }
  },
  render() {
    // 问题：此处组件 provides 引用父组件的 provides 用 provide 函数会直接修改父组件中的值导致错误
    // 优化：原型链的思路来实现祖孙之间的注入（向上查找）
    return h("div", {}, [h("p", {}, `ProviderTwo foo:${this.foo}`), h(Consumer)])
  }
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    // 传入默认值
    // const baz = inject("baz", "bazDefault");
    // 默认值为函数情况
    const baz = inject("baz", () => "bazDefault");
    return {
      foo,
      bar,
      baz
    }
  },
  render() {
    return h("div", {}, `Consumer: - ${this.foo} - ${this.bar} - ${this.baz}`)
  }
};

export default {
  name: "App",
  setup() {
  },
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)])
  }
};

/* 
// 组件 provide 和 inject 功能
import {
  h,
  provide,
  inject,
} from "../../lib/guide-mini-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)])
  }
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    // provide("foo", "fooTwo");
    // const foo = inject("foo");
    return {
      foo: 1
    }
  },
  render() {
    // 问题：此处组件 provides 引用父组件的 provides 用 provide 函数会直接修改父组件中的值导致错误
    // 优化：原型链的思路来实现祖孙之间的注入（向上查找）
    return h("div", {}, [h("p", {}, `ProviderTwo foo:${this.foo}`), h(ProviderThree)])
  }
};

const ProviderThree = {
  name: "ProviderThree",
  setup() {
    // provide("foo", "fooTwo");
    // const foo = inject("foo");
    return {
      foo: 2
    }
  },
  render() {
    // 问题：此处组件 provides 引用父组件的 provides 用 provide 函数会直接修改父组件中的值导致错误
    // 优化：原型链的思路来实现祖孙之间的注入（向上查找）
    return h("div", {}, [h("p", {}, `ProviderThree foo:${this.foo}`), h(Consumer)])
  }
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    // 传入默认值
    // const baz = inject("baz", "bazDefault");
    // 默认值为函数情况
    const baz = inject("baz", () => "bazDefault");
    return {
      foo,
      bar,
      baz
    }
  },
  render() {
    return h("div", {}, `Consumer: - ${this.foo} - ${this.bar} - ${this.baz}`)
  }
};

export default {
  name: "App",
  setup() {
  },
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)])
  }
};
*/
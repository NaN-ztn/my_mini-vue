import { h, createTextVNode } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App")
    // 实现：p标签在 foo 组件中实现（插槽）
    // const foo = h(Foo, {}, h("p", {}, "123"))
    // 传入数组
    const foo = h(Foo, {}, {
      // text 节点
      header: ({ age }) => [h("p", {}, "header" + age), createTextVNode("你好")],
      footer: () => h("p", {}, "footer")
    })
    return h(
      "div",
      {},
      [app, foo]
    )
  },
  setup() {
    return {
      msg: "my-mini-vue!!"
    }
  }
}
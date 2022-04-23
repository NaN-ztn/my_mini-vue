import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js"
export const Foo = {
  setup() {
    return {

    }
  },
  render() {
    const foo = h("p", {}, "foo")
    console.log(this.$slots)
    // Foo.vnode.children
    // 插槽中有多个虚拟子节点
    // 数组转换成虚拟节点（多嵌套了 div，破坏原有结构）

    // renderSlots
    // 类似具名插槽
    // 1.获取要渲染的元素
    // 2.获取到渲染的位置
    // 作用域插槽
    const age = 18
    return h("div",
      {},
      [renderSlots(this.$slots, "header", { age }),
        foo,
      renderSlots(this.$slots, "footer")])
  }
}
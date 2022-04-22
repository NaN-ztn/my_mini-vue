import { h } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"
window.self = null;
export const App = {
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
        onClick() {
          console.log("click")
        },
        onMouseDown() {
          console.log("mousedown")
        }
      },
      // setupState
      // this.$el -> 返回组件根节点
      // string
      // "hi," + this.msg
      // array
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue")]
      [h("p", { class: "red" }, "hi"), h(Foo, { cnt: 1  })]
    )
  },
  setup() {
    return {
      msg: "my-mini-vue!!"
    }
  }
}
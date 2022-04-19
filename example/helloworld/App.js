import { h } from "../../lib/guide-mini-vue.esm.js"
window.self = null;
export const App = {
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"]
      },
      // setupState
      // this.$el -> 返回组件根节点
      // string
      "hi," + this.msg
      // array
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue")]
    )
  },
  setup() {
    return {
      msg: "my-mini-vue!!"
    }
  }
}
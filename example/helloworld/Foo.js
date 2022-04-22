import { h } from "../../lib/guide-mini-vue.esm.js"
export const Foo = {
  setup(props, { emit }) {
    console.log(props)
    console.log(props.cnt++)
    const emitAdd = () => {
      // console.log("emitAdd")
      emit("add", 1, 2)
      // 烤肉串式
      emit("add-foo", 1, 2)
    }
    return {
      emitAdd
    }
  },
  render() {
    const btn = h('button', { onClick: this.emitAdd }, "emitAdd")
    // return h("div", {}, "foo:" + this.cnt)
    const foo = h("div", {}, "foo:" + this.cnt)
    return h("div", {}, [foo, btn])
  }
}
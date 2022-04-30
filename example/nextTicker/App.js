import { h, ref, getCurrentInstance, nextTick } from "../../lib/guide-mini-vue.esm.js";
// import NextTicker from "./NextTicker.js";

export default {
  name: "App",
  setup() {
    const count = ref(1)
    const instance = getCurrentInstance()
    function onClick() {
      for (let i = 0; i < 100; i++) {
        // 每次都调用，真正只需要渲染一次
        // 使用微任务进行异步更新
        // vue3 视图更新为异步
        console.log("update")
        count.value = i
        // 变为异步后，视图仍未更新（instance 中仍为原值，nextTick 可获取最新数据）
      }
      console.log(instance)
      nextTick(() => {
        console.log(instance)
      })
    }
    return {
      onClick,
      count
    }
  },

  render() {
    const button = h("button", { onClick: this.onClick }, "update")
    const p = h("p", {}, "count:" + this.count)
    return h("div", {}, [button, p]);
  },
};

import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe("transform", () => {
  it("happy path", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");
    // 插件体系
    // 将变动点和稳定点分离开
    // 变化部分
    // 前端工具，插件扩展逻辑
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content += "mini-vue";
      }
    };
    // 程序的可测试性
    // 高内聚低耦合
    // 通过插件来实现一个外部的扩展，增强程序的可扩展性
    transform(ast, {
      nodeTransforms: [plugin],
    });
    const nodeText = ast.children[0].children[0];
    expect(nodeText.content).toBe("hi,mini-vue");
  });
});

import { generate } from "../src/generate";
import { baseParse } from "../src/parse";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");
    const { code } = generate(ast);
    // 快照
    // 1.抓 bug
    // 2.有意的(主动更新)
    expect(code).toMatchSnapshot();
  });
});

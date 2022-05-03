import { generate } from "../src/generate";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");
    transform(ast);
    const { code } = generate(ast);
    // 快照
    // 1.抓 bug
    // 2.有意的(主动更新)
    expect(code).toMatchSnapshot();
  });
});

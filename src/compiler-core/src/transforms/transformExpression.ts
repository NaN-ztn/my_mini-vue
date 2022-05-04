import { NodeTypes } from "../ast";

export function transformExpression(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);

    // 两点存在坏味道
    // const rawContent = node.content.content;
    // node.content.content = "_ctx." + rawContent;
  }
}
function processExpression(node: any) {
  node.content = `_ctx.${node.content}`;
  return node;
}

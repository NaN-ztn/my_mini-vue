import { NodeTypes } from "./ast";

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  // 1.遍历 - 深度优先搜索
  traverseNode(root, context);
  // 2.修改 text content
  createRootCodeGen(root);
}
function traverseNode(node: any, context) {
  console.log(node);

  // if (node.type === NodeTypes.TEXT) {
  //   node.content += "mini-vue";
  // }
  // 可变化流程
  const nodeTransforms = context.nodeTransforms;
  for (const transform of nodeTransforms) {
    transform(node);
  }

  // 稳定流程
  tranverseChildren(node, context);
}
function tranverseChildren(node: any, context: any) {
  const children = node.children;
  if (children) {
    for (const child of children) {
      traverseNode(child, context);
    }
  }
}

function createTransformContext(root: any, options: any) {
  const context = { root, nodeTransforms: options.nodeTransforms || [] };
  return context;
}
function createRootCodeGen(root: any) {
  root.codegenNode = root.children[0];
}

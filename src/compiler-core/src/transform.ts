import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  // 1.遍历 - 深度优先搜索
  traverseNode(root, context);
  // 2.修改 text content
  createRootCodeGen(root);

  root.helpers = [...context.helpers.keys()];
}
function traverseNode(node: any, context) {
  // 先只执行第一个插件，其余将作为方法存放在一个数组中，
  // 在递归回程进行调用，这样就能实现先对所有节点执行插件一，
  // 而后在对每个节点执行对应插件
  // console.log(node);
  // if (node.type === NodeTypes.TEXT) {
  //   node.content += "mini-vue";
  // }
  // 可变化流程
  // 插件体系
  const exitFns: any = [];
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];

    const onExit = transform(node, context);
    if (onExit) {
      exitFns.push(onExit);
    }
  }

  // 稳定流程
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      tranverseChildren(node, context);
      break;
    default:
      break;
  }
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}
function tranverseChildren(node: any, context: any) {
  // 只针对 root 和 element
  const children = node.children;
  if (children) {
    for (const child of children) {
      traverseNode(child, context);
    }
  }
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}
function createRootCodeGen(root: any) {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = root.children[0];
  }
}

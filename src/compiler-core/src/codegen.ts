import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";

export function generate(ast) {
  // 只负责生成代码
  const context = createCodegenContext();
  const { push } = context;
  genFunctionPreamble(ast, context);

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(",");

  push(`function ${functionName}(${signature}){`);
  push(`return `);
  // code += `function ${functionName}(${signature}){`;
  // code += "return";
  genNode(ast.codegenNode, context);
  // code += "}";
  push("}");

  return {
    code: context.code,
  };
}
function genFunctionPreamble(ast: any, context) {
  const { push } = context;
  const VueBinging = "Vue";
  // const helpers = ["toDisplayString"];
  // helper 写死了，期望在 ast.helpers 上取到
  // 在 transform 中生成 helpers 数组
  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`);
  }
  push("\n");
  push("return ");
}

function genNode(node: any, context) {
  switch (node.type) {
    // text 类型
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    default:
      break;
  }
}
function genText(node: any, context: any) {
  const { push } = context;
  push(`'${node.content}'`);
}

function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };
  return context;
}
function genInterpolation(node: any, context: any) {
  const { helper, push } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}
function genExpression(node: any, context: any) {
  const { push } = context;
  push(node.content);
}

function genElement(node: any, context) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  // genNode(children, context);
  // console.log(children);

  genNodeList(genNullable([tag, props, children]), context);
  push(")");
}
function genCompoundExpression(node: any, context: any) {
  const { push, helper } = context;
  const { children } = node;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}
function genNullable(args: any) {
  return args.map((arg) => arg || "null");
}
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }
    if (i < node.length - 1) {
      push(", ");
    }
  }
}

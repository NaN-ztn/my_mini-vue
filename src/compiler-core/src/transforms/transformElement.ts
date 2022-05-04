import { createVNodeCall, NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // 中间处理层
      // tag
      const vnodeTag = `'${node.tag}'`;
      // props
      let vnodeProps;
      // children
      const children = node.children;
      console.log(children);

      let vnodeChildren = children[0];
      node.codegenNode = createVNodeCall(vnodeTag, vnodeProps, vnodeChildren, context);
    };
  }
}

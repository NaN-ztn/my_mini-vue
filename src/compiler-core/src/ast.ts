import { CREATE_ELEMENT_VNODE } from "./runtimeHelpers";

export const enum NodeTypes {
  TEXT,
  ROOT,
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  COMPOUND_EXPRESSION,
}

export function createVNodeCall(tag, props, children, context) {
  context.helper(CREATE_ELEMENT_VNODE);

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  };
}

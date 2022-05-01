// 抽象语法树

import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any = [];
  let node;
  const s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    // element 判断准则首位为 '<' 第二位为字母（忽略大小写）
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }
  nodes.push(node);
  return nodes;
}

function parseInterpolation(context) {
  // {{message}}
  // 边界
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);

  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;

  const rawContent = context.source.slice(0, rawContentLength);
  const content = rawContent.trim();

  console.log("content", content);

  // context.source = context.source.slice(rawContentLength + closeDelimiter.length);
  advanceBy(context, rawContentLength + closeDelimiter.length);
  console.log("context.source: " + context.source);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createParseContext(content: string) {
  return {
    source: content,
  };
}

function createRoot(children) {
  return {
    children,
  };
}
function parseElement(context: any) {
  // 1.解析 tag
  const element = parseTag(context, TagType.Start);
  parseTag(context, TagType.End);
  return element;
}

function parseTag(context: any, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  // 2.删除处理完成代码
  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  // 结束标签直接返回
  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    content: {
      type: NodeTypes.ELEMENT,
      tag,
    },
  };
}

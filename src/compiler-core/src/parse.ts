// 抽象语法树

import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context, []));
}

function parseChildren(context, ancestors) {
  const nodes: any = [];
  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      // element 判断准则首位为 '<' 第二位为字母（忽略大小写）
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }

    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

function isEnd(context: any, ancestors) {
  const s = context.source;
  // 2.当遇到结束标签时
  if (s.startsWith(`</`)) {
    // 栈的数据结构，从后往前遍历性能更好
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }
  // 1.source 有值
  return !s;
}

function parseInterpolation(context) {
  // {{message}}
  // 边界
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);

  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;

  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();

  // context.source = context.source.slice(rawContentLength + closeDelimiter.length);
  advanceBy(context, rawContentLength + closeDelimiter.length);

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
function parseElement(context: any, ancestors) {
  // 1.解析 tag
  const element: any = parseTag(context, TagType.Start);
  // 收集标签
  ancestors.push(element);
  // element 子数组
  element.children = parseChildren(context, ancestors);

  if (startWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw new Error(`缺少结束标签${element.tag}`);
  }
  ancestors.pop();
  return element;
}

function startWithEndTagOpen(source, tag) {
  return source.startsWith("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag;
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
    tag,
  };
}
function parseText(context: any): any {
  // 1.获取content

  let endTokens = ["<", "{{"];
  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  // 2.推进
  advanceBy(context, content.length);
  console.log(context.source);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}
function parseTextData(context: any, length) {
  return context.source.slice(0, length);
}

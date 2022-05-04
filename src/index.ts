export * from "./runtime-dom";
export * from "./reactivity";

import { baseCompile } from "./compiler-core/src";
import * as runtimeDom from "./runtime-dom";
import { registerRuntimeCompiler } from "./runtime-dom";

function compileToFunction(template) {
  const { code } = baseCompile(template);

  const render = new Function("Vue", code)(runtimeDom);
  return render;

  // function renderFunction(Vue) {
  //   // Vue 实际上就是所有 runtime-dom 中的属性
  // }
}

registerRuntimeCompiler(compileToFunction);

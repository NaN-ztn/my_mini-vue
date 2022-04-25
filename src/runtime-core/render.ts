import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRender(options) {
  const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options;

  function render(vnode, container) {
    // patch
    // 为了方便递归处理
    // 初始化
    patch(null, vnode, container, null);
  }

  // n1 -> old
  // n2 -> new
  function patch(n1, n2, container, parentComponent) {
    // ShapeFlags 描述虚拟节点当前类型
    // vnode -> flag
    // element
    // 去处理组件
    // 判断是不是 element 类型

    // Fragment -> 只渲染 child
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      // 文本节点分支
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
          // STATEFUL_COMPONENT
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  // 挂载组件
  function mountComponent(initialVnode: any, container, parentComponent) {
    const instance = createComponentInstance(initialVnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
  }

  function setupRenderEffect(instance, initialVnode, container) {
    // 依赖收集，处理更新
    effect(() => {
      // 区分初始化和更新可用于对比虚拟节点
      if (!instance.isMounted) {
        console.log("init");
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));
        // vnode -> path
        // vnode -> element -> mountElement
        patch(null, subTree, container, instance);
        // element -> mount
        // vnode 为组件节点时需要加上子树的 el，否则为 null
        initialVnode.el = subTree.el;
        instance.isMounted = true;
      } else {
        console.log("update");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = subTree;
        console.log(subTree);
        console.log(prevSubTree);
        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function patchElement(n1, n2, container) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n1", n2);
    // 处理更新
    // props
    // children
  }

  // 创建元素(转换 dom 元素)
  // 改写为接口（自定义渲染器）不依赖于具体实现
  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    // string array
    const { children, shapeFlag } = vnode;
    // text_children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
      // array_children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // vnode
      mountChildren(vnode, el, parentComponent);
    }
    // props
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      // if (isOn(key)) {
      //   el.addEventListener(key.slice(2).toLowerCase(), val);
      // } else {
      //   el.setAttribute(key, val);
      // }
      hostPatchProp(el, key, val);
    }
    // container.append(el);
    hostInsert(el, container);
  }

  // 抽离内容为 vnode 数组的情况
  function mountChildren(vnode: any, container: any, parentComponent) {
    vnode.children.forEach((v) => {
      // 初始化
      patch(null, v, container, parentComponent);
    });
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    // 对插槽中虚拟节点进行处理
    // 避免插槽外多嵌套 div
    mountChildren(n2, container, parentComponent);
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  return {
    createApp: createAppApi(render),
  };
}

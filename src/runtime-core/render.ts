import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRender(options) {
  // 不同平台渲染方式
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

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
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(n1, n2, container, parentComponent) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);
    // 处理更新
    // props
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    // 下次更新时 n2 没有el
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent);
    patchProps(el, oldProps, newProps);
    // children
  }

  function patchChildren(n1: any, n2: any, container, parentComponent) {
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // ArrayToText and TextToText
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1.老的 children 清空
        unmountChildren(n1.children);
        // 2.设置 text
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      // new array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 清空原文本
        hostSetElementText(container, "");
        // c2 仍是虚拟节点需要去 mount
        mountChildren(c2, container, parentComponent);
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      // remove
      hostRemove(el);
    }
  }

  function patchProps(el, oldProps: any, newProps: any) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }
      // 用 EMPTY_OBJ 来避免 {}!=={}
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
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
      mountChildren(vnode.children, el, parentComponent);
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
      hostPatchProp(el, key, null, val);
    }
    // container.append(el);
    hostInsert(el, container);
  }

  // 抽离内容为 vnode 数组的情况
  function mountChildren(children: any, container: any, parentComponent) {
    children.forEach((v) => {
      // 初始化
      patch(null, v, container, parentComponent);
    });
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    // 对插槽中虚拟节点进行处理
    // 避免插槽外多嵌套 div
    mountChildren(n2.children, container, parentComponent);
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

import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdate";
import { createAppApi } from "./createApp";
import { queueJobs } from "./scheduler";
import { Fragment, normalizeVNode, Text } from "./vnode";

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
    patch(null, vnode, container, null, null);
  }

  // n1 -> old
  // n2 -> new
  function patch(n1, n2, container, parentComponent, anchor) {
    // ShapeFlags 描述虚拟节点当前类型
    // vnode -> flag
    // element
    // 去处理组件
    // 判断是不是 element 类型

    // Fragment -> 只渲染 child
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      // 文本节点分支
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
          // STATEFUL_COMPONENT
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  // 更新组件
  function updateComponent(n1, n2) {
    // 原先 subtree 和更新后的 subtree 会递归进行比对，因此不管是否做与该组件相关的更新都会执行此逻辑
    // 检测组件 props，避免不必要更新
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  // 挂载组件
  function mountComponent(initialVnode: any, container, parentComponent, anchor) {
    const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent));
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container, anchor);
  }

  function setupRenderEffect(instance, initialVnode, container, anchor) {
    // 依赖收集，处理更新
    instance.update = effect(
      () => {
        // 区分初始化和更新可用于对比虚拟节点
        if (!instance.isMounted) {
          console.log("init");
          const { proxy } = instance;
          const subTree = (instance.subTree = normalizeVNode(instance.render.call(proxy, proxy)));
          // vnode -> path
          // vnode -> element -> mountElement
          patch(null, subTree, container, instance, anchor);
          // element -> mount
          // vnode 为组件节点时需要加上子树的 el，否则为 null
          initialVnode.el = subTree.el;
          instance.isMounted = true;
        } else {
          console.log("update");
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }
          const { proxy } = instance;
          const subTree = normalizeVNode(instance.render.call(proxy, proxy));
          const prevSubTree = instance.subTree;
          instance.subTree = subTree;
          // console.log(subTree);
          // console.log(prevSubTree);
          patch(prevSubTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          // console.log("update - scheduler");
          queueJobs(instance.update);
        },
      }
    );
  }

  function updateComponentPreRender(instance, nextVnode) {
    instance.vnode = nextVnode;
    instance.next = null;
    instance.props = nextVnode.props;
  }

  function processElement(n1, n2: any, container: any, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    // console.log("patchElement");
    // console.log("n1", n1);
    // console.log("n2", n2);
    // 处理更新
    // props
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    // 下次更新时 n2 没有el
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
    // children
  }

  function patchChildren(n1: any, n2: any, container, parentComponent, anchor) {
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
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // arr diff arr
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  // 双端对比 diff 算法
  function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
    const l2 = c2.length;
    // 首
    let i = 0;
    // 尾
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    // 左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSomeVnodeType(n1, n2)) {
        // 递归调用
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }

    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSomeVnodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 新的比老的长  创建
    // 左添加或右添加
    // 不能再尾添加，需要指定锚点 insertBefore
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        // c2[nextPos] 为老节点已挂载 el
        // <为insertBefore
        // >=为尾部添加
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        // 创建逻辑
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      // 创建新的
      // 删除老的
      // 移动
      let s1 = i;
      let s2 = i;
      // 优化点，当新的节点已经全部 patch 则老节点无需继续遍历
      // 需要 patch 总数
      const toBePatched = e2 - s2 + 1;
      // 已经 patch 数量
      let patched = 0;
      const keyToNewIndexMap = new Map();
      // 通过 key 来缩小时间复杂度，减少遍历
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      let maxNewIndexSoFar = 0;

      // 初始化
      for (let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0;
      }

      // 建立新子树映射表
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      // 遍历老节点
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        // 新节点已经处理完成老节点仍有未处理
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        let newIndex;

        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 无 key 情况，遍历寻找新子树中是否有相同节点
          for (let j = s2; j <= e2; j++) {
            if (isSomeVnodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        // 不存在相同节点情况
        if (newIndex === undefined) {
          // 移除原节点
          hostRemove(prevChild.el);
        } else {
          // 优化
          // 若遍历原先节点 key 在 keyToNewIndexMap 获得的下标索引不为单调递增则移动
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          // 相同节点比较子节点
          // i 可能为 0，0被认为是没有建立映射关系，即没有相同节点需要创建
          newIndexToOldIndexMap[newIndex - s2] = i + 1;

          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      // 返回的是乱序数组中的最长递增子序列在乱序数组中的下标
      const increaseingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];

      let j = increaseingNewIndexSequence.length - 1;

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        // 为新节点
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        }
        // 需要移动节点
        if (moved) {
          // increaseingNewIndexSequence 中为不需要移动的节点，通过减少移动次数来进行优化。
          if (j < 0 || i !== increaseingNewIndexSequence[j]) {
            console.log("移动位置" + i);
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  // 判断是否同一节点
  function isSomeVnodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
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
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    // string array
    const { children, shapeFlag } = vnode;
    // text_children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
      // array_children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // vnode
      mountChildren(vnode.children, el, parentComponent, anchor);
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
    hostInsert(el, container, anchor);
  }

  // 抽离内容为 vnode 数组的情况
  function mountChildren(children: any, container: any, parentComponent, anchor) {
    children.forEach((v) => {
      // 初始化
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
    // 对插槽中虚拟节点进行处理
    // 避免插槽外多嵌套 div
    mountChildren(n2.children, container, parentComponent, anchor);
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

// 求最长递增子序列(贪心 + 二分)
// 通过一个稳定的最长递增子序列来减少相同节点的移动次数，避免不必要的移动
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}

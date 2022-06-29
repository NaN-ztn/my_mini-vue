import { computed } from '../computed';
import { effect } from '../effect';
import { reactive } from '../reactive';

describe('computed', () => {
  it('happy path', () => {
    // ref
    // .value
    // 缓存
    const value = reactive({
      foo: 1,
    });

    const getter = computed(() => {
      return value.foo;
    });
    value.foo++;
    expect(getter.value).toBe(2);
  });

  it('should compute lazily', () => {
    const value = reactive({
      foo: 1,
    });
    const getter = jest.fn(() => {
      return value.foo;
    });
    const cValue = computed(getter);

    // lazy
    // 懒执行
    expect(getter).not.toHaveBeenCalled();

    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // // should not compute until needed
    value.foo = 2; // trigger -> effect -> get 重新执行
    expect(getter).toHaveBeenCalledTimes(1);

    // now it should compute
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
  it('mix effect with computed', () => {
    console.log = jest.fn();
    let obj = reactive({
      foo: 1,
      bar: 2,
    });
    const sumRef = computed(() => obj.foo + obj.bar);
    effect(() => {
      console.log(sumRef.value);
    });
    obj.foo++;
    expect(console.log).toBeCalledTimes(2);
  });
});

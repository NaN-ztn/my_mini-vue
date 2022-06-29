import { ReactiveEffect, track, trigger } from './effect';

type hasValue = {
  value: any;
};

class ComputedRefImp {
  private obj: hasValue = { value: undefined };
  private _effect: ReactiveEffect;
  private _dirty: boolean = true;
  constructor(fn) {
    this._effect = new ReactiveEffect(fn, () => {
      if (!this._dirty) {
        this._dirty = true;
        trigger(this.obj, 'value');
      }
    });
  }
  get value() {
    if (this._dirty) {
      this.obj.value = this._effect.run();
      this._dirty = false;
    }
    track(this.obj, 'value');
    return this.obj.value;
  }
}

export function computed(fn) {
  return new ComputedRefImp(fn);
}

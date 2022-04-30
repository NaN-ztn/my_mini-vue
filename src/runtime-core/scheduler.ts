const queue: any[] = [];

let isFlushPending = false;

// 将逻辑放在微任务中执行
export function nextTick(fn) {
  return fn ? Promise.resolve().then(fn) : Promise.resolve();
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}
function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
}
function flushJobs() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}

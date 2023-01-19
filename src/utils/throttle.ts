export default function throttle(cb: () => any, delay = 350) {
  let shouldWait = false;

  return () => {
    if (shouldWait) return;

    cb();
    shouldWait = true;
    setTimeout(() => {
      shouldWait = false;
    }, delay);
  };
}

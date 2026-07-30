import { ref } from 'vue';

/**
 * 表格行级操作的并发保护 + loading 态。
 *
 * 统一替代各页面各自维护的 `operatingKeys = ref(new Set<number>())` 样板：
 * 同一行的操作进行中时重复点击会被忽略，无论成功失败都会在结束后解除占用。
 */
export function useOperatingKeys<K = number>() {
  const keys = ref(new Set<K>());

  /** 该行是否有操作正在进行（用于按钮 loading / disabled） */
  function isOperating(key: K) {
    return keys.value.has(key as any);
  }

  /** 包裹一次行操作，自动占用与释放；进行中重复调用直接返回 */
  async function run(key: K, action: () => Promise<unknown> | unknown) {
    if (keys.value.has(key as any)) return;
    keys.value.add(key as any);
    try {
      await action();
    } finally {
      keys.value.delete(key as any);
    }
  }

  return { keys, isOperating, run };
}

/**
 * 全局统一的操作二次确认弹窗。
 *
 * 规范：所有需要二次确认的操作一律走居中 Dialog，不再使用按钮旁的 NPopconfirm，
 * 避免同类操作（删除、封禁、审核）在不同页面出现两种交互形态。
 * 需要用户额外输入内容的场景（如填写驳回原因）仍然使用 NModal 表单弹窗。
 */

/** 确认语义：warning = 一般变更，error = 不可逆 / 破坏性操作，info = 中性提示 */
type ConfirmTone = 'warning' | 'error' | 'info';

export interface ConfirmOptions {
  /** 标题：一句话说清要做什么，如「确认封禁用户」 */
  title: string;
  /** 正文：说清作用对象与后果，如「确认将用户 [张三] 更改为封禁状态？」 */
  content: string;
  /** 确认语义，默认 warning */
  tone?: ConfirmTone;
  /** 确认按钮文案，默认「确认」 */
  positiveText?: string;
  /** 取消按钮文案，默认「取消」 */
  negativeText?: string;
  /**
   * 点击确认后执行的动作。
   * 返回 Promise 时确认按钮自动进入 loading 且弹窗保持打开直到 resolve；
   * 返回（或 resolve 出）false 可阻止弹窗关闭。
   */
  onConfirm: () => unknown;
}

export function confirmAction(options: ConfirmOptions) {
  const { title, content, tone = 'warning', positiveText = '确认', negativeText = '取消', onConfirm } = options;

  window.$dialog?.[tone]({
    title,
    content,
    positiveText,
    negativeText,
    onPositiveClick: onConfirm
  });
}

/**
 * 删除 / 永久移除类操作的确认弹窗，统一措辞与危险语义。
 *
 * @param target 被删除对象的描述，如 `奖品「限量徽章」`
 */
export function confirmDelete(target: string, onConfirm: ConfirmOptions['onConfirm']) {
  confirmAction({
    title: '确认删除',
    content: `确认永久删除${target}？该操作不可撤销。`,
    tone: 'error',
    positiveText: '确认删除',
    onConfirm
  });
}

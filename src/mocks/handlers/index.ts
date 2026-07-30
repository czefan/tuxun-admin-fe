import { delay, http } from 'msw';
import { activityHandlers } from './activity';
import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { contentHandlers } from './content';
import { feedbackHandlers } from './feedback';
import { mallHandlers } from './mall';
import { noticeHandlers } from './notice';
import { reviewHandlers } from './review';

/** 统一的接口延迟（毫秒），用于验证 loading 态与重复点击保护；0 表示不延迟 */
const MOCK_DELAY = Number(import.meta.env.VITE_MOCK_DELAY) || 0;

/**
 * 延迟注入 handler：匹配后不返回响应，MSW 会继续向后匹配真正的 handler。
 *
 * 仅在配置了延迟时挂载 —— 它会让 MSW 认为请求已被匹配，
 * 从而使 enable.ts 里「未处理的 /api 请求」报错失效，默认情况下不该付这个代价。
 */
const delayHandler = http.all('/api/*', async () => {
  await delay(MOCK_DELAY);
});

export const handlers = [
  ...(MOCK_DELAY > 0 ? [delayHandler] : []),
  ...authHandlers,
  ...reviewHandlers,
  ...activityHandlers,
  ...noticeHandlers,
  ...feedbackHandlers,
  ...mallHandlers,
  ...adminHandlers,
  ...contentHandlers
];

import type { components, operations } from './schema';

type S = components['schemas'];
type O = operations;

// —— 具名类型别名（替代现有手写定义）——
export type Media = S['Media'];
export type UserBrief = S['UserBrief'];
export type UserSummary = S['UserSummary'];
export type LoginResult = S['LoginResult'];
export type ActivityCard = S['ActivityCard'];
export type AdminPhotoListItem = S['AdminPhotoListItem'];
export type AdminAttemptListItem = S['AdminAttemptListItem'];
export type AdminCommentListItem = S['AdminCommentListItem'];
export type AdminAnnouncement = S['AdminAnnouncement'];
export type AdminAnnouncementListItem = S['AdminAnnouncementListItem'];
export type AdminExchangeRecord = S['AdminExchangeRecord'];
export type AdminFeedbackListItem = S['AdminFeedbackListItem'];
export type GoodItem = S['GoodItem'];
export type GoodBrief = S['GoodBrief'];
export type FeedbackMedia = S['FeedbackMedia'];
export type ContentBlock = S['ContentBlock'];
export type Location = S['Location'];

// 内联响应用 operations 解包
export type AdminStats = O['adminGetStats']['responses'][200]['content']['application/json']['resp'];
export type FeedbackDetail = O['adminGetFeedback']['responses'][200]['content']['application/json']['resp'];

// —— 适配函数 ——
export interface ImageVM {
  url: string;
  width: number;
  height: number;
}

/**
 * Media 归一。契约保证 origin_url / thumb_url 至少下发其一，但 schema 层
 * 表达不了「至少其一」，两者在类型上都是可选，所以统一在这里兜底。
 * prefer='thumb' 用于列表，'origin' 用于详情 / 编辑回填。
 */
export function toImageVM(m?: Media | FeedbackMedia | null, prefer: 'thumb' | 'origin' = 'thumb'): ImageVM {
  const url = prefer === 'thumb' ? (m?.thumb_url ?? m?.origin_url ?? '') : (m?.origin_url ?? m?.thumb_url ?? '');
  const w = Number(m?.width);
  const h = Number(m?.height);
  const ok = Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
  return { url, width: ok ? w : 800, height: ok ? h : 600 };
}

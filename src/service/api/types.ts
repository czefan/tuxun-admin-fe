export interface PageParams {
  page: number;
  page_size: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type AttemptStatus = 'pending' | 'solved' | 'unsolved';
export type UserStatus = 'active' | 'banned';

export interface UserBrief {
  id: number;
  nickname: string;
  avatar_url: string;
}

export interface UserSummary {
  id: number;
  netid: string;
  username: string;
  nickname: string;
  avatar_url: string;
  level: number;
  status: UserStatus;
}

export interface ActivityBrief {
  id: number;
  title: string;
}

export interface ActivityCard {
  id: number;
  title: string;
  cover_url: string;
  description: string;
  start_time: string;
  end_time: string;
}

/** 坐标对象 */
export interface Location {
  longitude: number;
  latitude: number;
  coord_type: 'wgs84' | 'gcj02' | 'bd09';
}

export interface AdminPhotoListItem {
  id: number;
  activity: ActivityBrief;
  author: UserBrief;
  title: string;
  description: string;
  image_url: string;
  thumb_url: string;
  location: Location;
  solved_count: number;
  attempts_count: number;
  likes_count: number;
  status: ReviewStatus;
  reject_reason: string | null;
  created_at: string;
}

/** 奖品摘要，用于兑换记录中 */
export interface GoodBrief {
  id: number;
  name: string;
  thumb_url: string;
  /** 兑换所需积分 */
  score_price: number;
}

export interface OperationResult {
  id: number;
  status: string;
}

export interface ReviewActionPayload {
  action: 'approve' | 'reject';
  reject_reason?: string;
}

export function appendFormValue(formData: FormData, key: string, value: string | number | File | null | undefined) {
  if (value === undefined || value === null) return;
  formData.append(key, value instanceof File ? value : String(value));
}

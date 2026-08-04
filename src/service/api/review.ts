import type { AdminAttemptListItem, AdminCommentListItem, AdminPhotoListItem } from '../contract/types';
import { request } from '../request';
import type {
  AttemptStatus,
  OperationResult,
  PageParams,
  PageResult,
  ReviewActionPayload,
  ReviewStatus
} from './types';

export type PhotoReviewItem = AdminPhotoListItem;
export type AttemptReviewItem = AdminAttemptListItem;
export type CommentReviewItem = AdminCommentListItem;

export function fetchPhotoReviews(
  params: PageParams & {
    status?: ReviewStatus;
    activity_ids?: number[] | number;
    solved?: boolean;
    keyword?: string;
    user_keyword?: string;
  }
) {
  return request<PageResult<PhotoReviewItem>>({ url: '/admin/photos', params });
}

export function reviewPhoto(id: number, data: ReviewActionPayload) {
  return request<OperationResult>({ url: `/admin/photos/${id}/review`, method: 'put', data });
}

export function fetchAttemptReviews(
  params: PageParams & {
    status?: AttemptStatus;
    keyword?: string;
    photo_keyword?: string;
    user_keyword?: string;
  }
) {
  return request<PageResult<AttemptReviewItem>>({ url: '/admin/attempts', params });
}

/**
 * 审核作答
 * @param id 作答 ID
 * @param solved 判定结果：'solved'（正确） / 'unsolved'（错误）
 * @param reject_reason 未破解说明（可选，最长 50 字符）
 */
export function reviewAttempt(id: number, solved: Exclude<AttemptStatus, 'pending'>, reject_reason?: string) {
  return request<OperationResult>({
    url: `/admin/attempts/${id}/review`,
    method: 'put',
    data: { solved, reject_reason }
  });
}

export function fetchCommentReviews(
  params: PageParams & {
    status?: ReviewStatus;
    keyword?: string;
    photo_keyword?: string;
    user_keyword?: string;
  }
) {
  return request<PageResult<CommentReviewItem>>({ url: '/admin/comments', params });
}

export function reviewComment(id: number, data: ReviewActionPayload) {
  return request<OperationResult>({ url: `/admin/comments/${id}/review`, method: 'put', data });
}

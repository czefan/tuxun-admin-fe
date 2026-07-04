import { request } from '../request';
import type { PageParams, PageResult, ReviewPayload, ReviewStatus } from './types';

export interface QuestionReviewItem {
  id: string;
  title: string;
  authorName: string;
  locationText: string;
  submittedAt: string;
  status: ReviewStatus;
}

export interface AnswerReviewItem {
  id: string;
  questionTitle: string;
  userName: string;
  distanceMeters: number;
  submittedAt: string;
  status: ReviewStatus;
}

export function fetchQuestionReviews(params: PageParams) {
  return request<PageResult<QuestionReviewItem>>({
    url: '/admin/reviews/questions',
    params
  });
}

export function approveQuestionReview(data: ReviewPayload) {
  return request<void>({
    url: `/admin/reviews/questions/${data.id}/approve`,
    method: 'post',
    data
  });
}

export function rejectQuestionReview(data: ReviewPayload) {
  return request<void>({
    url: `/admin/reviews/questions/${data.id}/reject`,
    method: 'post',
    data
  });
}

export function fetchAnswerReviews(params: PageParams) {
  return request<PageResult<AnswerReviewItem>>({
    url: '/admin/reviews/answers',
    params
  });
}

export function approveAnswerReview(data: ReviewPayload) {
  return request<void>({
    url: `/admin/reviews/answers/${data.id}/approve`,
    method: 'post',
    data
  });
}

export function rejectAnswerReview(data: ReviewPayload) {
  return request<void>({
    url: `/admin/reviews/answers/${data.id}/reject`,
    method: 'post',
    data
  });
}

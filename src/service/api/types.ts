export type {
  ActivityCard,
  AdminPhotoListItem,
  GoodBrief,
  GoodItem,
  Location,
  UserBrief,
  UserSummary
} from '../contract/types';

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

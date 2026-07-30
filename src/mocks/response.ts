import { HttpResponse } from 'msw';
import { mockDb } from './data/db';

export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  resp: T;
  message: string;
  code: number;
}

export function mockSuccess<T>(data: T, message = '操作成功', status = 200) {
  return HttpResponse.json<ApiResponseEnvelope<T>>(
    {
      success: true,
      resp: data,
      message,
      code: 0
    },
    { status }
  );
}

export function mockError(message: string, code = 3, status = 400) {
  return HttpResponse.json<ApiResponseEnvelope<any>>(
    {
      success: false,
      resp: null,
      message,
      code
    },
    { status }
  );
}

export function mockBadRequest(message = '请求参数无效') {
  return mockError(message, 3, 400);
}

export function mockServerError(message = '服务器内部错误') {
  return mockError(message, 4, 500);
}

export function mockNotFound(message = '请求的资源不存在') {
  return mockError(message, 5, 404);
}

export function mockOperationError(message = '操作不可执行') {
  return mockError(message, 5, 400);
}

export function mockUnauthorized(message = 'Session 无效或未登录') {
  return mockError(message, 6, 401);
}

export function mockForbidden(message = '权限不足') {
  return mockError(message, 7, 403);
}

export function mockConflict(message = '状态冲突，无法继续操作') {
  return mockError(message, 8, 409);
}

export function checkAdminAuth(minLevel = 2) {
  if (!mockDb.session) {
    return mockUnauthorized('Session 无效或未登录');
  }
  if (mockDb.session.level < minLevel) {
    return mockForbidden('权限不足');
  }
  return null;
}

/** 从未知错误中提取可展示的文案，优先使用后端业务信息。 */
export function getErrorText(error: unknown, fallback = ''): string {
  if (!error || typeof error !== 'object') return fallback;
  const value = error as { response?: { data?: { message?: unknown } }; message?: unknown };
  const message = value.response?.data?.message || value.message;
  return typeof message === 'string' ? message : fallback;
}

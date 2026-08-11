export type AuthSessionStatus = 'unknown' | 'loading' | 'authenticated' | 'anonymous' | 'forbidden' | 'error';

export function createEmptyUserInfo(): Api.Auth.UserInfo {
  return {
    id: 0,
    netid: '',
    username: '',
    nickname: '',
    avatar: '',
    score_count: 0,
    level: 0,
    nickname_edits_remaining: 0,
    avatar_edits_remaining: 0
  };
}

export function sanitizeLoginRedirect(redirect?: string | null): string {
  if (!redirect) return '/home';
  const trimmed = redirect.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/login') ||
    trimmed.startsWith('/403')
  ) {
    return '/home';
  }
  if (trimmed.includes(':') || trimmed.includes('javascript:')) {
    return '/home';
  }
  return trimmed;
}

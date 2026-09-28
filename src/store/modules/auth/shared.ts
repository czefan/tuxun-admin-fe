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
  let decoded: string;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return '/home';
  }
  if (
    !trimmed.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    [...decoded].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
    /^\/(?:login|403)(?:[/?#]|$)/i.test(decoded)
  ) {
    return '/home';
  }
  return trimmed;
}

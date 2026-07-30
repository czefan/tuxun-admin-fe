import { useAuthStore } from '@/store/modules/auth';

export function useAuth() {
  const authStore = useAuthStore();

  function hasAuth(requiredLevel: number | number[]) {
    const levels = Array.isArray(requiredLevel) ? requiredLevel : [requiredLevel];
    return authStore.isLogin && levels.some(level => authStore.userInfo.level >= level);
  }

  return {
    hasAuth
  };
}

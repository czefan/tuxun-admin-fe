import type { LocationQueryRaw, RouteLocationNormalized, RouteLocationRaw, Router } from 'vue-router';
import type { RouteKey, RoutePath } from '@elegant-router/types';
import { useAuthStore } from '@/store/modules/auth';
import { useRouteStore } from '@/store/modules/route';
import { getRouteName } from '@/router/elegant/transform';

export function createRouteGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const location = await initRoute(to);
    if (location) return location;

    const authStore = useAuthStore();
    const rootRoute: RouteKey = 'root';
    const loginRoute: RouteKey = 'login';
    const callbackRoute: RouteKey = 'login-callback';
    const noAuthorizationRoute: RouteKey = '403';

    if ((to.name === loginRoute || to.name === callbackRoute) && authStore.isLogin) {
      return { name: rootRoute };
    }

    if (to.meta.constant) {
      return handleRouteSwitch(to, from);
    }

    if (!authStore.hasSession) {
      return { name: loginRoute, query: { redirect: to.fullPath } };
    }

    const requiredLevel = to.meta.requiredLevel || 2;
    if (!authStore.isAdmin || authStore.userInfo.level < requiredLevel) {
      return { name: noAuthorizationRoute };
    }

    return handleRouteSwitch(to, from);
  });
}

async function initRoute(to: RouteLocationNormalized): Promise<RouteLocationRaw | null> {
  const routeStore = useRouteStore();
  const authStore = useAuthStore();
  const notFoundRoute: RouteKey = 'not-found';
  const callbackRoute: RouteKey = 'login-callback';
  const isNotFoundRoute = to.name === notFoundRoute;

  if (!routeStore.isInitConstantRoute) {
    await routeStore.initConstantRoute();

    return {
      path: to.fullPath,
      replace: true,
      query: to.query,
      hash: to.hash
    };
  }

  if (!authStore.sessionInitialized && to.name !== callbackRoute) {
    await authStore.initSession();
  }

  if (!authStore.isLogin) {
    if (to.meta.constant && !isNotFoundRoute) {
      routeStore.onRouteSwitchWhenNotLoggedIn();
      return null;
    }

    const loginRoute: RouteKey = 'login';
    return {
      name: loginRoute,
      query: getRouteQueryOfLoginRoute(to, routeStore.routeHome)
    };
  }

  if (!routeStore.isInitAuthRoute) {
    await routeStore.initAuthRoute();

    if (isNotFoundRoute) {
      const rootRoute: RouteKey = 'root';
      const path = to.redirectedFrom?.name === rootRoute ? '/' : to.fullPath;

      return {
        path,
        replace: true,
        query: to.query,
        hash: to.hash
      };
    }
  }

  routeStore.onRouteSwitchWhenLoggedIn();

  if (!isNotFoundRoute) return null;

  const exists = await routeStore.getIsAuthRouteExist(to.path as RoutePath);
  return exists ? { name: '403' } : null;
}

function handleRouteSwitch(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  if (to.meta.href) {
    window.open(to.meta.href, '_blank');
    return { path: from.fullPath, replace: true, query: from.query, hash: to.hash };
  }
}

function getRouteQueryOfLoginRoute(to: RouteLocationNormalized, routeHome: RouteKey) {
  const loginRoute: RouteKey = 'login';
  const redirect = to.fullPath;
  const [redirectPath, redirectQuery] = redirect.split('?');
  const redirectName = getRouteName(redirectPath as RoutePath);
  const isRedirectHome = routeHome === redirectName;
  const query: LocationQueryRaw = to.name !== loginRoute && !isRedirectHome ? { redirect } : {};

  if (isRedirectHome && redirectQuery) {
    query.redirect = `/?${redirectQuery}`;
  }

  return query;
}

import type { RouteMeta } from 'vue-router';
import ElegantVueRouter from '@elegant-router/vue/vite';

export function setupElegantRouter() {
  const routeMetaMap: Record<string, Partial<RouteMeta>> = {
    home: { icon: 'mdi:view-dashboard-outline', order: 1 },

    review: { icon: 'mdi:clipboard-check-outline', order: 2 },
    review_photos: { icon: 'mdi:image-check-outline', order: 1 },
    review_attempts: { icon: 'mdi:map-check-outline', order: 2 },
    review_comments: { icon: 'mdi:comment-alert-outline', order: 3 },

    operation: { icon: 'mdi:calendar-month-outline', order: 3 },
    operation_activities: { icon: 'mdi:calendar-clock-outline', order: 1 },
    'operation_activity-form': {
      icon: 'mdi:calendar-plus-outline',
      hideInMenu: true,
      activeMenu: 'operation_activities'
    },
    operation_notice: { icon: 'mdi:bell-outline', order: 2 },
    'operation_notice-form': {
      icon: 'mdi:bell-ring-outline',
      hideInMenu: true,
      activeMenu: 'operation_notice'
    },
    'operation_notice-detail': {
      icon: 'mdi:bell-outline',
      hideInMenu: true,
      activeMenu: 'operation_notice'
    },
    operation_questions: {
      icon: 'mdi:image-multiple-outline',
      order: 0
    },
    operation_feedback: { icon: 'mdi:message-alert-outline', order: 3 },
    'operation_feedback-detail': {
      icon: 'mdi:message-alert-outline',
      hideInMenu: true,
      activeMenu: 'operation_feedback'
    },
    operation_other: { icon: 'mdi:dots-horizontal-circle-outline', order: 4 },

    mall: { icon: 'mdi:storefront-outline', order: 4 },
    mall_goods: { icon: 'mdi:package-variant-closed', order: 1 },
    'mall_good-form': {
      icon: 'mdi:package-variant-plus',
      hideInMenu: true,
      activeMenu: 'mall_goods'
    },
    mall_exchange: { icon: 'mdi:ticket-confirmation-outline', order: 2 },

    system: { icon: 'mdi:cog-outline', order: 5 },
    system_users: { icon: 'mdi:account-group-outline', order: 1, requiredLevel: 3 },

    'login-callback': { hideInMenu: true }
  };

  return ElegantVueRouter({
    layouts: {
      base: 'src/layouts/base-layout/index.vue',
      blank: 'src/layouts/blank-layout/index.vue'
    },
    routePathTransformer(routeName, routePath) {
      if (routeName === 'login') {
        return '/login';
      }
      if (routeName === 'login_callback' || routeName === 'login-callback') {
        return '/login/callback';
      }

      return routePath;
    },
    onRouteMetaGen(routeName) {
      const key = routeName as string;

      const constantRoutes = ['login', 'login_callback', 'login-callback', '403', '404', '500'];

      const meta: Partial<RouteMeta> = {
        title: key,
        i18nKey: `route.${key}` as App.I18n.I18nKey
      };

      Object.assign(meta, routeMetaMap[key]);

      if (constantRoutes.includes(key)) {
        meta.constant = true;
      }

      return meta;
    }
  });
}

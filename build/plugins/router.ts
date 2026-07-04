import type { RouteMeta } from 'vue-router';
import ElegantVueRouter from '@elegant-router/vue/vite';

export function setupElegantRouter() {
  const routeMetaMap: Record<string, Partial<RouteMeta>> = {
    home: { icon: 'mdi:view-dashboard-outline', order: 1 },
    review: { icon: 'mdi:clipboard-check-outline', order: 2 },
    review_question: { icon: 'mdi:image-check-outline', order: 1 },
    review_answer: { icon: 'mdi:map-check-outline', order: 2 },
    activity: { icon: 'mdi:calendar-month-outline', order: 3 },
    activity_list: { icon: 'mdi:calendar-clock-outline', order: 2 },
    'activity_list-create': {
      icon: 'mdi:calendar-plus-outline',
      hideInMenu: true,
      activeMenu: 'activity_list'
    },
    'activity_list-question': {
      icon: 'mdi:format-list-bulleted-square',
      hideInMenu: true,
      activeMenu: 'activity_list'
    },
    'activity_list-question-detail': {
      icon: 'mdi:format-list-bulleted-square',
      hideInMenu: true,
      activeMenu: 'activity_list',
      breadcrumbRoutes: ['activity_list-question']
    },
    activity_question: { icon: 'mdi:camera-plus-outline', order: 1 },
    'activity_question-create': {
      icon: 'mdi:camera-plus-outline',
      hideInMenu: true,
      activeMenu: 'activity_question'
    },
    'activity_question-detail': {
      icon: 'mdi:camera-plus-outline',
      hideInMenu: true,
      activeMenu: 'activity_question'
    },
    mall: { icon: 'mdi:storefront-outline', order: 4 },
    mall_product: { icon: 'mdi:package-variant-closed', order: 1 },
    'mall_product-create': {
      icon: 'mdi:package-variant-plus',
      hideInMenu: true,
      activeMenu: 'mall_product'
    },
    'mall_product-detail': {
      icon: 'mdi:package-variant-closed',
      hideInMenu: true,
      activeMenu: 'mall_product'
    },
    mall_redemption: { icon: 'mdi:ticket-confirmation-outline', order: 2 },
    mall_rules: { icon: 'mdi:format-list-checks', order: 3 },
    'mall_rules-diff': {
      icon: 'mdi:format-list-checks',
      hideInMenu: true,
      activeMenu: 'mall_rules'
    },
    notice: { icon: 'mdi:bell-outline', order: 5 },
    notice_list: { icon: 'mdi:bell-badge-outline', order: 1 },
    'notice_list-create': {
      icon: 'mdi:bell-plus-outline',
      hideInMenu: true,
      activeMenu: 'notice_list'
    },
    'notice_list-detail': {
      icon: 'mdi:bell-badge-outline',
      hideInMenu: true,
      activeMenu: 'notice_list'
    },
    content: { icon: 'mdi:comment-text-multiple-outline', order: 6 },
    content_feedback: { icon: 'mdi:message-alert-outline', order: 1 },
    'content_feedback-detail': {
      icon: 'mdi:message-alert-outline',
      hideInMenu: true,
      activeMenu: 'content_feedback'
    },
    content_help: { icon: 'mdi:help-circle-outline', order: 2 },
    'content_help-create': {
      icon: 'mdi:help-circle-outline',
      hideInMenu: true,
      activeMenu: 'content_help'
    },
    'content_help-diff': {
      icon: 'mdi:help-circle-outline',
      hideInMenu: true,
      activeMenu: 'content_help'
    },
    content_about: { icon: 'mdi:information-outline', order: 3 },
    'content_about-edit': {
      icon: 'mdi:information-outline',
      hideInMenu: true,
      activeMenu: 'content_about'
    },
    'content_about-diff': {
      icon: 'mdi:information-outline',
      hideInMenu: true,
      activeMenu: 'content_about'
    },
    content_comment: { icon: 'mdi:comment-alert-outline', order: 4 },
    user: { icon: 'mdi:account-group-outline', order: 7 },
    user_list: { icon: 'mdi:account-multiple-outline', order: 1 },
    'user_list-detail': {
      icon: 'mdi:account-details-outline',
      hideInMenu: true,
      activeMenu: 'user_list'
    }
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

      return routePath;
    },
    onRouteMetaGen(routeName) {
      const key = routeName as string;

      const constantRoutes = ['login', '403', '404', '500'];

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

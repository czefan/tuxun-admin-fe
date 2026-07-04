import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router';
import { $t, getLocale } from '@/locales';

type RouteLike = RouteLocationNormalized | RouteLocationNormalizedLoaded;

function getSingleParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];

  return value;
}

function getActivityId(route: RouteLike) {
  const queryActivityId = typeof route.query.activityId === 'string' ? route.query.activityId : undefined;
  const paramId = getSingleParamValue(route.params.id as string | string[] | undefined);

  return queryActivityId || paramId;
}

export function getActivityQuestionRouteTitle(route: RouteLike) {
  const matchedPeriod = String(getActivityId(route) || '').match(/ACT-(\d+)/u);

  if (!matchedPeriod) return null;

  const period = Number(matchedPeriod[1]);

  return getLocale() === 'en-US' ? `Phase ${period} Questions` : `第 ${period} 期题目`;
}

export function getRouteTitle(route: RouteLike) {
  if (route.name === 'activity_list-question') {
    return getActivityQuestionRouteTitle(route) || $t('route.activity_list-question');
  }

  const { i18nKey, title } = route.meta;

  return i18nKey ? $t(i18nKey) : title;
}

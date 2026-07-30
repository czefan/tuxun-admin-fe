import dayjs from 'dayjs';
import type { ActivityListItem, FeedbackType } from '@/service/api';

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : value;
}

export function formatDateTimeSplit(value?: string | null) {
  if (!value) return { date: '-', time: '' };
  const date = dayjs(value);
  if (!date.isValid()) return { date: value, time: '' };
  return {
    date: date.format('YYYY-MM-DD'),
    time: date.format('HH:mm:ss')
  };
}

export function getActivityStatus(activity: Pick<ActivityListItem, 'start_time' | 'end_time'>) {
  const start = dayjs(activity.start_time);
  const end = dayjs(activity.end_time);
  if (!start.isValid() || !end.isValid()) return 'ended' as const;

  const now = dayjs();
  if (now.isBefore(start)) return 'not_started' as const;
  if (now.isSame(end) || now.isAfter(end)) return 'ended' as const;
  return 'active' as const;
}

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  1: '内容问题',
  2: '玩法建议',
  3: '技术问题',
  4: '其他'
};

export function getDistanceMeters(longitudeA: number, latitudeA: number, longitudeB: number, latitudeB: number) {
  const earthRadius = 6371000;
  const toRadians = (degree: number) => (degree * Math.PI) / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const startLatitude = toRadians(latitudeA);
  const endLatitude = toRadians(latitudeB);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

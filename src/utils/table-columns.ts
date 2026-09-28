import { h } from 'vue';
import { NAvatar, NButton, NImage, NTag, type DataTableColumn } from 'naive-ui';

import { formatDateTimeSplit } from '@/utils/tuxun';
import { toImageVM } from '@/service/contract/types';

/**
 * 1. 通用两行时间列生成器 (日期在上，时间在下)
 * 强制添加 whitespace-nowrap (严禁折行变 3 行)，宽度匹配 108px 适配 14px 字号
 */
export function createDateTimeColumn<T = any>(options?: {
  title?: string;
  key?: string;
  width?: number;
}): DataTableColumn<T> {
  const title = options?.title ?? '创建时间';
  const key = options?.key ?? 'created_at';
  const width = options?.width ?? 95;

  return {
    title,
    key,
    width,
    render(row: any) {
      const val = row[key];
      if (!val) return '-';
      const { date, time } = formatDateTimeSplit(val);
      return h(
        'div',
        { class: 'text-14px text-gray-700 dark:text-gray-200 leading-snug font-normal whitespace-nowrap' },
        [
          h('div', { class: 'whitespace-nowrap' }, date),
          h('div', { class: 'text-13px text-gray-500 dark:text-gray-400 mt-1px font-normal whitespace-nowrap' }, time)
        ]
      );
    }
  };
}

/**
 * 2. 通用图片 / 缩略图列生成器
 */
export function createThumbColumn<T = any>(options?: {
  title?: string;
  key?: string;
  width?: number;
  imageSize?: number;
}): DataTableColumn<T> {
  const title = options?.title ?? '图片';
  const key = options?.key ?? 'image';
  const width = options?.width ?? 68;
  const imageSize = options?.imageSize ?? 52;

  return {
    title,
    key,
    width,
    render(row: any) {
      let val = row[key];
      if (val && typeof val === 'object' && !('origin_url' in val) && !('thumb_url' in val)) {
        val = val.image ?? val.cover_image ?? val.media_file ?? val;
      }
      const vm =
        typeof val === 'object' ? toImageVM(val, 'thumb') : { url: val || '', width: 0, height: 0, aspectRatio: 1 };
      const originVm = typeof val === 'object' ? toImageVM(val, 'origin') : vm;
      const src = vm.url;
      return src
        ? h(
            'div',
            {
              class:
                'overflow-hidden rounded-6px bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center',
              style: {
                width: `${imageSize}px`,
                height: `${imageSize}px`
              }
            },
            [
              h(NImage, {
                src,
                previewSrc: originVm.url,
                width: imageSize,
                height: imageSize,
                objectFit: 'cover',
                showToolbarTooltip: true,
                imgProps: { class: 'rounded-6px' },
                class: 'w-full h-full cursor-pointer shadow-xs rounded-6px overflow-hidden'
              })
            ]
          )
        : '-';
    }
  };
}

/**
 * 3. 通用状态 Tag 标签列生成器
 */
export function createStatusColumn<T = any>(
  statusMap: Record<string, { type: 'warning' | 'success' | 'error' | 'info' | 'default'; label: any }>,
  options?: {
    title?: string;
    key?: string;
    width?: number;
    size?: 'small' | 'medium' | 'large';
  }
): DataTableColumn<T> {
  const title = options?.title ?? '状态';
  const key = options?.key ?? 'status';
  const width = options?.width ?? 90;
  const size = options?.size ?? 'medium';

  return {
    title,
    key,
    width,
    render(row: any) {
      const rawStatus = row[key] || 'pending';
      const conf = statusMap[rawStatus] || { type: 'default', label: String(rawStatus) };
      const isMulti = typeof conf.label === 'string' && conf.label.includes('\n');

      return h(
        NTag,
        {
          type: conf.type,
          size,
          style: isMulti ? { paddingTop: '5px', paddingBottom: '5px', height: 'auto' } : undefined
        },
        {
          default: () => {
            if (!isMulti) return conf.label;
            const [top, bottom] = conf.label.split('\n');
            return h('div', { class: 'text-center leading-snug' }, [
              h('div', { class: 'font-medium' }, top),
              h('div', { class: 'text-11px opacity-85 mt-2px' }, bottom)
            ]);
          }
        }
      );
    }
  };
}

/**
 * 4. 通用用户/提交人列生成器 (第一行: 头像+昵称，第二行: 用户ID)
 *
 * 单元格渲染只服务于 createUserColumn，不对外导出；
 * 详情弹窗等非表格场景请用下面的 renderUserInline。
 */
function renderUserCell(user?: { avatar?: string; nickname?: string; id?: number } | null, defaultUserId?: number) {
  const avatarUrl = user?.avatar || '';
  const nickname = user?.nickname || '未知用户';
  const userId = user?.id ?? defaultUserId ?? 0;

  return h('div', { class: 'space-y-0.5' }, [
    h('div', { class: 'flex items-center gap-6px' }, [
      h(NAvatar, {
        round: true,
        size: 24,
        src: avatarUrl,
        fallbackSrc: `${import.meta.env.BASE_URL}favicon.svg`,
        style: 'flex-shrink: 0; align-self: center;'
      }),
      h('span', { class: 'line-clamp-2 font-medium text-13px text-gray-900 dark:text-gray-100 leading-snug' }, nickname)
    ]),
    h('div', { class: 'text-12px text-gray-400' }, `ID: ${userId}`)
  ]);
}

export function createUserColumn<T = any>(options?: {
  title?: string;
  key?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  getUser?: (row: T) => { avatar?: string; nickname?: string; id?: number } | null;
  getUserId?: (row: T) => number;
}): DataTableColumn<T> {
  const title = options?.title ?? '用户';
  const key = options?.key ?? 'user';
  const width = options?.width ?? 140;

  return {
    title,
    key,
    width,
    minWidth: options?.minWidth,
    maxWidth: options?.maxWidth ?? 160,
    render(row: any) {
      const user = options?.getUser ? options.getUser(row) : row.user || row.author;
      const userId = options?.getUserId ? options.getUserId(row) : row.user_id;
      return renderUserCell(user, userId);
    }
  };
}

/**
 * 5. 单行内联用户生成器 (头像 + 昵称 (ID: xxx))
 * 适用于详情 Modal / Descriptions 详情展现
 */
export function renderUserInline(
  user?: { avatar?: string; nickname?: string; id?: number } | null,
  defaultUserId?: number
) {
  const avatarUrl = user?.avatar || '';
  const nickname = user?.nickname || '未知';
  const userId = user?.id ?? defaultUserId ?? '-';

  return h('div', { class: 'flex items-center gap-6px' }, [
    h(NAvatar, {
      round: true,
      size: 'small',
      src: avatarUrl,
      fallbackSrc: `${import.meta.env.BASE_URL}favicon.svg`
    }),
    h('span', `${nickname} (ID: ${userId})`)
  ]);
}

/**
 * 6. 坐标展示 (经 / 纬 两行 + 高德地图外链)
 * 供 Descriptions 详情、以及未配 AMAP key 时地图选点的降级分支复用
 */
export function renderCoordsInline(
  location?: { longitude?: number | null; latitude?: number | null } | null,
  markerName = '标记位置'
) {
  const lng = location?.longitude;
  const lat = location?.latitude;

  if (lng == null || lat == null || !Number.isFinite(lng) || !Number.isFinite(lat)) {
    return h('span', { class: 'text-gray-400 text-14px' }, '无坐标信息');
  }

  return h('div', { class: 'flex items-center gap-12px' }, [
    h('div', { class: 'flex flex-col text-14px leading-snug' }, [h('span', `经: ${lng}`), h('span', `纬: ${lat}`)]),
    h(
      'a',
      {
        href: `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(markerName)}`,
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'inline-flex items-center gap-2px text-14px text-primary font-medium hover:underline shrink-0'
      },
      '地图查看 📍'
    )
  ]);
}

/**
 * 7. 审核类页面的操作列生成器 (第一行「查看」，待审核时第二行「通过 / 驳回」)
 * 投稿、评论、答题三个审核页共用同一套按钮布局，仅文案与判定条件不同
 */
export function createReviewActionsColumn<T = any>(options: {
  /** 该行是否处于待审核态，决定是否展示通过 / 驳回按钮 */
  isPending: (row: T) => boolean;
  /** 该行是否有操作进行中，用于按钮 loading */
  isOperating: (row: T) => boolean;
  onView: (row: T) => void;
  onApprove: (row: T) => void;
  onReject: (row: T) => void;
  /** 通过按钮文案，答题审核用「正确」 */
  approveText?: string;
  /** 驳回按钮文案，答题审核用「错误」 */
  rejectText?: string;
  /** 是否允许在已审核状态下随时改判（用于评论审核） */
  allowRejudge?: boolean;
  /** 获取当前行的 status，配合 allowRejudge 使用 */
  getStatus?: (row: T) => string;
  title?: string;
  width?: number;
}): DataTableColumn<T> {
  const approveText = options.approveText ?? '通过';
  const rejectText = options.rejectText ?? '驳回';
  const title = options.title ?? '操作';
  const width = options.width ?? 120;

  return {
    title,
    key: 'actions',
    width,
    render(row: T) {
      const loading = options.isOperating(row);
      const isPending = options.isPending(row);
      const status = options.getStatus ? options.getStatus(row) : (row as any)?.status;

      const children = [
        h(
          NButton,
          { size: 'small', type: 'info', secondary: true, class: 'w-full', onClick: () => options.onView(row) },
          { default: () => '查看' }
        )
      ];

      // 1. 待审核状态：提供 [通过 | 驳回] 两个按钮
      if (isPending) {
        children.push(
          h('div', { class: 'flex items-center gap-6px mt-6px' }, [
            h(
              NButton,
              {
                size: 'small',
                type: 'success',
                secondary: true,
                class: 'flex-1',
                loading,
                onClick: () => options.onApprove(row)
              },
              { default: () => approveText }
            ),
            h(
              NButton,
              { size: 'small', type: 'error', secondary: true, class: 'flex-1', onClick: () => options.onReject(row) },
              { default: () => rejectText }
            )
          ])
        );
      } else if (options.allowRejudge) {
        // 2. 允许改判场景 (评论审核)：已通过的展示 [驳回]，已驳回的展示 [通过]
        if (status === 'approved') {
          children.push(
            h('div', { class: 'mt-6px' }, [
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error',
                  secondary: true,
                  class: 'w-full',
                  loading,
                  onClick: () => options.onReject(row)
                },
                { default: () => '改判驳回' }
              )
            ])
          );
        } else if (status === 'rejected') {
          children.push(
            h('div', { class: 'mt-6px' }, [
              h(
                NButton,
                {
                  size: 'small',
                  type: 'success',
                  secondary: true,
                  class: 'w-full',
                  loading,
                  onClick: () => options.onApprove(row)
                },
                { default: () => '改判通过' }
              )
            ])
          );
        }
      }

      return h('div', { class: 'w-100px' }, children);
    }
  };
}

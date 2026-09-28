import { HttpResponse, http } from 'msw';
import type { AdminAttemptListItem, AdminCommentListItem, AdminPhotoListItem } from '@/service/contract/types';
import { mockDb } from '../data/db';
import { checkAdminAuth, mockConflict, mockNotFound, mockSuccess } from '../response';

export const reviewHandlers = [
  // Photos review / Global photo pool
  http.get('/api/admin/photos', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const keyword = (url.searchParams.get('keyword') || '').toLowerCase().trim();
    const activityIds = url.searchParams.getAll('activity_ids').map(Number).filter(Boolean);
    const userKeyword = (url.searchParams.get('user_keyword') || '').toLowerCase().trim();
    const solvedStr = url.searchParams.get('solved');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';

    let filtered = mockDb.photos;
    if (status && status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }
    if (activityIds.length > 0) {
      filtered = filtered.filter(item => activityIds.includes(item.activity?.id || 101));
    }
    if (userKeyword) {
      filtered = filtered.filter(
        item => String(item.author.id).includes(userKeyword) || item.author.nickname.toLowerCase().includes(userKeyword)
      );
    }
    if (solvedStr === 'true') {
      filtered = filtered.filter(item => (item.solves_count ?? (item.solved ? 1 : 0)) > 0);
    } else if (solvedStr === 'false') {
      filtered = filtered.filter(item => (item.solves_count ?? (item.solved ? 1 : 0)) === 0);
    }
    if (keyword) {
      filtered = filtered.filter(
        item =>
          String(item.id).includes(keyword) ||
          item.title.toLowerCase().includes(keyword) ||
          (item.description || '').toLowerCase().includes(keyword) ||
          String(item.author.id).includes(keyword) ||
          (item.author.nickname || '').toLowerCase().includes(keyword)
      );
    }
    // 契约：sort_by 支持 created_at（默认）/ likes_count，均按降序，值相同按 id 倒序保证稳定分页
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'likes_count') {
        return (b.likes_count ?? 0) - (a.likes_count ?? 0) || b.id - a.id;
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id;
    });

    const start = (page - 1) * pageSize;
    const list: AdminPhotoListItem[] = filtered.slice(start, start + pageSize);
    return mockSuccess({ total: filtered.length, list });
  }),

  // Photo image blob binary
  http.get('/api/photos/:id/image', () => {
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49,
      0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    return new HttpResponse(pngBytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/png'
      }
    });
  }),

  http.put('/api/admin/photos/:id/review', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const body = (await request.json()) as { action: 'approve' | 'reject'; reject_reason?: string };
    const photo = mockDb.photos.find(item => item.id === id);
    if (!photo) return mockNotFound('未找到该投稿审核记录');
    if (photo.status !== 'pending') return mockConflict('该投稿已被其他管理员审核');

    photo.status = body.action === 'approve' ? 'approved' : 'rejected';
    photo.reject_reason = body.reject_reason || null;
    return mockSuccess({ id: photo.id, status: photo.status }, '投稿审核状态已更新');
  }),

  // Attempts review
  http.get('/api/admin/attempts', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const keyword = (url.searchParams.get('keyword') || '').toLowerCase().trim();
    const photoKeyword = (url.searchParams.get('photo_keyword') || '').toLowerCase().trim();
    const userKeyword = (url.searchParams.get('user_keyword') || '').toLowerCase().trim();

    let filtered = mockDb.attempts;
    if (status && status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }
    if (keyword) {
      filtered = filtered.filter(
        item => String(item.id).includes(keyword) || item.photo.title.toLowerCase().includes(keyword)
      );
    }
    if (photoKeyword) {
      filtered = filtered.filter(
        item => String(item.photo.id).includes(photoKeyword) || item.photo.title.toLowerCase().includes(photoKeyword)
      );
    }
    if (userKeyword) {
      filtered = filtered.filter(
        item => String(item.user.id).includes(userKeyword) || item.user.nickname.toLowerCase().includes(userKeyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list: AdminAttemptListItem[] = filtered.slice(start, start + pageSize);
    return mockSuccess({ total: filtered.length, list });
  }),

  http.put('/api/admin/attempts/:id/review', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const body = (await request.json()) as { solved: 'solved' | 'unsolved'; reject_reason?: string };
    const attempt = mockDb.attempts.find(item => item.id === id);
    if (!attempt) return mockNotFound('未找到该答题审核记录');
    if (attempt.status !== 'pending') return mockConflict('该答题记录已被其他管理员审核');

    attempt.status = body.solved;
    attempt.reject_reason = body.reject_reason || null;
    return mockSuccess({ id: attempt.id, status: attempt.status }, '答题审核状态已更新');
  }),

  // Comments review
  http.get('/api/admin/comments', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const keyword = (url.searchParams.get('keyword') || '').toLowerCase().trim();
    const photoKeyword = (url.searchParams.get('photo_keyword') || '').toLowerCase().trim();
    const userKeyword = (url.searchParams.get('user_keyword') || '').toLowerCase().trim();

    let filtered = mockDb.comments;
    if (status && status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }
    if (keyword) {
      filtered = filtered.filter(
        item => String(item.id).includes(keyword) || item.content.toLowerCase().includes(keyword)
      );
    }
    if (photoKeyword) {
      filtered = filtered.filter(
        item => String(item.photo.id).includes(photoKeyword) || item.photo.title.toLowerCase().includes(photoKeyword)
      );
    }
    if (userKeyword) {
      filtered = filtered.filter(
        item => String(item.user.id).includes(userKeyword) || item.user.nickname.toLowerCase().includes(userKeyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list: AdminCommentListItem[] = filtered.slice(start, start + pageSize);
    return mockSuccess({ total: filtered.length, list });
  }),

  http.put('/api/admin/comments/:id/review', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const body = (await request.json()) as { action: 'approve' | 'reject'; reject_reason?: string };
    const comment = mockDb.comments.find(item => item.id === id);
    if (!comment) return mockNotFound('未找到该评论审核记录');

    comment.status = body.action === 'approve' ? 'approved' : 'rejected';
    comment.reject_reason = body.action === 'reject' ? body.reject_reason || null : null;
    return mockSuccess({ id: comment.id, status: comment.status }, '评论审核状态已更新');
  })
];

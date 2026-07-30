import { http } from 'msw';
import { mockDb } from '../data/db';
import { buildContentPreview, checkRichText, stripHtml } from '../rich-text';
import { checkAdminAuth, mockError, mockSuccess } from '../response';

export const noticeHandlers = [
  http.get('/api/announcements', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const keyword = (url.searchParams.get('keyword') || '').trim();

    let filtered = mockDb.notices;
    if (keyword) {
      filtered = filtered.filter(item => item.title.includes(keyword) || stripHtml(item.content).includes(keyword));
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize).map(item => ({
      id: item.id,
      title: item.title,
      content_preview: buildContentPreview(item.content),
      is_read: false,
      created_at: item.created_at
    }));
    return mockSuccess({ total: filtered.length, unread_count: 0, list });
  }),

  http.get('/api/announcements/:id', ({ params }) => {
    const id = Number(params.id);
    const notice = mockDb.notices.find(item => item.id === id);
    if (!notice) return mockError('公告不存在', 5, 404);
    return mockSuccess({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      image_url: notice.image_url,
      related_type: notice.related_type as any,
      related_id: notice.related_id,
      is_read: true,
      created_at: notice.created_at
    });
  }),

  /** 管理端：通知列表（含 read_count，无 is_read） */
  http.get('/api/admin/announcements', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const keyword = (url.searchParams.get('keyword') || '').trim();

    let filtered = mockDb.notices;
    if (keyword) {
      filtered = filtered.filter(item => item.title.includes(keyword) || stripHtml(item.content).includes(keyword));
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize).map(item => ({
      id: item.id,
      title: item.title,
      content_preview: buildContentPreview(item.content),
      created_at: item.created_at,
      read_count: Math.floor(Math.random() * 50)
    }));
    return mockSuccess({ total: filtered.length, list });
  }),

  /** 管理端：通知详情（含 read_count，读取不标记已读） */
  http.get('/api/admin/announcements/:id', ({ params }) => {
    const id = Number(params.id);
    const notice = mockDb.notices.find(item => item.id === id);
    if (!notice) return mockError('公告不存在', 5, 404);
    return mockSuccess({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      image_url: notice.image_url,
      related_type: notice.related_type as any,
      related_id: notice.related_id,
      created_at: notice.created_at,
      read_count: Math.floor(Math.random() * 50)
    });
  }),

  http.post('/api/admin/announcements', async ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    let title = '';
    let content = '';
    let relatedType: string | undefined;
    let relatedId: number | undefined;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = String(formData.get('title') || '');
      content = String(formData.get('content') || '');
      relatedType = (formData.get('related_type') as string) || undefined;
      relatedId = formData.has('related_id') ? Number(formData.get('related_id')) : undefined;
    } else {
      const body = (await request.json()) as any;
      title = body.title || '';
      content = body.content || '';
      relatedType = body.related_type;
      relatedId = body.related_id;
    }

    if (!title.trim() || !content.trim()) {
      return mockError('标题和内容不能为空');
    }
    const limitError = checkRichText(content);
    if (limitError) return mockError(limitError, 3);

    const newNotice = {
      id: mockDb.notices.length + 1,
      type: 'general',
      title: title.trim(),
      content: content.trim(),
      related_type: relatedType,
      related_id: relatedId,
      created_at: new Date().toISOString()
    };
    mockDb.notices.unshift(newNotice);
    return mockSuccess({ id: newNotice.id, status: 'published' }, '公告已发布成功', 201);
  }),

  http.put('/api/admin/announcements/:id', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const notice = mockDb.notices.find(item => item.id === id);
    if (!notice) return mockError('公告不存在', 5, 404);

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      if (formData.has('title')) notice.title = String(formData.get('title'));
      if (formData.has('content')) {
        const nextContent = String(formData.get('content'));
        const limitError = checkRichText(nextContent);
        if (limitError) return mockError(limitError, 3);
        notice.content = nextContent;
      }
      if (formData.get('remove_relation') === 'true') {
        notice.related_type = undefined;
        notice.related_id = undefined;
      }
    } else {
      const body = (await request.json()) as any;
      if (body.title) notice.title = body.title;
      if (body.content) {
        const limitError = checkRichText(body.content);
        if (limitError) return mockError(limitError, 3);
        notice.content = body.content;
      }
    }

    return mockSuccess({ id: notice.id, status: 'published' }, '公告已更新');
  }),

  http.delete('/api/admin/announcements/:id', ({ params }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const index = mockDb.notices.findIndex(item => item.id === id);
    if (index !== -1) {
      mockDb.notices.splice(index, 1);
    }
    return mockSuccess({ id, status: 'deleted' }, '公告已删除');
  })
];

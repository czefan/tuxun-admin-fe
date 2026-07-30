import { http } from 'msw';
import { mockDb } from '../data/db';
import { checkRichText } from '../rich-text';
import { checkAdminAuth, mockError, mockSuccess } from '../response';

export const contentHandlers = [
  http.get('/api/contents/:key', ({ params }) => {
    const key = String(params.key) as 'popup' | 'score_rules' | 'help';
    const block = mockDb.contents[key];
    if (!block) return mockError('未知内容位 key', 5, 404);
    return mockSuccess(block);
  }),

  http.put('/api/admin/contents/:key', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const key = String(params.key) as 'popup' | 'score_rules' | 'help';
    const block = mockDb.contents[key];
    if (!block) return mockError('未知内容位 key', 5, 404);

    const body = (await request.json()) as { content?: string; related_id?: number };
    if (body.content !== undefined) {
      const limitError = checkRichText(body.content);
      if (limitError) return mockError(limitError, 3);
      block.content = body.content;
    }
    if (key === 'popup') {
      block.related_id = body.related_id;
    }
    block.version += 1;
    block.updated_at = new Date().toISOString();

    return mockSuccess({ key, version: block.version, status: 'success' }, '内容位修改成功');
  })
];

import { http } from 'msw';
import { mockDb } from '../data/db';
import { checkAdminAuth, mockConflict, mockNotFound, mockSuccess } from '../response';

export const mallHandlers = [
  // Goods handlers
  http.get('/api/goods', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const keyword = (url.searchParams.get('keyword') || '').trim().slice(0, 50);

    let filtered = mockDb.goods;
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }
    if (keyword) {
      filtered = filtered.filter(
        item => String(item.id).includes(keyword) || item.name.includes(keyword) || item.description.includes(keyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    return mockSuccess({ total: filtered.length, list: filtered.slice(start, start + pageSize) });
  }),

  http.get('/api/admin/goods', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const keyword = (url.searchParams.get('keyword') || '').trim().slice(0, 50);

    let filtered = mockDb.goods;
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }
    if (keyword) {
      filtered = filtered.filter(
        item => String(item.id).includes(keyword) || item.name.includes(keyword) || item.description.includes(keyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    return mockSuccess({ total: filtered.length, list: filtered.slice(start, start + pageSize) });
  }),

  http.post('/api/admin/goods', async ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const formData = await request.formData();
    const name = String(formData.get('name') || '');
    const description = String(formData.get('description') || '');
    const needScore = Number(formData.get('score_price') || 0);
    const stock = Number(formData.get('stock') || 0);
    const status = (formData.get('status') as 'in_store' | 'out_store') || 'in_store';

    const newGood = {
      id: mockDb.goods.length + 1,
      name,
      description,
      thumb_url: 'https://picsum.photos/200?random=' + Date.now(),
      image_url: 'https://picsum.photos/600?random=' + Date.now(),
      score_price: needScore,
      stock,
      status,
      created_at: new Date().toISOString()
    };
    mockDb.goods.unshift(newGood);
    return mockSuccess({ id: newGood.id, status: newGood.status }, '奖品创建成功', 201);
  }),

  http.put('/api/admin/goods/:id', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const formData = await request.formData();
    const good = mockDb.goods.find(item => item.id === id);
    if (!good) return mockNotFound('未找到要更新的奖品');

    if (formData.has('name')) good.name = String(formData.get('name'));
    if (formData.has('description')) good.description = String(formData.get('description'));
    if (formData.has('score_price')) (good as any).score_price = Number(formData.get('score_price'));
    if (formData.has('stock')) good.stock = Number(formData.get('stock'));
    if (formData.has('status')) good.status = formData.get('status') as 'in_store' | 'out_store';

    return mockSuccess({ id: good.id, status: good.status }, '奖品信息更新成功');
  }),

  http.delete('/api/admin/goods/:id', ({ params }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const index = mockDb.goods.findIndex(item => item.id === id);
    if (index === -1) return mockNotFound('奖品不存在或已被删除');
    mockDb.goods.splice(index, 1);
    return mockSuccess({ id, status: 'deleted' }, '奖品已删除');
  }),

  // Exchange handlers
  http.get('/api/admin/exchange', ({ request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('page_size') || 10);
    const status = url.searchParams.get('status');
    const userKeyword = (url.searchParams.get('user_keyword') || '').toLowerCase().trim();
    const goodKeyword = (url.searchParams.get('good_keyword') || '').toLowerCase().trim();
    const keyword = (url.searchParams.get('keyword') || '').trim();

    let filtered = mockDb.exchanges;
    if (status) filtered = filtered.filter(item => item.status === status);
    if (keyword) filtered = filtered.filter(item => String(item.id).includes(keyword));
    if (userKeyword) {
      filtered = filtered.filter(
        item => String(item.user.id).includes(userKeyword) || item.user.nickname.toLowerCase().includes(userKeyword)
      );
    }
    if (goodKeyword) {
      filtered = filtered.filter(
        item => String(item.good.id).includes(goodKeyword) || item.good.name.toLowerCase().includes(goodKeyword)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id
    );

    const start = (page - 1) * pageSize;
    return mockSuccess({ total: filtered.length, list: filtered.slice(start, start + pageSize) });
  }),

  http.put('/api/admin/exchange/:id/verify', async ({ params, request }) => {
    const authError = checkAdminAuth(2);
    if (authError) return authError;

    const id = Number(params.id);
    const body = (await request.json()) as { action: 'verify' | 'cancel' };
    const exchange = mockDb.exchanges.find(item => item.id === id);
    if (!exchange) return mockNotFound('未找到该兑换记录');
    if (exchange.status !== 'pending') return mockConflict('该兑换记录已被核销或取消');

    exchange.status = body.action === 'verify' ? 'verified' : 'cancelled';
    exchange.exchange_at = new Date().toISOString();
    return mockSuccess(
      { id: exchange.id, status: exchange.status },
      body.action === 'verify' ? '核销成功' : '兑换已取消'
    );
  })
];

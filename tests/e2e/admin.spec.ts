import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function login(page: Page, path = '/home', level = 'L3 超级管理员') {
  await page.goto(path);
  await page.getByRole('button', { name: level, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[?]/g, '\\?')}$`));
}

for (const [path, heading] of [
  ['/home', '图寻后台工作台'],
  ['/review/photos', '投稿审核'],
  ['/review/attempts', '答题审核'],
  ['/review/comments', '评论审核'],
  ['/operation/questions', '题库管理'],
  ['/operation/activities', '活动管理'],
  ['/operation/notice', '通知管理'],
  ['/operation/feedback', '反馈管理'],
  ['/operation/other', '内容位管理'],
  ['/mall/goods', '奖品管理'],
  ['/mall/exchange', '兑换管理'],
  ['/system/users', '用户管理']
]) {
  test(`${path} 登录回跳并正常加载`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await login(page, path);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.locator('.n-spin-body:visible')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('普通用户不能进入后台', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'L1 普通用户', exact: true }).click();
  await expect(page.getByText('当前账号无后台管理权限（需 Level 2 及以上）。', { exact: true })).toBeVisible();
});

test('题库活动筛选使用重复参数', async ({ page }) => {
  const queries: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/api/admin/photos?')) queries.push(request.url());
  });
  await login(page, '/operation/questions?activity_ids=101&activity_ids=102');
  await expect.poll(() => queries.length).toBeGreaterThan(0);
  const params = new URL(queries.at(-1)!).searchParams;
  expect(params.getAll('activity_ids')).toEqual(['101', '102']);
});

test('手工核销码可查单并等待人工确认', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: '扫码核销', exact: true }).click();
  await page.getByPlaceholder('手动输入核销码').fill('EXCH8881');
  await page.getByRole('button', { name: '查询', exact: true }).click();
  await expect(page.getByText('兑换订单确认', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '确认核销', exact: true })).toBeVisible();
});

test('普通管理员不能进入用户管理，也不显示系统菜单', async ({ page }) => {
  await page.goto('/system/users');
  await page.getByRole('button', { name: 'L2 普通管理员', exact: true }).click();
  await expect(page).toHaveURL(/\/403$/);
  await expect(page.getByRole('menuitem', { name: '系统管理', exact: true })).toHaveCount(0);
});

test('切换内容标签保留未提交草稿', async ({ page }) => {
  await login(page, '/operation/other');
  await page.locator('[contenteditable="true"]').fill('未提交的弹窗草稿');
  await page.locator('.n-tabs-tab').filter({ hasText: '积分规则' }).click();
  await page.locator('.n-tabs-tab').filter({ hasText: '通知弹窗' }).click();
  await expect(page.locator('[contenteditable="true"]:visible')).toHaveText('未提交的弹窗草稿');
});

test('结束活动的题目仍可修改', async ({ page }) => {
  await login(page, '/operation/questions');
  await page.getByRole('button', { name: '编辑', exact: true }).first().click();
  await page.getByPlaceholder('请输入题目标题 (最多 20 字)').fill('回归测试题目');
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.getByText('确认修改题目', { exact: true })).toBeVisible();
});

test('通知详情请求失败时禁用发布', async ({ page }) => {
  await login(page, '/operation/notice-form/999999');
  await expect(page.getByText('通知详情加载失败，暂时无法编辑', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '保存并发布', exact: true })).toBeDisabled();
});

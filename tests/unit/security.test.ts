import { describe, expect, it } from 'vitest';
import { sanitizeLoginRedirect } from '@/store/modules/auth/shared';
import { htmlTextLength, sanitizeHtml, validateRichText } from '@/utils/sanitize';

describe('登录回跳与富文本', () => {
  it.each([
    'https://evil.test',
    '//evil.test',
    '/%2fevil.test',
    '/%5cevil.test',
    '/%0aevil.test',
    '/login/callback?code=x',
    '/403',
    '/%'
  ])('拒绝不安全回跳 %s', path => {
    expect(sanitizeLoginRedirect(path)).toBe('/home');
  });
  it('保留合法页面的查询和锚点', () => {
    expect(sanitizeLoginRedirect('/operation/questions?keyword=12:30#list')).toBe(
      '/operation/questions?keyword=12:30#list'
    );
  });
  it('过滤脚本、事件和危险链接协议', () => {
    const html = sanitizeHtml(
      '<script>alert(1)</script><img src="/image.png" onerror="alert(1)"><a href="javascript:alert(1)">test</a>'
    );
    expect(html).not.toMatch(/script|onerror|javascript:/);
  });
  it('保留排版并隔离新窗口', () => {
    const html = sanitizeHtml('<ol start="3"><li><a href="https://example.test">test</a></li></ol>');
    expect(html).toContain('start="3"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
  it('按 Unicode 码点计算可见文字和限额', () => {
    expect(htmlTextLength('<p>你好😀</p>')).toBe(3);
    expect(validateRichText('<p>😀</p>', 1)).toBe('');
    expect(validateRichText('<p>😀😀</p>', 1)).not.toBe('');
  });
});

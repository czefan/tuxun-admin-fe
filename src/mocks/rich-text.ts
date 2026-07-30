/**
 * 富文本正文的 mock 侧校验与派生，算法对齐 api.md 描述的后端行为。
 *
 * 之所以在 mock 里重写一遍而不复用 `@/utils/sanitize`：
 * 那份是「前端提交前的自检」，这份模拟的是「后端收到后的判定」——
 * 两边各自独立才能在 mock 下真实复现前端漏校验时后端返回 400 的情况。
 */

/** 剥离标签后的可见文本 ≤2000 码点 */
export const RICH_TEXT_MAX_TEXT = 2000;
/** 原始 HTML 串 ≤10000 兜底 */
export const RICH_TEXT_MAX_HTML = 10000;

/** 块级标签，剥离时两侧补空格，避免段落文字粘连 */
const BLOCK_TAG_RE = /<\/?(?:p|div|br|hr|h[1-6]|ul|ol|li|blockquote|pre)\b[^>]*>/gi;

/** 按后端口径把富文本转成纯文本：块级标签补空格 → 去掉其余标签 → 合并空白 */
export function stripHtml(html: string): string {
  return html
    .replace(BLOCK_TAG_RE, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 正文长度校验，返回错误文案；空串表示通过 */
export function checkRichText(html: string): string {
  const textLength = [...stripHtml(html)].length;
  if (textLength > RICH_TEXT_MAX_TEXT) {
    return `正文可见文字超出上限（${textLength}/${RICH_TEXT_MAX_TEXT}）`;
  }
  if (html.length > RICH_TEXT_MAX_HTML) {
    return `正文 HTML 长度超出上限（${html.length}/${RICH_TEXT_MAX_HTML}）`;
  }
  return '';
}

/** 通知列表摘要：剥离标签 → 去 [image] 占位 → 合并空白 → 截前 50 字 */
export function buildContentPreview(html: string): string {
  const text = stripHtml(html)
    .replace(/\[image\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return [...text].slice(0, 50).join('');
}

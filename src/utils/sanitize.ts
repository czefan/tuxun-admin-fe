import DOMPurify from 'dompurify';

/**
 * 富文本白名单，与 tiptap StarterKit 能产出的节点 / 标记保持一致。
 *
 * 之所以不直接信任编辑器输出：预览渲染的是「后端返回的」内容，
 * 而不一定是本地编辑器刚生成的 —— 绕过前端直接 POST 到接口的内容同样会走到这里。
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'strong',
  'b',
  'em',
  'i',
  's',
  'u',
  'a',
  'img',
  'span',
  'div'
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'start'];

/**
 * ALLOWED_URI_REGEXP 会对「所有」属性值生效，而不只是 URI 属性。
 * `start="3"` 这类非 URI 取值不在 DOMPurify 默认的 URI_SAFE_ATTRIBUTES 里，
 * 不显式登记就会被误删（target / rel 由下面的 hook 统一接管，不列在这里）。
 */
const URI_SAFE_ATTR = ['start'];

/** 只放行常规链接与图片来源，挡掉 javascript: / data:text/html 等伪协议 */
const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:|tel:|\/|#|data:image\/)/i;

/**
 * 外链一律强制新窗口打开并切断 window.opener 引用。
 *
 * 比保留作者写的 target / rel 更稳妥：正文里的链接指向站外，
 * 漏掉 noopener 会让目标页面拿到 window.opener 反向操纵管理端标签页。
 */
DOMPurify.addHook('afterSanitizeAttributes', node => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * 渲染到 `v-html` 前必须先过这一层。
 *
 * 后台内容（关于我们 / 帮助中心 / 通知正文）由 Level 2 管理员撰写，
 * 却会在 Level 3 超管的浏览器里预览，不过滤等于留了一条管理员之间的越权路径。
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_URI_SAFE_ATTR: URI_SAFE_ATTR,
    ALLOWED_URI_REGEXP
  });
}

/**
 * 富文本正文的字数，口径与 api.md 一致：**纯文本**长度、按 Unicode 码点计数。
 *
 * 直接用 `html.length` 会把标签也算进去，等于用户加几个段落就凭空少了几十字额度，
 * 前端会拦下后端本来接受的内容。
 */
export function htmlTextLength(html: string | null | undefined): number {
  if (!html) return 0;

  // DOMParser 只解析不执行，取 textContent 不存在脚本执行风险
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  return [...text].length;
}

/**
 * 富文本正文限额，四处正文（通知 / 弹窗 / 积分规则 / 帮助中心）统一口径。
 *
 * 两条同时生效，任一超限后端返回 400：
 * - 剥离标签后的可见文本 ≤ 2000 码点（标签不计入）
 * - 原始 HTML 串 ≤ 10000 兜底，防止大量嵌套标签把请求体撑爆
 */
export const RICH_TEXT_MAX_TEXT = 2000;
export const RICH_TEXT_MAX_HTML = 10000;

/**
 * 校验富文本正文是否符合限额。
 *
 * @returns 空串表示通过，否则为可直接展示的错误文案
 */
export function validateRichText(html: string | null | undefined, maxText: number = RICH_TEXT_MAX_TEXT): string {
  const raw = html ?? '';
  const textLength = htmlTextLength(raw);

  if (textLength > maxText) {
    return `正文可见文字 ${textLength} 字，超出上限 ${maxText} 字，无法保存`;
  }
  if (raw.length > RICH_TEXT_MAX_HTML) {
    return `正文格式过于复杂（HTML ${raw.length} 字符，上限 ${RICH_TEXT_MAX_HTML}），请精简排版后重试`;
  }
  return '';
}

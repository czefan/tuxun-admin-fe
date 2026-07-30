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

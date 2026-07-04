export interface QuestionMapPosition {
  x: number;
  y: number;
}

export interface QuestionLocationDetail {
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  mapPosition?: QuestionMapPosition;
}

export interface QuestionDetailRow {
  id: string;
  title: string;
  location: string;
  status: string;
  updatedAt: string;
  imageUrl: string;
  description: string;
  author?: string;
  answerCount?: number;
  locationPoint: QuestionLocationDetail;
}

type QuestionScene = 'gate' | 'library' | 'lake';

export function createQuestionImage(title: string, scene: QuestionScene) {
  const sceneSvgMap: Record<QuestionScene, string> = {
    gate: `
      <rect width="720" height="420" fill="#d7edf5"/>
      <rect y="274" width="720" height="146" fill="#8ba56d"/>
      <path d="M0 292c86-22 144-22 232 0s150 22 248 0 150-22 240 0v128H0z" fill="#6f925d"/>
      <rect x="205" y="142" width="310" height="108" rx="10" fill="#d9c69b"/>
      <rect x="225" y="166" width="270" height="30" rx="6" fill="#9d7b55"/>
      <rect x="246" y="196" width="28" height="88" fill="#7f694d"/>
      <rect x="446" y="196" width="28" height="88" fill="#7f694d"/>
      <path d="M328 282h64v-72h-64z" fill="#8ab6c9"/>
      <circle cx="120" cy="190" r="46" fill="#6f9d76"/>
      <circle cx="596" cy="198" r="54" fill="#69966e"/>
      <circle cx="594" cy="92" r="40" fill="#f0c765"/>
    `,
    library: `
      <rect width="720" height="420" fill="#dbeaf0"/>
      <rect y="292" width="720" height="128" fill="#8c9f78"/>
      <rect x="102" y="112" width="350" height="178" rx="8" fill="#efe7d0"/>
      <rect x="132" y="146" width="62" height="92" fill="#90b6c8"/>
      <rect x="218" y="146" width="62" height="92" fill="#90b6c8"/>
      <rect x="304" y="146" width="62" height="92" fill="#90b6c8"/>
      <rect x="390" y="172" width="38" height="118" fill="#9b7656"/>
      <path d="M480 292c44-78 106-78 150 0" fill="#6f966a"/>
      <path d="M40 316h640" stroke="#c9b68f" stroke-width="18" stroke-linecap="round"/>
      <circle cx="570" cy="90" r="42" fill="#f1cf70"/>
    `,
    lake: `
      <rect width="720" height="420" fill="#d8eef2"/>
      <rect y="238" width="720" height="182" fill="#86b8bf"/>
      <path d="M0 256c90-30 158-30 252 0s155 30 252 0 150-30 216 0v164H0z" fill="#9ccfc9"/>
      <rect x="88" y="196" width="226" height="28" rx="8" fill="#725d4d"/>
      <rect x="110" y="224" width="18" height="72" fill="#624d41"/>
      <rect x="270" y="224" width="18" height="72" fill="#624d41"/>
      <path d="M412 246c62-84 142-84 204 0" fill="#628c68"/>
      <circle cx="560" cy="116" r="46" fill="#efca6a"/>
    `
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420">
      ${sceneSvgMap[scene]}
      <rect x="28" y="342" width="420" height="48" rx="8" fill="rgba(255,255,255,.78)"/>
      <text x="48" y="374" fill="#243226" font-family="Arial" font-size="28" font-weight="700">${title}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

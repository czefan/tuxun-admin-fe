import type { FeedbackMedia, GoodBrief, Media, UserSummary } from '@/service/contract/types';

export interface MockUserSession {
  id: number;
  netid: string;
  username: string;
  nickname: string;
  avatar: string;
  score_count: number;
  level: number;
  status: 'active' | 'banned';
  session_id: string;
  nickname_edits_remaining: number;
  avatar_edits_remaining: number;
}

export interface MockPhoto {
  id: number;
  author: UserSummary;
  title: string;
  description: string;
  image: Media;
  location: { longitude: number; latitude: number; coord_type: 'gcj02' | 'wgs84' | 'bd09' };
  solved?: boolean;
  solves_count: number;
  solved_count: number;
  attempts_count: number;
  likes_count: number;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason: string | null;
  created_at: string;
  activity: { id: number; title: string; start_time: string; end_time: string };
}

export interface MockAttempt {
  id: number;
  user: UserSummary;
  photo: {
    id: number;
    title: string;
    image: Media;
    location: { longitude: number; latitude: number; coord_type: 'gcj02' | 'wgs84' | 'bd09' };
  };
  guess_image: Media;
  guess_location: { longitude: number; latitude: number; coord_type: 'gcj02' | 'wgs84' | 'bd09' };
  distance: number;
  score: number;
  status: 'pending' | 'solved' | 'unsolved';
  reject_reason: string | null;
  created_at: string;
}

export interface MockComment {
  id: number;
  user: UserSummary;
  photo: { id: number; title: string; image: Media };
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason: string | null;
  created_at: string;
}

export interface MockActivity {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  cover_image: Media;
  photo_count: number;
  created_at: string;
}

export interface MockNotice {
  id: number;
  type?: string;
  title: string;
  content: string;
  image?: Media;
  related_type?: string;
  related_id?: number;
  expires_at?: string;
  created_at: string;
}

export interface MockFeedback {
  id: number;
  user: UserSummary;
  phone: string;
  type: 1 | 2 | 3 | 4;
  title: string;
  content: string;
  status: 'pending' | 'resolved';
  medias: FeedbackMedia[];
  created_at: string;
}

export interface MockGood {
  id: number;
  name: string;
  description: string;
  image: Media;
  score_price: number;
  stock: number;
  status: 'in_store' | 'out_store';
  created_at: string;
}

export interface MockExchange {
  id: number;
  verify_code: string;
  user: UserSummary;
  good: GoodBrief;
  quantity: number;
  score_cost: number;
  status: 'pending' | 'verified' | 'cancelled';
  exchange_at: string | null;
  created_at: string;
}

export interface MockUserInfo {
  id: number;
  netid: string;
  name: string;
  username: string;
  nickname: string;
  avatar: string;
  score_count: number;
  level: 1 | 2 | 3;
  status: 'active' | 'banned';
  created_at: string;
}

export interface MockContentBlock {
  key: 'popup' | 'score_rules' | 'help';
  content: string;
  related_id?: number;
  version: number;
  updated_at: string | null;
}

function makeMedia(seed: string | number, w = 800, h = 600): Media {
  const str = String(seed);
  return {
    thumb_url: str ? `https://picsum.photos/seed/${str}/300/200` : '',
    origin_url: str ? `https://picsum.photos/seed/${str}/1200/800` : '',
    width: w,
    height: h
  };
}

function makeSquareMedia(seed: string | number, size = 400): Media {
  const str = String(seed);
  return {
    thumb_url: str ? `https://picsum.photos/seed/${str}/${size}/${size}` : '',
    origin_url: str ? `https://picsum.photos/seed/${str}/800/800` : '',
    width: size,
    height: size
  };
}

function makeFeedbackMedia(seed: string | number, media_type: 1 | 2 = 1, w = 800, h = 600): FeedbackMedia {
  const str = String(seed);
  return {
    media_type,
    thumb_url: str ? `https://picsum.photos/seed/${str}/300/200` : '',
    origin_url: str ? `https://picsum.photos/seed/${str}/1200/800` : '',
    width: w,
    height: h
  };
}

function makeUser(id: number, nickname: string): UserSummary {
  return {
    id,
    netid: `20260000${id}`,
    username: nickname,
    nickname,
    avatar: `https://picsum.photos/100?random=${id}`,
    level: id === 1 ? 3 : 1,
    status: 'active'
  };
}

class MockDatabase {
  session: MockUserSession | null = null;

  users: MockUserInfo[] = [
    {
      id: 1,
      netid: '2026000001',
      name: '张超级',
      username: '张超级',
      nickname: '图寻大导师',
      avatar: 'https://picsum.photos/200?random=admin1',
      score_count: 9999,
      level: 3,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 11,
      netid: '2026000011',
      name: '校园摄影狂',
      username: 'photo_master',
      nickname: '校园摄影狂',
      avatar: 'https://picsum.photos/100?random=11',
      score_count: 1200,
      level: 2,
      status: 'active',
      created_at: '2026-06-01T10:00:00Z'
    },
    {
      id: 12,
      netid: '2026000012',
      name: '陈作弊',
      username: 'chen_cheat',
      nickname: '陈作弊',
      avatar: 'https://picsum.photos/100?random=12',
      score_count: 0,
      level: 1,
      status: 'banned',
      created_at: '2026-06-15T12:00:00Z'
    },
    {
      id: 13,
      netid: '2026000013',
      name: 'A',
      username: 'user_a',
      nickname: 'A',
      avatar: 'https://picsum.photos/100?random=13',
      score_count: 50,
      level: 1,
      status: 'active',
      created_at: '2026-07-01T08:00:00Z'
    },
    {
      id: 15,
      netid: '2026000015',
      name: '十字极限测试用户一二',
      username: 'limit_user_15',
      nickname: '十字极限测试用户一二',
      avatar: 'https://picsum.photos/100?random=15',
      score_count: 500,
      level: 1,
      status: 'active',
      created_at: '2026-07-10T14:00:00Z'
    }
  ];

  photos: MockPhoto[] = [
    {
      id: 1,
      author: makeUser(13, 'A'),
      title: '山',
      description: '',
      image: makeMedia('photo1'),
      location: { longitude: 108.98374, latitude: 34.24623, coord_type: 'gcj02' },
      status: 'pending',
      reject_reason: null,
      solves_count: 0,
      solved_count: 0,
      attempts_count: 0,
      likes_count: 0,
      created_at: '2026-07-22T08:00:00Z',
      activity: {
        id: 1,
        title: '夏日校园打卡挑战赛',
        start_time: '2026-07-01T00:00:00Z',
        end_time: '2026-08-31T23:59:59Z'
      }
    },
    {
      id: 2,
      author: makeUser(15, '十字极限测试用户一二'),
      title: '二十个字极限长度测试题目标题斜角近景特写',
      description:
        '详细描述：从中央图书馆东侧向西看，经过第三棵梧桐树下、左转三十米后看到一座小桥，桥身左下角刻有1956字样。本图片专门用于测试前端页面在面对百字段落描述时的折行与截断效果！',
      image: makeMedia('photo2'),
      location: { longitude: 108.9845, latitude: 34.2471, coord_type: 'gcj02' },
      status: 'pending',
      reject_reason: null,
      solves_count: 0,
      solved_count: 0,
      attempts_count: 0,
      likes_count: 0,
      created_at: '2026-07-22T09:30:00Z',
      activity: {
        id: 1,
        title: '夏日校园打卡挑战赛',
        start_time: '2026-07-01T00:00:00Z',
        end_time: '2026-08-31T23:59:59Z'
      }
    },
    {
      id: 3,
      author: makeUser(11, '校园摄影狂'),
      title: '四大发明广场日晷近景',
      description: '夕阳斜射下的日晷刻度特写。',
      image: makeMedia('photo3'),
      location: { longitude: 108.9822, latitude: 34.2458, coord_type: 'gcj02' },
      status: 'pending',
      reject_reason: null,
      solves_count: 0,
      solved_count: 0,
      attempts_count: 0,
      likes_count: 0,
      created_at: '2026-07-23T11:00:00Z',
      activity: {
        id: 2,
        title: '主校区地标寻踪季',
        start_time: '2026-07-15T00:00:00Z',
        end_time: '2026-09-15T23:59:59Z'
      }
    },
    {
      id: 5,
      author: makeUser(1, '图寻大导师'),
      title: '中央图书馆正门大阶梯',
      description: '官方发布的经典标志性题目。',
      image: makeMedia('photo5'),
      location: { longitude: 108.98374, latitude: 34.24623, coord_type: 'gcj02' },
      status: 'approved',
      reject_reason: null,
      solved: true,
      solves_count: 9999,
      solved_count: 9999,
      attempts_count: 50000,
      likes_count: 88888,
      created_at: '2026-07-20T10:00:00Z',
      activity: {
        id: 1,
        title: '夏日校园打卡挑战赛',
        start_time: '2026-07-01T00:00:00Z',
        end_time: '2026-08-31T23:59:59Z'
      }
    },
    {
      id: 6,
      author: makeUser(1, '图寻大导师'),
      title: '地标雕塑顶部飞天俯瞰',
      description: '仰拍视角下的地标雕塑艺术线条。',
      image: makeMedia('photo6'),
      location: { longitude: 108.9841, latitude: 34.2455, coord_type: 'gcj02' },
      status: 'approved',
      reject_reason: null,
      solved: true,
      solves_count: 3,
      solved_count: 3,
      attempts_count: 8,
      likes_count: 18,
      created_at: '2026-07-21T11:00:00Z',
      activity: {
        id: 1,
        title: '夏日校园打卡挑战赛',
        start_time: '2026-07-01T00:00:00Z',
        end_time: '2026-08-31T23:59:59Z'
      }
    },
    {
      id: 10,
      author: makeUser(12, '陈作弊'),
      title: '网图截图无具体地标',
      description: '网络随便找的风景图。',
      image: makeMedia('photo10'),
      location: { longitude: 108.9, latitude: 34.2, coord_type: 'gcj02' },
      status: 'rejected',
      reject_reason: '由于您上传的照片光线极为昏暗且拍摄角度严重偏离地标主体，且背景含隐私，经判定予以驳回处理！',
      solves_count: 0,
      solved_count: 0,
      attempts_count: 0,
      likes_count: 0,
      created_at: '2026-07-19T10:00:00Z',
      activity: {
        id: 1,
        title: '夏日校园打卡挑战赛',
        start_time: '2026-07-01T00:00:00Z',
        end_time: '2026-08-31T23:59:59Z'
      }
    }
  ];

  attempts: MockAttempt[] = [
    {
      id: 101,
      user: makeUser(13, 'A'),
      photo: {
        id: 1,
        title: '塔',
        image: makeMedia('photo1'),
        location: { longitude: 108.98374, latitude: 34.24623, coord_type: 'gcj02' }
      },
      guess_image: makeMedia('attempt101'),
      guess_location: { longitude: 108.9837, latitude: 34.2462, coord_type: 'gcj02' },
      distance: 120,
      score: 85,
      status: 'pending',
      reject_reason: null,
      created_at: '2026-07-25T10:00:00Z'
    },
    {
      id: 102,
      user: makeUser(15, '十字极限测试用户一二'),
      photo: {
        id: 2,
        title: '二十个字极限长度测试题目标题大阶梯交叉口',
        image: makeMedia('photo2'),
        location: { longitude: 108.9845, latitude: 34.2471, coord_type: 'gcj02' }
      },
      guess_image: makeMedia('attempt102'),
      guess_location: { longitude: 108.9845, latitude: 34.2471, coord_type: 'gcj02' },
      distance: 50,
      score: 95,
      status: 'pending',
      reject_reason: null,
      created_at: '2026-07-25T11:20:00Z'
    },
    {
      id: 104,
      user: makeUser(5, '钱普通'),
      photo: {
        id: 5,
        title: '中央图书馆正门大阶梯',
        image: makeMedia('photo5'),
        location: { longitude: 108.98374, latitude: 34.24623, coord_type: 'gcj02' }
      },
      guess_image: makeMedia('attempt104'),
      guess_location: { longitude: 108.98374, latitude: 34.24623, coord_type: 'gcj02' },
      distance: 5,
      score: 100,
      status: 'solved',
      reject_reason: null,
      created_at: '2026-07-24T09:00:00Z'
    }
  ];

  comments: MockComment[] = [
    {
      id: 201,
      user: makeUser(13, 'A'),
      photo: { id: 1, title: '山', image: makeMedia('photo1') },
      content: '这里风景真好，打卡成功！',
      status: 'pending',
      reject_reason: null,
      created_at: '2026-07-25T12:00:00Z'
    },
    {
      id: 202,
      user: makeUser(12, '陈作弊'),
      photo: { id: 5, title: '中央图书馆正门大阶梯', image: makeMedia('photo5') },
      content: '加微信看合集 13800000000',
      status: 'rejected',
      reject_reason: '包含违规联系方式',
      created_at: '2026-07-25T12:30:00Z'
    }
  ];

  activities: MockActivity[] = [
    {
      id: 1,
      title: '季',
      description: '',
      start_time: '2026-07-01T00:00:00Z',
      end_time: '2026-08-31T23:59:59Z',
      cover_image: makeMedia('act1'),
      photo_count: 10,
      created_at: '2026-06-25T00:00:00Z'
    },
    {
      id: 2,
      title: '二十个字极限长度测试活动标题全域寻踪打卡',
      description: '深入主校区，解锁中央图书馆与地标雕塑后隐藏的风景，探索属于校园学子的独特记忆。',
      start_time: '2026-07-15T00:00:00Z',
      end_time: '2026-09-15T23:59:59Z',
      cover_image: makeMedia('act2'),
      photo_count: 5,
      created_at: '2026-07-10T00:00:00Z'
    }
  ];

  notices: MockNotice[] = [
    {
      id: 1,
      type: 'general',
      title: '新',
      content: '内',
      image: makeMedia('notice1'),
      expires_at: '2026-12-31T23:59:59Z',
      created_at: '2026-07-20T10:00:00Z'
    }
  ];

  feedbacks: MockFeedback[] = [
    {
      id: 1,
      user: makeUser(11, '校园摄影狂'),
      phone: '13800000000',
      type: 1,
      title: '地图加载异常',
      content: '在选择答题点时地图定位偏离了大概 50 米。',
      status: 'pending',
      medias: [makeFeedbackMedia('fb1', 1)],
      created_at: '2026-07-24T16:00:00Z'
    },
    {
      id: 2,
      user: makeUser(15, '十字极限测试用户一二'),
      phone: '13911223344',
      type: 3,
      title: '全景页面动画卡顿实录',
      content: '附带了卡顿现场的录屏视频，请排查渲染性能。',
      status: 'pending',
      medias: [makeFeedbackMedia('fb2', 2)],
      created_at: '2026-07-25T11:30:00Z'
    }
  ];

  goods: MockGood[] = [
    {
      id: 1,
      name: '卡',
      description: '官方一卡通纪念明信片',
      image: makeSquareMedia('g1'),
      score_price: 0,
      stock: 0,
      status: 'in_store',
      created_at: '2026-07-01T10:00:00Z'
    },
    {
      id: 2,
      name: '二十个字极限长度测试奖品名称全套礼盒大包',
      description: '包含徽章、帆布包、限定明信片与主题纪念卡。',
      image: makeSquareMedia('g2'),
      score_price: 99999,
      stock: 999,
      status: 'in_store',
      created_at: '2026-07-05T10:00:00Z'
    },
    {
      id: 3,
      name: '图寻限量版帆布包',
      description: '加厚棉麻面料',
      image: makeSquareMedia('g3'),
      score_price: 500,
      stock: 20,
      status: 'out_store',
      created_at: '2026-07-22T00:00:00Z'
    }
  ];

  exchanges: MockExchange[] = [
    {
      id: 1,
      verify_code: 'EXCH8881',
      user: makeUser(13, 'A'),
      good: { id: 1, name: '卡', score_price: 0, image: makeSquareMedia('g1') },
      quantity: 1,
      score_cost: 0,
      status: 'pending',
      exchange_at: null,
      created_at: '2026-07-25T22:00:00Z'
    },
    {
      id: 2,
      verify_code: 'EXCH8882',
      user: makeUser(15, '十字极限测试用户一二'),
      good: { id: 3, name: '图寻限量版帆布包', score_price: 500, image: makeSquareMedia('g3') },
      quantity: 99,
      score_cost: 49500,
      status: 'verified',
      exchange_at: '2026-07-25T23:30:00Z',
      created_at: '2026-07-25T23:00:00Z'
    },
    {
      id: 3,
      verify_code: 'EXCH8883',
      user: makeUser(11, '校园摄影狂'),
      good: {
        id: 2,
        name: '二十个字极限长度测试奖品名称全套礼盒大包',
        score_price: 99999,
        image: makeSquareMedia('g2')
      },
      quantity: 1,
      score_cost: 99999,
      status: 'pending',
      exchange_at: null,
      created_at: '2026-07-26T18:00:00Z'
    }
  ];

  contentBlocks: Record<string, MockContentBlock> = {
    popup: {
      key: 'popup',
      content: '<p>欢迎使用图寻！</p>',
      related_id: 1,
      version: 1,
      updated_at: '2026-07-20T10:00:00Z'
    },
    score_rules: {
      key: 'score_rules',
      content: '<p>积分规则明细。</p>',
      version: 1,
      updated_at: '2026-07-20T10:00:00Z'
    },
    help: { key: 'help', content: '<p>常见玩法 FAQ 帮助。</p>', version: 1, updated_at: '2026-07-20T10:00:00Z' }
  };

  get contents() {
    return this.contentBlocks;
  }

  findUser(id: number): UserSummary {
    const found = this.users.find(u => u.id === id);
    if (found)
      return {
        id: found.id,
        netid: found.netid,
        username: found.username,
        nickname: found.nickname,
        avatar: found.avatar,
        level: found.level,
        status: found.status
      };
    return makeUser(id, `用户_${id}`);
  }

  loginAs(userId: number) {
    const user = this.users.find(u => u.id === userId);
    return this.establishSession(user);
  }

  loginByNetid(netid: string) {
    const user = this.users.find(u => u.netid === netid);
    return this.establishSession(user);
  }

  private establishSession(user: MockUserInfo | undefined) {
    if (!user) return null;
    this.session = {
      id: user.id,
      netid: user.netid,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      score_count: user.score_count,
      level: user.level,
      status: user.status,
      session_id: `mock-session-${user.id}`,
      nickname_edits_remaining: 3,
      avatar_edits_remaining: 1
    };
    return this.session;
  }
}

export const mockDb = new MockDatabase();

export interface MockUserSession {
  id: number;
  netid: string;
  name: string;
  nickname: string;
  avatar_url: string;
  score_count: number;
  level: number;
}

export interface MockPhoto {
  id: number;
  user_id: number;
  user_nickname?: string;
  title: string;
  description: string;
  longitude?: number;
  latitude?: number;
  coord_type?: string;
  thumb_url: string;
  image_url: string;
  solved?: boolean;
  solves_count?: number;
  solved_count?: number;
  attempts_count?: number;
  likes_count?: number;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason?: string;
  created_at?: string;
  activity?: {
    id: number;
    title: string;
    description: string;
  };
}

export interface MockAttempt {
  id: number;
  user_id: number;
  user_nickname: string;
  question_title: string;
  status: 'pending' | 'solved' | 'unsolved';
  reason?: string;
  created_at: string;
}

export interface MockComment {
  id: number;
  user_id: number;
  user_nickname: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason?: string;
  created_at: string;
}

export interface MockActivity {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  cover_url: string;
  created_at: string;
}

export interface MockNotice {
  id: number;
  type?: string;
  title: string;
  content: string;
  image_url?: string;
  related_type?: string;
  related_id?: number;
  expires_at?: string;
  created_at: string;
}

export interface MockFeedback {
  id: number;
  user_id: number;
  user?: { id: number; nickname: string; avatar_url: string };
  phone: string;
  type: number;
  title: string;
  content: string;
  status: 'pending' | 'resolved';
  medias: Array<{ id: number; media_type: number; url: string }>;
  created_at: string;
}

export interface MockGood {
  id: number;
  name: string;
  description: string;
  thumb_url: string;
  image_url: string;
  score_price: number;
  stock: number;
  status: 'in_store' | 'out_store';
  created_at: string;
}

export interface MockExchange {
  id: number;
  user: { id: number; nickname: string; avatar_url: string };
  good: { id: number; name: string; thumb_url: string; score_price: number; stock: number };
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
  avatar_url: string;
  score_count: number;
  level: number;
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

const defaultSession: MockUserSession = {
  id: 1,
  netid: '2026000001',
  name: '超级管理员',
  nickname: '图寻大导师',
  avatar_url: 'https://picsum.photos/200?random=admin',
  score_count: 9999,
  level: 3
};

class MockDatabase {
  session: MockUserSession | null = { ...defaultSession };

  photos: MockPhoto[] = [
    // 边界 1: 1字极短标题 + 空描述 + 0破解0点赞 (pending)
    {
      id: 1,
      user_id: 13,
      user_nickname: 'A',
      title: '山',
      description: '',
      longitude: 108.98374,
      latitude: 34.24623,
      coord_type: 'gcj02',
      thumb_url: 'https://picsum.photos/seed/photo1/300/200',
      image_url: 'https://picsum.photos/seed/photo1/1200/800',
      status: 'pending',
      solves_count: 0,
      solved_count: 0,
      attempts_count: 0,
      likes_count: 0,
      created_at: '2026-07-22T08:00:00Z',
      activity: { id: 1, title: '夏日校园打卡挑战赛', description: '寻找校园内打卡点' }
    },
    // 边界 2: 恰好 20 字满额标题 (契约上限) + 96字段落描述 + 无图降级 (pending)
    {
      id: 2,
      user_id: 15,
      user_nickname: '十字极限测试用户一二',
      title: '二十个字极限长度测试题目标题斜角近景特写',
      description:
        '详细描述：从中央图书馆东侧向西看，经过第三棵梧桐树下、左转三十米后看到一座小桥，桥身左下角刻有1956字样。本图片专门用于测试前端页面在面对百字段落描述时的折行与截断效果！',
      longitude: 108.9845,
      latitude: 34.2471,
      coord_type: 'gcj02',
      thumb_url: '',
      image_url: '',
      status: 'pending',
      solves_count: 0,
      solved_count: 0,
      attempts_count: 0,
      likes_count: 0,
      created_at: '2026-07-22T09:30:00Z',
      activity: { id: 1, title: '夏日校园打卡挑战赛', description: '寻找校园内打卡点' }
    },
    // 常规数据 (pending)
    {
      id: 3,
      user_id: 11,
      user_nickname: '校园摄影狂',
      title: '四大发明广场日晷近景',
      description: '夕阳斜射下的日晷刻度特写。',
      longitude: 108.9822,
      latitude: 34.2458,
      coord_type: 'gcj02',
      thumb_url: 'https://picsum.photos/seed/photo3/300/200',
      image_url: 'https://picsum.photos/seed/photo3/1200/800',
      status: 'pending',
      solves_count: 0,
      solved_count: 0,
      attempts_count: 0,
      likes_count: 0,
      created_at: '2026-07-23T11:00:00Z',
      activity: { id: 2, title: '主校区地标寻踪季', description: '解锁校园地标' }
    },

    // 边界 3: 极限高数值（9999破解 / 88888点赞） (approved)
    {
      id: 5,
      user_id: 1,
      user_nickname: '官方图寻账号',
      title: '中央图书馆正门大阶梯',
      description: '官方发布的经典标志性题目。',
      longitude: 108.98374,
      latitude: 34.24623,
      coord_type: 'gcj02',
      thumb_url: 'https://picsum.photos/seed/photo5/300/200',
      image_url: 'https://picsum.photos/seed/photo5/1200/800',
      status: 'approved',
      solved: true,
      solves_count: 9999,
      solved_count: 9999,
      attempts_count: 50000,
      likes_count: 88888,
      created_at: '2026-07-20T10:00:00Z',
      activity: { id: 1, title: '夏日校园打卡挑战赛', description: '寻找校园内打卡点' }
    },
    // 常规已通过 (approved)
    {
      id: 6,
      user_id: 1,
      user_nickname: '官方图寻账号',
      title: '地标雕塑顶部飞天俯瞰',
      description: '仰拍视角下的地标雕塑艺术线条。',
      longitude: 108.9841,
      latitude: 34.2455,
      coord_type: 'gcj02',
      thumb_url: 'https://picsum.photos/seed/photo6/300/200',
      image_url: 'https://picsum.photos/seed/photo6/1200/800',
      status: 'approved',
      solved: true,
      solves_count: 3,
      solved_count: 3,
      attempts_count: 8,
      likes_count: 18,
      created_at: '2026-07-21T11:00:00Z',
      activity: { id: 1, title: '夏日校园打卡挑战赛', description: '寻找校园内打卡点' }
    },
    // 边界 4: 恰好 48字驳回原因 (契约上限 ≤50字) (rejected)
    {
      id: 10,
      user_id: 12,
      user_nickname: '陈作弊',
      title: '网图截图无具体地标',
      description: '网络随便找的风景图。',
      longitude: 108.9,
      latitude: 34.2,
      coord_type: 'gcj02',
      thumb_url: 'https://picsum.photos/seed/photo10/300/200',
      image_url: 'https://picsum.photos/seed/photo10/1200/800',
      status: 'rejected',
      reject_reason: '由于您上传的照片光线极为昏暗且拍摄角度严重偏离地标主体，且背景含隐私，经判定予以驳回处理！',
      solves_count: 0,
      solved_count: 0,
      attempts_count: 0,
      likes_count: 0,
      created_at: '2026-07-19T10:00:00Z',
      activity: { id: 1, title: '夏日校园打卡挑战赛', description: '寻找校园内打卡点' }
    }
  ];

  attempts: MockAttempt[] = [
    // 边界 1: 1字极短题目 (pending)
    {
      id: 101,
      user_id: 13,
      user_nickname: 'A',
      question_title: '塔',
      status: 'pending',
      created_at: '2026-07-25T10:00:00Z'
    },
    // 边界 2: 恰好 20 字满额题目名称 (契约上限) (pending)
    {
      id: 102,
      user_id: 15,
      user_nickname: '十字极限测试用户一二',
      question_title: '二十个字极限长度测试题目标题大阶梯交叉口',
      status: 'pending',
      created_at: '2026-07-25T11:20:00Z'
    },
    // 常规正确判定 (solved)
    {
      id: 104,
      user_id: 5,
      user_nickname: '钱普通',
      question_title: '中央图书馆正门大阶梯',
      status: 'solved',
      created_at: '2026-07-24T09:00:00Z'
    },
    // 边界 3: 1字极短驳回原因 vs 恰好 49字驳回原因 (契约上限 ≤50字) (unsolved)
    {
      id: 107,
      user_id: 12,
      user_nickname: '陈作弊',
      question_title: '中央图书馆正门大阶梯',
      status: 'unsolved',
      reason: '定位距离打卡点高达 1850 米，远超系统允许的最大偏差阈值（50米），且主体与实际地标完全不符！',
      created_at: '2026-07-23T12:00:00Z'
    },
    {
      id: 108,
      user_id: 9,
      user_nickname: '郑违规',
      question_title: '山',
      status: 'unsolved',
      reason: '错',
      created_at: '2026-07-23T15:10:00Z'
    }
  ];

  comments: MockComment[] = [
    // 边界 1: 1字极短评论 (pending)
    {
      id: 501,
      user_id: 13,
      user_nickname: 'A',
      content: '好',
      status: 'pending',
      created_at: '2026-07-25T11:00:00Z'
    },
    // 边界 2: 115字段落长评论 (pending)
    {
      id: 502,
      user_id: 15,
      user_nickname: '十字极限测试用户一二',
      content:
        '这绝对是我在整个图寻打卡活动里见过最难找的打卡点了！我和室友在主校区来来回回绕了三整圈，从南门一直走到创新大楼，最后才在藤蔓后面发现了这个极其隐蔽的小侧门。作者这个构图和角度真的绝了，强烈推荐大家去实地感受一下！',
      status: 'pending',
      created_at: '2026-07-25T12:30:00Z'
    },
    // 常规通过评论 (approved)
    {
      id: 504,
      user_id: 5,
      user_nickname: '钱普通',
      content: '打卡成功！风景真的超级漂亮。',
      status: 'approved',
      created_at: '2026-07-24T09:15:00Z'
    },
    // 边界 3: 1字驳回原因 vs 恰好 48字驳回理由 (契约上限 ≤50字) (rejected)
    {
      id: 507,
      user_id: 12,
      user_nickname: '陈作弊',
      content: '答案就在坐标 (108.9837, 34.2462) 处，大家快抄！',
      status: 'rejected',
      reject_reason: '评论内容包含违规引流微信群账号，以及公开剧透经纬度坐标，依据平台文明打卡规则予以驳回！',
      created_at: '2026-07-23T11:00:00Z'
    },
    {
      id: 508,
      user_id: 9,
      user_nickname: '郑违规',
      content: '加微信 xx1234',
      status: 'rejected',
      reject_reason: '水',
      created_at: '2026-07-23T16:30:00Z'
    }
  ];

  activities: MockActivity[] = [
    // 边界 1: 1字极短活动标题与空描述
    {
      id: 1,
      title: '季',
      description: '',
      start_time: '2026-07-01T00:00:00Z',
      end_time: '2026-08-31T23:59:59Z',
      cover_url: 'https://picsum.photos/800/400?random=act1',
      created_at: '2026-06-25T00:00:00Z'
    },
    // 边界 2: 恰好 20 字满额活动标题 (契约上限)
    {
      id: 2,
      title: '二十个字极限长度测试活动标题全域寻踪打卡',
      description: '深入主校区，解锁中央图书馆与地标雕塑后隐藏的风景，探索属于校园学子的独特记忆。',
      start_time: '2026-07-15T00:00:00Z',
      end_time: '2026-09-15T23:59:59Z',
      cover_url: 'https://picsum.photos/800/400?random=act2',
      created_at: '2026-07-10T00:00:00Z'
    },
    // 常规未开始活动 (not_started)
    {
      id: 3,
      title: '秋季新生迎新趣寻地图',
      description: '面向 2026 级新生的校园探索定向越野打卡活动。',
      start_time: '2026-09-01T00:00:00Z',
      end_time: '2026-10-15T23:59:59Z',
      cover_url: 'https://picsum.photos/800/400?random=act3',
      created_at: '2026-07-20T00:00:00Z'
    },
    // 常规已结束活动 (ended)
    {
      id: 4,
      title: '毕业季留影怀旧打卡',
      description: '记录在校最后一刻的回忆打卡图集。',
      start_time: '2026-05-01T00:00:00Z',
      end_time: '2026-06-30T23:59:59Z',
      cover_url: 'https://picsum.photos/800/400?random=act4',
      created_at: '2026-04-20T00:00:00Z'
    }
  ];

  notices: MockNotice[] = [
    // 边界 1: 1字极短标题与内容
    {
      id: 1,
      type: 'general',
      title: '新',
      content: '新',
      created_at: '2026-07-25T12:00:00Z'
    },
    // 边界 2: 恰好 20 字满额通告标题 (契约上限)
    {
      id: 2,
      type: 'general',
      title: '二十个字极限长度测试通告标题服务升级维护',
      content:
        '尊敬的用户：为了保障活动的公平公正，系统将于今晚 24:00 进行全站算法升级。升级后将启用更精准的 WGS84 到 GCJ02 坐标映射与防篡改验证。请广大玩家切勿使用虚拟定位插件。祝大家打卡愉快！',
      image_url: 'https://picsum.photos/800/400?random=notice2',
      related_type: 'activity',
      related_id: 1,
      created_at: '2026-07-22T09:00:00Z'
    }
  ];

  feedbacks: MockFeedback[] = [
    // 边界 1: 1字极短反馈
    {
      id: 1,
      user_id: 13,
      user: { id: 13, nickname: 'A', avatar_url: 'https://picsum.photos/200?random=user13' },
      phone: '13800138000',
      type: 1,
      title: '卡',
      content: '卡',
      status: 'pending',
      medias: [],
      created_at: '2026-07-25T09:00:00Z'
    },
    // 边界 2: 恰好 20 字满额反馈标题 (契约上限)
    {
      id: 2,
      user_id: 6,
      user: { id: 6, nickname: '孙地理', avatar_url: 'https://picsum.photos/200?random=user6' },
      phone: '13911223344',
      type: 3,
      title: '二十个字极限长度测试反馈标题渲染帧率下降',
      content:
        '详细说明：当屏幕分辨率为 3840x2160 时，缩放地图页面会导致 Canvas 频繁重绘，建议在多标记点情况下开启图层聚类（Cluster）和防抖渲染优化，避免低配电脑崩溃。',
      status: 'pending',
      medias: [{ id: 2, media_type: 1, url: 'https://picsum.photos/600/400?random=fb2' }],
      created_at: '2026-07-25T11:30:00Z'
    }
  ];

  goods: MockGood[] = [
    // 边界 1: 1字商品名 + 0积分 + 0库存 (out_store)
    {
      id: 1,
      name: '卡',
      description: '',
      thumb_url: 'https://picsum.photos/200?random=g1',
      image_url: 'https://picsum.photos/600?random=g1',
      score_price: 0,
      stock: 0,
      status: 'out_store',
      created_at: '2026-07-20T00:00:00Z'
    },
    // 边界 2: 恰好 20 字满额商品名 (契约上限)
    {
      id: 2,
      name: '二十个字极限长度测试奖品名称全套礼盒大包',
      description: '包含 12 枚镀金地标徽章、1 本真皮手账本、2 张梧桐书签及专属限定身份证书。',
      thumb_url: 'https://picsum.photos/200?random=g2',
      image_url: 'https://picsum.photos/600?random=g2',
      score_price: 99999,
      stock: 999,
      status: 'in_store',
      created_at: '2026-07-21T00:00:00Z'
    },
    // 常规上架有库存奖品 (in_store)
    {
      id: 3,
      name: '图寻限量版帆布包',
      description: '加厚棉麻面料，印有图寻专属 Logo。',
      thumb_url: 'https://picsum.photos/200?random=g3',
      image_url: 'https://picsum.photos/600?random=g3',
      score_price: 500,
      stock: 20,
      status: 'in_store',
      created_at: '2026-07-22T00:00:00Z'
    }
  ];

  exchanges: MockExchange[] = [
    // 边界 1: 消耗 0 积分 (pending)
    {
      id: 1,
      user: { id: 13, nickname: 'A', avatar_url: 'https://picsum.photos/100?random=user13' },
      good: { id: 1, name: '卡', thumb_url: 'https://picsum.photos/200?random=g1', score_price: 0, stock: 0 },
      quantity: 1,
      score_cost: 0,
      status: 'pending',
      exchange_at: null,
      created_at: '2026-07-25T14:00:00Z'
    },
    // 边界 2: 99 数量大订单 + 49500 极限高消耗积分 (verified)
    {
      id: 2,
      user: { id: 15, nickname: '十字极限测试用户一二', avatar_url: 'https://picsum.photos/100?random=user15' },
      good: {
        id: 3,
        name: '图寻限量版帆布包',
        thumb_url: 'https://picsum.photos/200?random=g3',
        score_price: 500,
        stock: 20
      },
      quantity: 99,
      score_cost: 49500,
      status: 'verified',
      exchange_at: '2026-07-25T15:30:00Z',
      created_at: '2026-07-25T15:00:00Z'
    }
  ];

  users: MockUserInfo[] = [
    {
      id: 1,
      netid: '2026000001',
      name: '张超级',
      username: '张超级',
      nickname: '图寻大导师',
      avatar_url: 'https://picsum.photos/200?random=admin1',
      score_count: 9999,
      level: 3,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 3,
      netid: '2026000003',
      name: '王运营',
      username: '王运营',
      nickname: '运营小萌神',
      avatar_url: 'https://picsum.photos/200?random=op1',
      score_count: 1200,
      level: 2,
      status: 'active',
      created_at: '2026-02-01T00:00:00Z'
    },
    {
      id: 5,
      netid: '2026000005',
      name: '钱普通',
      username: '钱普通',
      nickname: '答题萌新',
      avatar_url: 'https://picsum.photos/200?random=user5',
      score_count: 150,
      level: 1,
      status: 'active',
      created_at: '2026-03-01T00:00:00Z'
    },
    {
      id: 7,
      netid: '2026000007',
      name: '周探索',
      username: '周探索',
      nickname: '探索者小周',
      avatar_url: 'https://picsum.photos/200?random=user7',
      score_count: 640,
      level: 1,
      status: 'active',
      created_at: '2026-03-10T00:00:00Z'
    },
    {
      id: 8,
      netid: '2026000008',
      name: '吴解题',
      username: '吴解题',
      nickname: '解题高手狂魔',
      avatar_url: 'https://picsum.photos/200?random=user8',
      score_count: 430,
      level: 1,
      status: 'active',
      created_at: '2026-03-15T00:00:00Z'
    },

    // 边界 1: 1字姓名 / 1字用户名 / 1字昵称 / 0积分
    {
      id: 13,
      netid: '2026000013',
      name: '王',
      username: '王',
      nickname: 'A',
      avatar_url: 'https://picsum.photos/200?random=user13',
      score_count: 0,
      level: 1,
      status: 'active',
      created_at: '2026-04-01T00:00:00Z'
    },
    // 边界 2: 空姓名 / 空用户名 (0字)
    {
      id: 14,
      netid: '2026000014',
      name: '',
      username: '',
      nickname: '无名氏',
      avatar_url: 'https://picsum.photos/200?random=user14',
      score_count: 0,
      level: 1,
      status: 'active',
      created_at: '2026-04-05T00:00:00Z'
    },
    // 边界 3: 极限长复姓名字 / 满字数昵称 / 999999 极限积分
    {
      id: 15,
      netid: '2026000015',
      name: '欧阳复姓长名字超级测试员',
      username: '欧阳复姓长名字超级测试员',
      nickname: '十字极限测试用户一二',
      avatar_url: 'https://picsum.photos/200?random=user15',
      score_count: 999999,
      level: 2,
      status: 'active',
      created_at: '2026-04-10T00:00:00Z'
    },
    // 边界 4: 封禁账号 / 1字昵称
    {
      id: 9,
      netid: '2026000009',
      name: '郑违规',
      username: '郑违规',
      nickname: '封',
      avatar_url: 'https://picsum.photos/200?random=user9',
      score_count: 0,
      level: 1,
      status: 'banned',
      created_at: '2026-03-20T00:00:00Z'
    }
  ];

  contents: Record<'popup' | 'score_rules' | 'help', MockContentBlock> = {
    popup: {
      key: 'popup',
      content: '<p>欢迎使用图寻小程序！本期“校园风光打卡挑战”活动进行中。</p>',
      related_id: 1,
      version: 1,
      updated_at: '2026-07-25T10:00:00Z'
    },
    score_rules: {
      key: 'score_rules',
      content:
        '<h2>积分获取规则</h2><ul><li>每日签到：+10 积分</li><li>投稿通过：+50 积分</li><li>成功解题：+20 积分</li></ul>',
      version: 1,
      updated_at: '2026-07-25T10:00:00Z'
    },
    help: {
      key: 'help',
      content: '<h2>常见问题 FAQ</h2><p>Q: 如何提交猜测坐标？<br>A: 在地图上点击标记后提交即可。</p>',
      version: 1,
      updated_at: '2026-07-25T10:00:00Z'
    }
  };

  reset(level = 3) {
    this.session = { ...defaultSession, level };
  }

  /**
   * 按 ID 取用户摘要，供各 handler 统一构造 author / user 字段。
   * 找不到时回落成占位用户，避免详情页出现空白作者。
   */
  findUser(userId: number) {
    const user = this.users.find(item => item.id === userId);
    return (
      user ?? {
        id: userId,
        netid: `2026${String(userId).padStart(6, '0')}`,
        name: `用户${userId}`,
        nickname: `用户${userId}`,
        avatar_url: `https://picsum.photos/200?random=${userId}`,
        score_count: 0,
        level: 1,
        status: 'active' as const,
        created_at: '2026-01-01T00:00:00Z'
      }
    );
  }

  /**
   * 按用户 ID 切换登录身份，用于 /test/login 模拟不同等级的管理员。
   * 找不到该用户时返回 null，由调用方决定如何响应。
   */
  loginAs(userId: number) {
    const user = this.users.find(item => item.id === userId);
    if (!user) return null;

    this.session = {
      id: user.id,
      netid: user.netid,
      name: user.name,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      score_count: user.score_count,
      level: user.level
    };
    return this.session;
  }
}

export const mockDb = new MockDatabase();

declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    type UserStatus = 'active' | 'banned';

    type LoginUserSummary = import('@/service/contract/types').LoginResult;

    interface UserInfo {
      id: number;
      netid: string;
      username: string;
      nickname: string;
      avatar: string;
      score_count: number;
      level: number;
      /** 本月剩余昵称修改次数（上限 4，自然月初重置） */
      nickname_edits_remaining: number;
      /** 本月剩余头像修改次数（上限 10，自然月初重置） */
      avatar_edits_remaining: number;
    }
  }
}

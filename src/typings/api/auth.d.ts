declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    type UserStatus = 'active' | 'banned';

    interface LoginUserSummary {
      id: number;
      netid: string;
      username: string;
      nickname: string;
      avatar_url: string;
      level: number;
      status: UserStatus;
    }

    interface UserInfo {
      id: number;
      netid: string;
      username: string;
      nickname: string;
      avatar_url: string;
      score_count: number;
      level: number;
      /** 本月剩余昵称修改次数（上限 4，自然月初重置） */
      nickname_edits_remaining: number;
      /** 本月剩余头像修改次数（上限 10，自然月初重置） */
      avatar_edits_remaining: number;
    }
  }
}

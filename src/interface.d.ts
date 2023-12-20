declare namespace Upload {
  interface PolicyResp {
    platform: 'qiniu' | 'ali';
    config: Omit<Config, 'key'> & { keys: string[] };
  }

  interface Config {
    /** 上传所需token */
    policy: string;
    /** 图片访问域名 */
    domain: string;
    /** 图片访问路径 */
    key: string;
    /** 阿里云上传域名 */
    host?: string;
    signature?: string;
    accessId?: string;
    callback?: string;
    expire?: number;
  }

  type Scene = import('./index').upload;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import request from './request';
import axios from 'axios';

const UPLOAD_DOMAIN_QINIU = "upload.qiniup.com";
export enum UploadScene {
  Rouzao_resource='Rouzao_resource'
}

/**
 * 捕获异步转换为数组对象
 * @param promise 异步函数
 */
async function to<T = any, U = any>(promise: Promise<T>) {
  return promise.then<[U | null, T]>((data) => [null, data], (err) => [err, undefined] as any);
}

/**
 * oss上传 blob
 */
async function uploadOss(file: Blob, config: Upload.Config) {
  const {
    policy,
    domain,
    key,
    signature,
    accessId: OSSAccessKeyId,
    host,
  } = config;
  const signatureData: any = {
    key,
    policy,
    OSSAccessKeyId,
    signature,
    success_action_status: "200", // 让服务端返回200,不然，默认会返回204
  };
  // 组合formdata
  const formData = new FormData();
  Object.keys(signatureData).forEach((k) => {
    formData.append(k, signatureData[k]);
  });
  // warning: file 只能最后一个append，否则上传后识别不到后续参数
  formData.append("file", file);
  return axios
    .create()
    .post(`${host}?key=${key}`, formData)
    .then(
      (res) => {
        if (res?.status === 200) {
          return `//${domain}/${key}`;
        } else {
          return Promise.reject(res);
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );
}

/**
 * 七牛上传 blob
 */
export async function uploadQiniu(
  file: Blob,
  config: Upload.Config
): Promise<string> {
  const { policy: token, key, domain } = config;
  const formData = new FormData();
  formData.append("token", token);
  formData.append("key", key);
  formData.append("file", file);
  // 支付宝小程序内h5请求不发bug修复，加时间戳
  return axios
    .create()
    .post(`//${UPLOAD_DOMAIN_QINIU}?key=${key}`, formData)
    .then(
      (res) => `//${domain}/${res.data.key}`,
      (error: any) => {
        return Promise.reject(error);
      }
    );
}

/**
 * 七牛上传 base64
 */
export function uploadb64Qiniu(
  file: string,
  config: Upload.Config
): Promise<string> {
  const { policy: token, key, domain } = config;
  return axios
    .create()
    .post(
      `//${UPLOAD_DOMAIN_QINIU}/putb64/-1/key/${btoa(key)}`,
      /^data:image/.test(file) ? file.replace(/^.*?,/, "") : file,
      {
        headers: {
          /* prettier-ignore */
          'Authorization': `UpToken ${token}`,
          "content-type": "application/octet-stream",
        },
      }
    )
    .then(
      (res) => `//${domain}/${res.data.key}`,
      (error: any) => {
        return Promise.reject(error);
      }
    );
}

function getUploadKeys(count: number, scene: string, backup: 0 | 1 = 0) {
  return request<any, Upload.PolicyResp>('/web/media/upload/policy', {
    params: { scene, count, backup },
  });
}

export function uploadImageAuto(
  file: Blob,
  scene?: UploadScene,
  backup?: 0 | 1,
  filterErr?: boolean
): Promise<string>;
export function uploadImageAuto(
  file: Blob[] | FileList,
  scene?: UploadScene,
  backup?: 0 | 1,
  filterErr?: true
): Promise<string[]>;
export function uploadImageAuto(
  file: Blob[] | FileList,
  scene?: UploadScene,
  backup?: 0 | 1,
  filterErr?: false
): Promise<
  { succ: boolean; data: string | Blob; index: number; error?: any }[]
>;
/** 图片上传，支持七牛/oss自动切换 */
export async function uploadImageAuto(
  file: Blob | Blob[] | FileList,
  scene = UploadScene.Rouzao_resource,
  backup: 0 | 1 = 0,
  filterErr = true
): Promise<any> {
  const isSingle = !Array.isArray(file);
  const files = Array.from(isSingle ? [file] : file) as Blob[];
  const [cfgErr, cfg] = await to(getUploadKeys(files.length, scene, backup));
  if (cfgErr) {
    console.log(cfgErr);
    return Promise.reject(cfgErr);
  }
  if (cfg.platform !== "ali" && cfg.platform !== "qiniu") {
    return Promise.reject(`未知平台: ${cfg.platform}`);
  }
  const firstRes = await uploadImage(files, cfg);
  const firstFails = firstRes.filter((item) => !item.succ);
  if (firstFails.length) {
    const [_, second] = await to(
      uploadImageAuto(
        firstFails.map((item) => item.data as Blob),
        scene,
        +!backup as 0 | 1,
        false
      )
    );
    console.log('_', _);
    if (second?.length) {
      (second as any[]).map((item, index2) => {
        firstRes[firstFails[index2].index] = item;
      });
    }
  }

  if (isSingle) {
    return firstRes[0].succ
      ? firstRes[0].data
      : Promise.reject(firstRes[0].error);
  }
  if (filterErr) {
    return firstRes
      .map((item) => item.succ && item.data)
      .filter(Boolean) as string[];
  } else {
    return firstRes;
  }
}

async function uploadImage(files: Blob[], cfg: Upload.PolicyResp) {
  const uploadFun = cfg.platform === "qiniu" ? uploadQiniu : uploadOss;
  return Promise.all(
    files.map((file, index) =>
      uploadFun(file, {
        ...cfg.config,
        key: cfg.config.keys[index],
      })
        .then((url) => ({ succ: true, data: url, index, error: undefined }))
        .catch((error) => ({ succ: false, data: file, index, error }))
    )
  );
}

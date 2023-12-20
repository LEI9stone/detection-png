/* eslint-disable @typescript-eslint/no-explicit-any */

import axios, { AxiosRequestConfig } from 'axios';

const axiosConfig: AxiosRequestConfig = {
  baseURL: 'https://api-go.rouzao.com',
  timeout: 30000,
  withCredentials: true,
  responseType: 'json',
};
const request = axios.create(axiosConfig);

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    config.headers['Rouzao-Token'] = '7d851060e06b95b21f1a6cd07f7935a1';
    return config;
  },
  (error) => Promise.reject(error),
);
// 返回状态判断(添加响应拦截器)
request.interceptors.response.use(
  (res) => {
    if (res.status === 200) {
      if (res.config.responseType === 'blob') {
        return res.data;
      }
      if (+res.data.code === 0) {
        return res.data.data;
      }
    }
    const resultError = {
      data: res.data,
      status: res.data.code,
      message: res.data.msg,
    };
    return Promise.reject(resultError);
  },
  (error) => {
    const codeMap: { [key: string]: { msg?: string } } = {
      ERR_CANCELED: {},
      ERR_NETWORK: { msg: '网络不稳定，请重试！' },
      ECONNABORTED: { msg: '接口请求超时，请重试！' },
    };
    if (codeMap[error.code]) {
      // 如果是请求取消 直接拒绝
      return Promise.reject(error);
    }
    const status = error.response && error.response.status;
    const errorResData = error.response && error.response.data;
    let msg = error.message || '出错啦，请重试！';
    if (errorResData && errorResData.error) {
      if (typeof errorResData.error === 'string') {
        msg = errorResData.error;
      } else {
        msg = errorResData.error.message;
      }
    }
    if (errorResData?.message) {
      msg = errorResData.message;
    }
    if (status >= 400 && status < 500) {
      msg = msg || `${status}: 未知错误`;
    }
    if (status >= 500) {
      msg = msg || `${status}: 网络开小差啦，请稍后再试~`;
    }
    const resultError = {
      data: errorResData,
      status,
      message: msg,
    };
    return Promise.reject(resultError);
  },
);

export default request;

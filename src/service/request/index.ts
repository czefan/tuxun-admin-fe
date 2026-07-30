import type { AxiosResponse } from 'axios';
import { createFlatRequest } from '@sa/axios';
import { getServiceBaseURL } from '@/utils/service';
import { getErrorMessage, handleRequestError, showErrorMsg } from './shared';
import type { RequestInstanceState } from './type';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

export const request = createFlatRequest<App.Service.Response<any>, any, RequestInstanceState>(
  {
    baseURL,
    withCredentials: true
  },
  {
    defaultState: {
      errMsgStack: []
    },
    transform(response: AxiosResponse<App.Service.Response<any>>) {
      return response.data.resp;
    },
    async onRequest(config) {
      if (config.data instanceof FormData) {
        config.headers.delete('Content-Type');
      }
      return config;
    },
    isBackendSuccess(response) {
      return Boolean(response.data && response.data.success === true && response.data.code === 0);
    },
    async onBackendFail() {
      return null;
    },
    async onError(error) {
      const handled = await handleRequestError(error);
      if (handled) return;

      showErrorMsg(request.state, getErrorMessage(error));
    }
  }
);

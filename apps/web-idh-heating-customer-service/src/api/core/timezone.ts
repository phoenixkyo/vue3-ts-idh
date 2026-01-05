import { requestClient } from '#/api/request';

/**
 * 获取当前时区
 */
export async function getTimezoneApi() {
  return requestClient.get<string>('/timezone/getTimezone');
}

/**
 * 设置时区
 * @param timezone 时区字符串
 */
export async function setTimezoneApi(timezone: string) {
  return requestClient.post('/timezone/setTimezone', { timezone });
}

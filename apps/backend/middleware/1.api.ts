import { defineEventHandler } from 'h3';
import { sleep } from '~/utils/response';

export default defineEventHandler(async (event) => {
  event.node.res.setHeader(
    'Access-Control-Allow-Origin',
    event.headers.get('Origin') ?? '*',
  );
  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204;
    event.node.res.statusMessage = 'No Content.';
    return 'OK';
  }
  // 移除演示环境禁止修改的限制，允许正常的系统管理操作
  if (event.path.startsWith('/api/system/')) {
    // 仅对系统管理API添加随机延迟，不禁止修改
    await sleep(Math.floor(Math.random() * 500));
  }
});

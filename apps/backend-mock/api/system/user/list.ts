import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const dbManager = await getDBManager();
  const users = dbManager.query('SELECT * FROM idh_user');

  return useResponseSuccess(users);
});
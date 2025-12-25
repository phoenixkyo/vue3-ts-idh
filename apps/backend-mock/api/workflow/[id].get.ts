import { eventHandler, getRouterParam } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    return useResponseError('BadRequestException', 'Workflow Record ID is required');
  }

  const dbManager = await getDBManager();
  try {
    const workflowRecord = dbManager.query(
      'SELECT id, ticket_id, status, operator_id, operator_name, action, notes, created_at FROM idh_workflow WHERE id = ?',
      [id]
    );

    if (workflowRecord.length === 0) {
      return useResponseError('NotFoundException', 'Workflow Record not found');
    }

    return useResponseSuccess(workflowRecord[0]);
  } catch (error) {
    console.error('Error getting workflow record:', error);
    return useResponseError('InternalServerError', 'Failed to get workflow record');
  }
});
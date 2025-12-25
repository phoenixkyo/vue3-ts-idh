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
    return useResponseError('BadRequestException', 'Ticket ID is required');
  }

  const dbManager = await getDBManager();
  try {
    const ticket = dbManager.query(
      'SELECT id, ticket_number, customer_id, type, description, status, creator, processor, created_at, updated_at FROM idh_ticket WHERE id = ?',
      [id]
    );

    if (ticket.length === 0) {
      return useResponseError('NotFoundException', 'Ticket not found');
    }

    return useResponseSuccess(ticket[0]);
  } catch (error) {
    console.error('Error getting ticket:', error);
    return useResponseError('InternalServerError', 'Failed to get ticket');
  }
});
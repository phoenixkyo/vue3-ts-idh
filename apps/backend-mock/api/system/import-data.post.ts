import { eventHandler, readBody } from 'h3';
import { getDBManager } from '~/utils/db-manager';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody(event);
  const { data } = body;

  if (!data) {
    return useResponseError('BadRequestException', 'No data provided');
  }

  const dbManager = await getDBManager();
  try {
    // 开始事务
    dbManager.execute('BEGIN TRANSACTION');

    try {
      // 处理数据导入
      if (data.communities) {
        for (const community of data.communities) {
          dbManager.execute(
            'INSERT OR REPLACE INTO idh_community (id, name, address, building_area, building_count, unit_count, household_count, property_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              community.id,
              community.name,
              community.address,
              community.building_area,
              community.building_count,
              community.unit_count,
              community.household_count,
              community.property_type,
            ],
          );
        }
      }

      if (data.customers) {
        for (const customer of data.customers) {
          dbManager.execute(
            'INSERT OR REPLACE INTO idh_customer (id, community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              customer.id,
              customer.community_id,
              customer.building,
              customer.unit,
              customer.room,
              customer.owner_name,
              customer.phone,
              customer.area,
              customer.heating_season,
              customer.payment_status,
              customer.fee_type,
              customer.should_pay,
              customer.actual_pay,
              customer.arrears,
            ],
          );
        }
      }

      if (data.bills) {
        for (const bill of data.bills) {
          dbManager.execute(
            'INSERT OR REPLACE INTO idh_bill (id, customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              bill.id,
              bill.customer_id,
              bill.heating_season,
              bill.payment_status,
              bill.fee_type,
              bill.should_pay,
              bill.actual_pay,
              bill.arrears,
            ],
          );
        }
      }

      if (data.tickets) {
        for (const ticket of data.tickets) {
          dbManager.execute(
            'INSERT OR REPLACE INTO idh_ticket (id, ticket_number, customer_id, type, description, status, creator, processor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              ticket.id,
              ticket.ticket_number,
              ticket.customer_id,
              ticket.type,
              ticket.description,
              ticket.status,
              ticket.creator,
              ticket.processor,
            ],
          );
        }
      }

      if (data.payment_records) {
        for (const record of data.payment_records) {
          dbManager.execute(
            'INSERT OR REPLACE INTO idh_payment_record (id, customer_id, bill_ids, total_amount, paid_amount, change_amount, payment_method, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              record.id,
              record.customer_id,
              JSON.stringify(record.bill_ids),
              record.total_amount,
              record.paid_amount,
              record.change_amount || 0,
              record.payment_method,
              record.payment_date,
            ],
          );
        }
      }

      if (data.temperature_records) {
        for (const record of data.temperature_records) {
          dbManager.execute(
            'INSERT OR REPLACE INTO idh_temperature_record (id, ticket_id, temperature, temperature_time, customer_id, staff_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              record.id,
              record.ticket_id,
              record.temperature,
              record.temperature_time,
              record.customer_id,
              record.staff_name,
              record.notes,
            ],
          );
        }
      }

      // 提交事务
      dbManager.execute('COMMIT');

      // 保存数据库
      await dbManager.save();

      return useResponseSuccess({ message: 'Data imported successfully' });
    } catch (error) {
      // 回滚事务
      dbManager.execute('ROLLBACK');
      console.error('Error importing data:', error);
      return useResponseError('InternalServerError', 'Failed to import data');
    }
  } catch (error) {
    console.error('Error in import data endpoint:', error);
    return useResponseError(
      'InternalServerError',
      'Failed to process import request',
    );
  }
});

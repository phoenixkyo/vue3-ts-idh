import { getDb } from './utils/db.js';

async function testDatabase() {
  try {
    console.log('开始测试数据库连接...');

    // 获取数据库实例
    const db = await getDb();

    console.log('数据库连接成功');

    // 测试查询
    const result = db.query('SELECT 1 as test');
    console.log('测试查询结果:', result);

    // 测试获取用户表数据
    const users = db.query('SELECT * FROM sys_user LIMIT 5');
    console.log('用户表数据:', users);

    console.log('数据库测试完成');
  } catch (error) {
    console.error('数据库测试失败:', error);
  }
}

testDatabase();

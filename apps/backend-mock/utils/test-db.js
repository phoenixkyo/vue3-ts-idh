const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../data/idh.db');
// 初始化脚本路径
const INIT_SQL_PATH = path.join(__dirname, '../utils/db-init.sql');

// 测试数据库连接和初始化
async function testDB() {
  try {
    console.log('开始测试数据库连接和初始化');
    
    // 初始化sql.js
    const SQL = await initSqlJs();
    
    // 创建新数据库
    const db = new SQL.Database();
    
    // 读取初始化脚本
    const initSql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
    console.log('读取初始化脚本成功');
    
    // 执行初始化脚本
    console.log('开始执行初始化脚本');
    db.exec(initSql);
    console.log('初始化脚本执行成功');
    
    // 查询部门表数据
    const deptResult = db.exec('SELECT * FROM idh_dept');
    console.log('部门表数据:', deptResult[0] ? deptResult[0].values : []);
    
    // 查询角色表数据
    const roleResult = db.exec('SELECT * FROM idh_role');
    console.log('角色表数据:', roleResult[0] ? roleResult[0].values : []);
    
    // 查询用户表数据
    const userResult = db.exec('SELECT * FROM idh_user');
    console.log('用户表数据:', userResult[0] ? userResult[0].values : []);
    
    // 保存数据库到文件
    console.log('开始保存数据库到文件');
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
    console.log('数据库保存成功');
    
    // 关闭数据库
    db.close();
    console.log('数据库测试完成');
  } catch (error) {
    console.error('数据库测试失败:', error);
  }
}

testDB();
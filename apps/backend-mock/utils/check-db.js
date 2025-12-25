const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../data/idh.db');

// 初始化并查询数据库
async function checkDB() {
  try {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);
    
    // 查询用户表数据
    const result = db.exec('SELECT * FROM idh_user');
    console.log('用户表数据:', result[0].values);
    
    // 查询角色表数据
    const rolesResult = db.exec('SELECT * FROM idh_role');
    console.log('角色表数据:', rolesResult[0].values);
    
    // 查询角色用户关系表数据
    const roleUserResult = db.exec('SELECT * FROM idh_role_user');
    console.log('角色用户关系表数据:', roleUserResult[0].values);
    
    db.close();
  } catch (error) {
    console.error('查询数据库失败:', error);
  }
}

checkDB();
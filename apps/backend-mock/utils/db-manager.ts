import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import initSqlJs from 'sql.js';

// 获取当前文件的目录路径（ES模块方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库文件路径
const DB_DIR = join(__dirname, '../data');
const DB_PATH = join(DB_DIR, 'idh.db');

// SQL初始化脚本路径
const INIT_SQL_PATH = join(process.cwd(), 'utils', 'db-init.sql');

// 确保数据目录存在
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

class DBManager {
  private db: any = null;
  private sqlJs: any = null;

  // 关闭数据库
  close() {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
    }
  }

  // 执行SQL语句（不返回结果集）
  execute(sql: string, params: any[] = []) {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    try {
      const stmt = this.db.prepare(sql);
      stmt.run(params);
      stmt.free();
      return { affectedRows: 1 };
    } catch (error) {
      console.error('执行SQL失败:', error);
      throw error;
    }
  }

  // 执行多个SQL语句
  executeBatch(sqls: string[]) {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    try {
      this.db.exec(sqls.join(';'));
      return { affectedRows: sqls.length };
    } catch (error) {
      console.error('执行批量SQL失败:', error);
      throw error;
    }
  }

  // 初始化数据库
  async init() {
    // 加载sql.js
    this.sqlJs = await initSqlJs();

    // 检查数据库文件是否存在
    if (existsSync(DB_PATH)) {
      // 从文件加载数据库
      console.log('数据库文件存在，从文件加载数据库');
      const buffer = readFileSync(DB_PATH);
      this.db = new this.sqlJs.Database(buffer);
    } else {
      // 创建新数据库
      console.log('数据库文件不存在，创建新数据库');
      this.db = new this.sqlJs.Database();
      // 执行初始化脚本
      await this.executeInitScript();
    }

    // 注册数据库保存钩子
    this.registerSaveHook();

    return this;
  }

  // 执行SQL查询（返回结果集）
  query(sql: string, params: any[] = []) {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.getAsObject(params);
      const rows: any[] = [];

      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }

      stmt.free();
      return rows;
    } catch (error) {
      console.error('执行查询失败:', error);
      throw error;
    }
  }

  // 保存数据库到文件
  save() {
    if (this.db) {
      try {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        writeFileSync(DB_PATH, buffer);
        console.log('数据库保存成功');
      } catch (error) {
        console.error('数据库保存失败:', error);
      }
    }
  }

  // 执行初始化脚本
  private async executeInitScript() {
    try {
      const initSql = readFileSync(INIT_SQL_PATH, 'utf8');
      console.log('开始执行初始化脚本');

      // 将SQL脚本按分号分割，逐行执行，以便调试
      const sqlStatements = initSql
        .split(';')
        .filter((statement) => statement.trim() !== '');
      for (const [i, sqlStatement] of sqlStatements.entries()) {
        const statement = sqlStatement.trim();
        if (statement === '') continue;

        console.log(
          `执行第 ${i + 1} 条SQL: ${statement.slice(0, 100)}${statement.length > 100 ? '...' : ''}`,
        );
        try {
          this.db.exec(`${statement};`);
          console.log(`第 ${i + 1} 条SQL执行成功`);

          // 执行完插入语句后，立即保存数据库
          if (statement.startsWith('INSERT')) {
            this.save();
            console.log(`执行第 ${i + 1} 条INSERT语句后保存数据库成功`);
          }

          // 执行完插入语句后，立即查询相关表，看看是否有数据
          if (statement.startsWith('INSERT INTO idh_dept')) {
            const depts = this.query('SELECT * FROM idh_dept');
            console.log('执行部门插入后部门表数据:', depts);
          }
          if (statement.startsWith('INSERT INTO idh_role')) {
            const roles = this.query('SELECT * FROM idh_role');
            console.log('执行角色插入后角色表数据:', roles);
          }
          if (statement.startsWith('INSERT INTO idh_user')) {
            const users = this.query('SELECT * FROM idh_user');
            console.log('执行用户插入后用户表数据:', users);
          }
        } catch (error) {
          console.error(`第 ${i + 1} 条SQL执行失败:`, error);
        }
      }

      // 保存数据库
      this.save();
      console.log('数据库初始化成功');

      // 执行完初始化脚本后，立即查询用户表，看看是否有数据
      const usersAfterInit = this.query('SELECT * FROM idh_user');
      console.log('初始化后用户表数据:', usersAfterInit);

      // 同时查询角色表和部门表，看看是否有数据
      const rolesAfterInit = this.query('SELECT * FROM idh_role');
      console.log('初始化后角色表数据:', rolesAfterInit);

      const deptsAfterInit = this.query('SELECT * FROM idh_dept');
      console.log('初始化后部门表数据:', deptsAfterInit);
    } catch (error) {
      console.error('执行初始化脚本失败:', error);
      throw error;
    }
  }

  // 注册数据库保存钩子
  private registerSaveHook() {
    // 定期保存数据库
    setInterval(() => {
      this.save();
    }, 60_000); // 每分钟保存一次

    // 进程退出时保存数据库
    process.on('exit', () => {
      this.save();
    });

    // 处理SIGINT信号（Ctrl+C）
    process.on('SIGINT', () => {
      this.save();
      process.exit();
    });
  }
}

// 创建单例实例
let dbManagerInstance: DBManager | null = null;

export async function getDBManager() {
  if (!dbManagerInstance) {
    dbManagerInstance = new DBManager();
    await dbManagerInstance.init();
  }
  return dbManagerInstance;
}

// 导出DBManager类
export { DBManager };

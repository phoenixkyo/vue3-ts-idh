import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import initSqlJs from 'sql.js';

// 数据库文件路径
const DB_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'idh.db');

// 确保数据目录存在
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

class Database {
  private static instance: Database;
  private db: any;
  private sqlJs: any;

  private constructor() {
    // 私有构造函数，实现单例模式
  }

  /**
   * 获取数据库实例（单例模式）
   */
  public static async getInstance(): Promise<Database> {
    if (!Database.instance) {
      Database.instance = new Database();
      await Database.instance.init();
    }
    return Database.instance;
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 执行SQL语句（不返回结果集）
   * @param sql SQL语句
   * @param params 参数
   * @returns 受影响的行数
   */
  public execute(sql: string, params: any[] = []): number {
    try {
      const stmt = this.db.prepare(sql);

      // 绑定参数
      if (params.length > 0) {
        stmt.bind(params);
      }

      // 执行语句
      stmt.step();
      const changes = this.db.getRowsModified();

      stmt.free();

      // 保存数据库
      this.saveDatabase();

      return changes;
    } catch (error) {
      console.error('SQL执行失败:', error);
      throw error;
    }
  }

  /**
   * 执行SQL查询（返回结果集）
   * @param sql SQL查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  public query(sql: string, params: any[] = []): any[] {
    try {
      const stmt = this.db.prepare(sql);
      const results: any[] = [];

      // 绑定参数
      if (params.length > 0) {
        stmt.bind(params);
      }

      // 执行查询
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }

      stmt.free();
      return results;
    } catch (error) {
      console.error('SQL查询执行失败:', error);
      throw error;
    }
  }

  /**
   * 重启数据库连接
   */
  public async restart(): Promise<void> {
    this.close();
    await this.init();
  }

  /**
   * 初始化数据库
   */
  private async init(): Promise<void> {
    try {
      // 加载sql.js
      this.sqlJs = await initSqlJs();

      // 检查数据库文件是否存在
      if (existsSync(DB_PATH)) {
        // 如果存在，读取数据库文件
        const dbBuffer = readFileSync(DB_PATH);
        this.db = new this.sqlJs.Database(dbBuffer);
        console.log(`成功加载数据库文件: ${DB_PATH}`);
      } else {
        // 如果不存在，抛出错误
        throw new Error(`数据库文件不存在: ${DB_PATH}`);
      }

      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 保存数据库到文件
   */
  private saveDatabase(): void {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      writeFileSync(DB_PATH, buffer);
    } catch (error) {
      console.error('数据库保存失败:', error);
      throw error;
    }
  }
}

// 导出数据库实例
const getDb = async (): Promise<Database> => {
  return await Database.getInstance();
};

export { Database, getDb };

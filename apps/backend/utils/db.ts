import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import initSqlJs from 'sql.js';

// 数据库文件路径 - 固定为@vben/backend/data/idh.db
// 使用fileURLToPath和import.meta.url获取当前文件的绝对路径
// 这样可以确保在不同环境下都能获取正确的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 从utils目录向上查找，确定backend目录的位置
// 如果当前在apps/backend/.nitro/dev/index.mjs（Nitro构建后）
// 则需要向上查找更多层级
let backendDir = __dirname;
// 查找包含utils目录的backend目录
while (
  !existsSync(join(backendDir, 'utils')) &&
  backendDir !== dirname(backendDir)
) {
  backendDir = dirname(backendDir);
}

const DB_DIR = join(backendDir, 'data');
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
   * 执行SQL语句，使用exec方法，供开启事务时使用（不返回结果集）
   * @param sql SQL语句
   * @param params 参数
   * @returns 受影响的行数
   */
  public exec(sql: string, params: any[] = []): number {
    return this.db.exec(sql, params);
  }

  /**
   * 执行SQL语句，使用prepare和step方法，供普通SQL语句执行时使用，执行完毕后清理prepared statements（不返回结果集）
   * @param sql SQL语句
   * @param params 参数
   * @param inTransaction 是否在事务中执行
   * @returns 受影响的行数
   */
  public execute(
    sql: string,
    params: any[] = [],
    inTransaction: boolean = false,
  ): number {
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
      // 仅在非事务模式下保存数据库
      if (!inTransaction) {
        this.saveDatabase();
      }
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
   * 手动保存数据库到文件
   */
  public saveDB(): void {
    this.saveDatabase();
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
        // 如果不存在，创建新数据库
        console.log(`数据库文件不存在，创建新数据库: ${DB_PATH}`);
        this.db = new this.sqlJs.Database();

        // 读取初始化SQL脚本
        const initSqlPath = join(backendDir, 'utils', 'db-int', 'db-int.sql');
        if (existsSync(initSqlPath)) {
          const initSql = readFileSync(initSqlPath, 'utf8');
          // 执行初始化SQL脚本，使用简单的分号分割（实际生产环境中应该使用更可靠的SQL解析）
          const sqlStatements = initSql
            .split(';')
            .filter((statement) => statement.trim());
          for (const statement of sqlStatements) {
            try {
              this.db.run(statement.trim());
            } catch (error) {
              // 忽略某些可能的错误，如视图创建错误等
              console.warn(`执行SQL语句时出现警告: ${error.message}`);
            }
          }
          // 保存数据库到文件
          this.saveDatabase();
          console.log('数据库初始化脚本执行完成');
        } else {
          console.warn(`初始化SQL脚本不存在: ${initSqlPath}`);
        }
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

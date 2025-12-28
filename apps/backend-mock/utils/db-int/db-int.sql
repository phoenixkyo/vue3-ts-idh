-- ============================================
-- IDH智慧供热客服系统数据库初始化脚本
-- 版本: 2.0
-- 作者：Neo
-- 创建时间: 2025年12月27日
-- ============================================

-- ============================================
-- 开始初始化......
-- ============================================

-- 禁用外键约束（创建表时临时禁用，避免循环引用问题）
PRAGMA foreign_keys = OFF;
-- 设置 WAL 模式提高并发性能
PRAGMA journal_mode = WAL;
-- 设置同步模式（平衡性能和数据安全）
PRAGMA synchronous = NORMAL;
-- 设置缓存大小
PRAGMA cache_size = -2000;   -- 2MB缓存
-- 临时表存储在内存中
PRAGMA temp_store = MEMORY;
-- 设置自动清理
PRAGMA auto_vacuum = INCREMENTAL;
-- 开始事务
BEGIN TRANSACTION;

-- ============================================
-- 系统用户表：存储系统用户信息
-- ============================================

CREATE TABLE IF NOT EXISTS sys_user (
    -- 基础信息
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,           		 -- 用户名
    nickname VARCHAR(50) NOT NULL,                  		 -- 用户昵称
    real_name VARCHAR(50),                          		 -- 真实姓名
    email VARCHAR(100) UNIQUE,                      		 -- 邮箱
    phone VARCHAR(20),                              		 -- 手机号
    avatar TEXT,                                    		 -- 头像地址
	
    -- 密码安全
    password_hash TEXT NOT NULL,                    		 -- 密码哈希 (bcrypt/argon2)
    password_salt TEXT,                             		 -- 密码盐值 (如果使用 PBKDF2)
    password_strength INTEGER DEFAULT 0,            		 -- 密码强度评分 0-100
    password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 密码最后修改时间
	
    -- 状态信息
    status INTEGER DEFAULT 1 NOT NULL,              		 -- 状态 0:禁用 1:启用
	is_system INTEGER DEFAULT 0 NOT NULL,                    -- 是否系统内置 0:否 1:是
    is_deleted INTEGER DEFAULT 0 NOT NULL,          		 -- 删除标记 0:正常 1:删除
    deleted_at DATETIME,                            		 -- 删除时间
    deleted_by INTEGER,                             		 -- 删除人
	
    -- 部门岗位信息
    dept_id INTEGER,                                		 -- 部门ID
    post_id INTEGER,                                		 -- 岗位ID
    employee_no VARCHAR(50),                        		 -- 员工编号
	
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,  -- 创建时间
    created_by INTEGER,                             		 -- 创建人
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,  -- 更新时间
    updated_by INTEGER,                             		 -- 更新人
    version INTEGER DEFAULT 1 NOT NULL,             		 -- 版本号(乐观锁)
	
    -- 登录信息
    last_login_at DATETIME,                         		 -- 最后登录时间
    last_login_ip VARCHAR(45),                      		 -- 最后登录IP
    login_fail_count INTEGER DEFAULT 0,             		 -- 登录失败次数
    locked_until DATETIME,                          		 -- 锁定截止时间
	
    -- 扩展信息
    gender INTEGER DEFAULT 0,                       		 -- 性别 0:未知 1:男 2:女
    birthday DATE,                                 			 -- 生日
    signature TEXT,                                 		 -- 个性签名
    remark TEXT,                                    		 -- 备注
	
    -- 约束
    CHECK (status IN (0, 1)),
	CHECK (is_system IN (0, 1)),
    CHECK (is_deleted IN (0, 1)),
    CHECK (gender IN (0, 1, 2)),
    CHECK (password_strength BETWEEN 0 AND 100),
	
    -- 外键
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_sys_user_username ON sys_user(username);
CREATE INDEX IF NOT EXISTS idx_sys_user_email ON sys_user(email);
CREATE INDEX IF NOT EXISTS idx_sys_user_phone ON sys_user(phone);
CREATE INDEX IF NOT EXISTS idx_sys_user_dept_id ON sys_user(dept_id);
CREATE INDEX IF NOT EXISTS idx_sys_user_post_id ON sys_user(post_id);
CREATE INDEX IF NOT EXISTS idx_sys_user_status ON sys_user(status);
CREATE INDEX IF NOT EXISTS idx_sys_user_is_deleted ON sys_user(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sys_user_created_at ON sys_user(created_at DESC);

-- ============================================
-- 系统角色表：存储角色信息
-- ============================================

CREATE TABLE IF NOT EXISTS sys_role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_key VARCHAR(50) UNIQUE NOT NULL,           -- 角色标识（英文）
    role_name VARCHAR(50) NOT NULL,                 -- 角色名称
    description TEXT,                               -- 角色描述
    data_scope INTEGER DEFAULT 1 NOT NULL,          -- 数据权限范围 1:全部 2:本单位 3:本单位及以下 4:本部门 5:本部门及以下 6:指定部门 7:仅本人
    is_system INTEGER DEFAULT 0 NOT NULL,           -- 是否系统内置 0:否 1:是
	
    -- 状态管理
    status INTEGER DEFAULT 1 NOT NULL,              -- 状态 0:禁用 1:启用
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at DATETIME,
    deleted_by INTEGER,
	
    -- 排序和显示
    sort_order INTEGER DEFAULT 0,                   -- 排序序号
    icon VARCHAR(100),                              -- 角色图标
	
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
	
    -- 约束
    CHECK (status IN (0, 1)),
    CHECK (is_deleted IN (0, 1)),
    CHECK (is_system IN (0, 1)),
    CHECK (data_scope BETWEEN 1 AND 7),
	
    -- 外键
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 角色表索引
CREATE INDEX IF NOT EXISTS idx_sys_role_role_key ON sys_role(role_key);
CREATE INDEX IF NOT EXISTS idx_sys_role_status ON sys_role(status);
CREATE INDEX IF NOT EXISTS idx_sys_role_is_deleted ON sys_role(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sys_role_sort_order ON sys_role(sort_order);

-- ============================================
-- 系统菜单表：存储菜单和按钮权限
-- ============================================

CREATE TABLE IF NOT EXISTS sys_menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER DEFAULT 0 NOT NULL,           -- 父菜单ID，0表示根菜单
    menu_type INTEGER DEFAULT 1 NOT NULL,           -- 菜单类型 1:目录 2:菜单 3:按钮
    menu_name VARCHAR(50) NOT NULL,                 -- 菜单名称
    permission VARCHAR(100),                        -- 权限标识（如：sys:user:add）
	
    -- 路由相关
    path VARCHAR(200),                              -- 路由路径
    component VARCHAR(200),                         -- 组件路径
    redirect VARCHAR(200),                          -- 重定向地址
    external_link VARCHAR(500),                     -- 外链地址
	
    -- 显示相关
    icon VARCHAR(100),                              -- 菜单图标
    sort_order INTEGER DEFAULT 0,                   -- 排序序号
    hidden INTEGER DEFAULT 0 NOT NULL,              -- 是否隐藏 0:显示 1:隐藏
    hide_children INTEGER DEFAULT 0,                -- 是否隐藏子菜单
    keep_alive INTEGER DEFAULT 1,                   -- 是否缓存组件
    affix INTEGER DEFAULT 0,                        -- 是否固定标签页
	
    -- 状态管理
    status INTEGER DEFAULT 1 NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at DATETIME,
    deleted_by INTEGER,
	
    -- 元信息
    meta_title VARCHAR(50),                         -- 页面标题
    meta_ignore_auth INTEGER DEFAULT 0,             -- 是否忽略权限验证
    meta_hide_menu INTEGER DEFAULT 0,               -- 是否隐藏菜单
    meta_order_no INTEGER,                          -- 菜单排序号
    meta_frame_src VARCHAR(500),                    -- 内嵌iframe地址
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 约束
    CHECK (menu_type IN (1, 2, 3)),
    CHECK (status IN (0, 1)),
    CHECK (is_deleted IN (0, 1)),
    CHECK (hidden IN (0, 1)),
    CHECK (hide_children IN (0, 1)),
    CHECK (keep_alive IN (0, 1)),
    CHECK (affix IN (0, 1)),
    CHECK (meta_ignore_auth IN (0, 1)),
    CHECK (meta_hide_menu IN (0, 1)),
    
    -- 外键
    FOREIGN KEY (parent_id) REFERENCES sys_menu(id),
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 菜单表索引
CREATE INDEX IF NOT EXISTS idx_sys_menu_parent_id ON sys_menu(parent_id);
CREATE INDEX IF NOT EXISTS idx_sys_menu_menu_type ON sys_menu(menu_type);
CREATE INDEX IF NOT EXISTS idx_sys_menu_permission ON sys_menu(permission);
CREATE INDEX IF NOT EXISTS idx_sys_menu_path ON sys_menu(path);
CREATE INDEX IF NOT EXISTS idx_sys_menu_status ON sys_menu(status);
CREATE INDEX IF NOT EXISTS idx_sys_menu_is_deleted ON sys_menu(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sys_menu_sort_order ON sys_menu(sort_order);

-- ============================================
-- 系统部门表：组织架构部门信息
-- ============================================

CREATE TABLE IF NOT EXISTS sys_dept (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_code VARCHAR(50) UNIQUE,                   -- 部门编码
    dept_name VARCHAR(50) NOT NULL,                 -- 部门名称
	description TEXT,                               -- 部门描述
    parent_id INTEGER DEFAULT 0 NOT NULL,           -- 父部门ID
    leader_id INTEGER,                              -- 部门负责人ID
    leader_name VARCHAR(50),                        -- 部门负责人姓名
    
    -- 部门信息
    sort_order INTEGER DEFAULT 0,                   -- 排序序号
    dept_level INTEGER DEFAULT 1,                   -- 部门层级
    tree_path VARCHAR(500) DEFAULT '0',             -- 树路径（如：0.1.2）
    ancestors TEXT,                                 -- 祖级列表（JSON数组）
    
    -- 联系信息
    phone VARCHAR(20),                              -- 联系电话
    email VARCHAR(100),                             -- 邮箱
    address TEXT,                                   -- 地址
    
    -- 状态管理
    status INTEGER DEFAULT 1 NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 约束
    CHECK (status IN (0, 1)),
    CHECK (is_deleted IN (0, 1)),
    CHECK (dept_level >= 1),
    
    -- 外键
    FOREIGN KEY (parent_id) REFERENCES sys_dept(id),
    FOREIGN KEY (leader_id) REFERENCES sys_user(id),
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 部门表索引
CREATE INDEX IF NOT EXISTS idx_sys_dept_parent_id ON sys_dept(parent_id);
CREATE INDEX IF NOT EXISTS idx_sys_dept_dept_code ON sys_dept(dept_code);
CREATE INDEX IF NOT EXISTS idx_sys_dept_tree_path ON sys_dept(tree_path);
CREATE INDEX IF NOT EXISTS idx_sys_dept_status ON sys_dept(status);
CREATE INDEX IF NOT EXISTS idx_sys_dept_is_deleted ON sys_dept(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sys_dept_sort_order ON sys_dept(sort_order);

-- ============================================
-- 系统岗位表：存储岗位信息
-- ============================================

CREATE TABLE IF NOT EXISTS sys_post (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_code VARCHAR(50) UNIQUE NOT NULL,          -- 岗位编码
    post_name VARCHAR(50) NOT NULL,                 -- 岗位名称
    description TEXT,                               -- 岗位描述
    
    -- 状态管理
    status INTEGER DEFAULT 1 NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 排序
    sort_order INTEGER DEFAULT 0,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 约束
    CHECK (status IN (0, 1)),
    CHECK (is_deleted IN (0, 1)),
    
    -- 外键
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 岗位表索引
CREATE INDEX IF NOT EXISTS idx_sys_post_post_code ON sys_post(post_code);
CREATE INDEX IF NOT EXISTS idx_sys_post_status ON sys_post(status);
CREATE INDEX IF NOT EXISTS idx_sys_post_is_deleted ON sys_post(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sys_post_sort_order ON sys_post(sort_order);

-- ============================================
-- 系统用户和系统角色多对多关联表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_user_role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    
    -- 状态和审计
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    
    -- 约束
    CHECK (is_deleted IN (0, 1)),
    UNIQUE (user_id, role_id),
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES sys_user(id)
);

-- 用户角色关联索引
CREATE INDEX IF NOT EXISTS idx_sys_user_role_user_id ON sys_user_role(user_id);
CREATE INDEX IF NOT EXISTS idx_sys_user_role_role_id ON sys_user_role(role_id);
CREATE INDEX IF NOT EXISTS idx_sys_user_role_is_deleted ON sys_user_role(is_deleted);

-- ============================================
-- 系统角色和系统菜单多对多关联表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_role_menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    
    -- 权限类型（针对按钮）
    permission_type INTEGER DEFAULT 1,              -- 1:查看 2:新增 3:编辑 4:删除 5:导入 6:导出
    
    -- 状态和审计
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    
    -- 约束
    CHECK (is_deleted IN (0, 1)),
    CHECK (permission_type BETWEEN 1 AND 6),
    UNIQUE (role_id, menu_id, permission_type),
    
    -- 外键
    FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES sys_menu(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES sys_user(id)
);

-- 角色菜单关联索引
CREATE INDEX IF NOT EXISTS idx_sys_role_menu_role_id ON sys_role_menu(role_id);
CREATE INDEX IF NOT EXISTS idx_sys_role_menu_menu_id ON sys_role_menu(menu_id);
CREATE INDEX IF NOT EXISTS idx_sys_role_menu_permission_type ON sys_role_menu(permission_type);
CREATE INDEX IF NOT EXISTS idx_sys_role_menu_is_deleted ON sys_role_menu(is_deleted);

-- ============================================
-- 系统操作日志表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_operation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 用户信息
    user_id INTEGER,
    username VARCHAR(50),
    nickname VARCHAR(50),
    
    -- 操作信息
    module VARCHAR(50) NOT NULL,                   -- 操作模块
    operation_type VARCHAR(20) NOT NULL,           -- 操作类型（CREATE, UPDATE, DELETE, LOGIN等）
    operation_desc TEXT,                           -- 操作描述
    request_method VARCHAR(10),                    -- 请求方法
    request_url TEXT,                              -- 请求URL
    
    -- 请求参数和结果
    request_params TEXT,                           -- 请求参数（JSON格式）
    response_result TEXT,                          -- 响应结果
    status_code INTEGER,                           -- 状态码
    error_message TEXT,                            -- 错误信息
    
    -- 客户端信息
    ip_address VARCHAR(45),                        -- IP地址
    user_agent TEXT,                               -- 用户代理
    location TEXT,                                 -- 地理位置
    
    -- 性能信息
    execution_time INTEGER,                        -- 执行时间（毫秒）
    
    -- 状态和审计
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- 约束
    CHECK (is_deleted IN (0, 1)),
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
);

-- 操作日志索引
CREATE INDEX IF NOT EXISTS idx_sys_log_user_id ON sys_operation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sys_log_operation_type ON sys_operation_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_sys_log_module ON sys_operation_log(module);
CREATE INDEX IF NOT EXISTS idx_sys_log_created_at ON sys_operation_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_log_is_deleted ON sys_operation_log(is_deleted);

-- ============================================
-- 系统字典表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_dict (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 字典信息
    dict_type VARCHAR(50) NOT NULL,                        -- 字典类型
    dict_code VARCHAR(50) NOT NULL,                        -- 字典编码
    dict_value VARCHAR(200) NOT NULL,                      -- 字典值
    dict_label VARCHAR(100) NOT NULL,                      -- 字典标签
    description TEXT,                                      -- 字典描述
    
    -- 显示设置
    sort_order INTEGER DEFAULT 0,                          -- 排序序号
	is_system INTEGER DEFAULT 0,                           -- 是否系统内置
    is_default INTEGER DEFAULT 0,                          -- 是否默认
    css_class VARCHAR(100),                                -- CSS样式
	list_class VARCHAR(100),                               -- 列表样式
    
    -- 状态管理
    status INTEGER DEFAULT 1 NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    
    -- 软删除相关
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 约束
    CHECK (status IN (0, 1)),
    CHECK (is_deleted IN (0, 1)),
    CHECK (is_default IN (0, 1)),
    CHECK (is_system IN (0, 1)),
    UNIQUE (dict_type, dict_code),
    
    -- 外键约束
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 字典表索引
CREATE INDEX IF NOT EXISTS idx_sys_dict_type ON sys_dict(dict_type);
CREATE INDEX IF NOT EXISTS idx_sys_dict_code ON sys_dict(dict_code);
CREATE INDEX IF NOT EXISTS idx_sys_dict_status ON sys_dict(status);
CREATE INDEX IF NOT EXISTS idx_sys_dict_is_deleted ON sys_dict(is_deleted);

-- ============================================
-- 系统文件存储表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_file (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name VARCHAR(255) NOT NULL,               -- 原始文件名
    file_path TEXT NOT NULL,                       -- 存储路径
    file_url TEXT NOT NULL,                        -- 访问URL
    
    -- 文件信息
    file_size INTEGER NOT NULL,                    -- 文件大小（字节）
    file_type VARCHAR(100),                        -- 文件类型
    file_extension VARCHAR(50),                    -- 文件扩展名
    file_hash VARCHAR(64),                         -- 文件哈希值
    
    -- 业务关联
    biz_type VARCHAR(50),                          -- 业务类型（avatar, document等）
    biz_id VARCHAR(100),                           -- 业务ID
    
    -- 状态管理
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at DATETIME,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    
    -- 约束
    CHECK (is_deleted IN (0, 1)),
    
    -- 外键
    FOREIGN KEY (created_by) REFERENCES sys_user(id)
);

-- 文件表索引
CREATE INDEX IF NOT EXISTS idx_sys_file_biz_type ON sys_file(biz_type, biz_id);
CREATE INDEX IF NOT EXISTS idx_sys_file_created_by ON sys_file(created_by);
CREATE INDEX IF NOT EXISTS idx_sys_file_is_deleted ON sys_file(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sys_file_created_at ON sys_file(created_at DESC);

-- ============================================
-- 小区信息表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_community (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基本信息
    community_code VARCHAR(50) UNIQUE NOT NULL,              -- 小区编码
    community_name VARCHAR(100) NOT NULL,                    -- 小区名称
    community_address VARCHAR(200) NOT NULL,                 -- 小区地址
    
    -- 建筑信息
    total_building_area REAL NOT NULL CHECK (total_building_area > 0),  -- 总建筑面积（㎡）
    building_count INTEGER NOT NULL CHECK (building_count > 0),         -- 楼栋数
    unit_count INTEGER NOT NULL CHECK (unit_count > 0),                 -- 单元数
    household_count INTEGER NOT NULL CHECK (household_count > 0),       -- 总户数
    
    -- 分类信息
    community_type VARCHAR(20) NOT NULL DEFAULT 'RESIDENTIAL', -- 小区类型：RESIDENTIAL(住宅), COMMERCIAL(商业), MIXED(混合)
    property_type VARCHAR(20) NOT NULL DEFAULT 'OLD',          -- 物业类型：NEW(新建), OLD(老旧), REFURBISHED(改造)
    
    -- 状态管理
    status INTEGER DEFAULT 1 NOT NULL,                      -- 状态 0:停用 1:启用
    is_deleted INTEGER DEFAULT 0 NOT NULL,                  -- 删除标记 0:正常 1:删除
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,                     -- 版本号(乐观锁)
    
    -- 软删除相关
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 约束
    CHECK (status IN (0, 1)),
    CHECK (is_deleted IN (0, 1)),
    CHECK (community_type IN ('RESIDENTIAL', 'COMMERCIAL', 'MIXED')),
    CHECK (property_type IN ('NEW', 'OLD', 'REFURBISHED')),
    
    -- 外键约束
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 小区索引
CREATE INDEX IF NOT EXISTS idx_idh_community_code ON idh_community(community_code);
CREATE INDEX IF NOT EXISTS idx_idh_community_name ON idh_community(community_name);
CREATE INDEX IF NOT EXISTS idx_idh_community_status ON idh_community(status);
CREATE INDEX IF NOT EXISTS idx_idh_community_is_deleted ON idh_community(is_deleted);
CREATE INDEX IF NOT EXISTS idx_idh_community_created_at ON idh_community(created_at DESC);

-- ============================================
-- 小区配置表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_community_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INTEGER NOT NULL,
    
    -- 计价配置
    heating_unit_price REAL NOT NULL DEFAULT 5.80 CHECK (heating_unit_price > 0),        -- 供暖单价(元/㎡)
    vacant_rate REAL NOT NULL DEFAULT 0.3 CHECK (vacant_rate >= 0 AND vacant_rate <= 1), -- 空置费率(比例)
    discount_rate REAL DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 1),      -- 优惠折扣率
    
    -- 收费配置
    is_default_community INTEGER DEFAULT 0 NOT NULL,                   -- 是否默认小区 0:否 1:是
    change_fund_amount REAL DEFAULT 0 CHECK (change_fund_amount >= 0), -- 备用金总额
    
    -- 业务配置
    heating_season_start_month INTEGER DEFAULT 11,         -- 供暖季开始月份
	heating_season_start_day INTEGER DEFAULT 15,           -- 供暖季开始日期
    heating_season_end_month INTEGER DEFAULT 3,            -- 供暖季结束月份
	heating_season_end_day INTEGER DEFAULT 31,             -- 供暖季结束日期
    payment_deadline_days INTEGER DEFAULT 30,              -- 缴费截止天数
    overdue_fine_rate REAL DEFAULT 0,                      -- 滞纳金费率
    
    -- 状态管理
    status INTEGER DEFAULT 1 NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 软删除相关
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 约束
    CHECK (status IN (0, 1)),
    CHECK (is_deleted IN (0, 1)),
    CHECK (is_default_community IN (0, 1)),
    CHECK (heating_season_start_month BETWEEN 1 AND 12),
	CHECK (heating_season_start_day BETWEEN 1 AND 31),
    CHECK (heating_season_end_month BETWEEN 1 AND 12),
	CHECK (heating_season_end_day BETWEEN 1 AND 31),
    CHECK (payment_deadline_days > 0),
    
    -- 外键约束
    FOREIGN KEY (community_id) REFERENCES idh_community(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id),
    
    -- 唯一约束：一个小区只有一个配置
    UNIQUE (community_id)
);

-- 小区配置索引
CREATE INDEX IF NOT EXISTS idx_idh_community_config_community ON idh_community_config(community_id);
CREATE INDEX IF NOT EXISTS idx_idh_community_config_default ON idh_community_config(is_default_community);
CREATE INDEX IF NOT EXISTS idx_idh_community_config_status ON idh_community_config(status);
CREATE INDEX IF NOT EXISTS idx_idh_community_config_is_deleted ON idh_community_config(is_deleted);

-- ============================================
-- 客户信息表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_customer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 所属小区
    community_id INTEGER NOT NULL,
    
    -- 房屋信息
    building_number VARCHAR(20) NOT NULL,                  -- 楼号
    unit_number VARCHAR(20) NOT NULL,                      -- 单元号
    room_number VARCHAR(20) NOT NULL,                      -- 房号
    floor_number INTEGER,                                  -- 楼层（可选）
    house_type VARCHAR(20) DEFAULT 'RESIDENCE',            -- 户型：RESIDENCE(住宅), APARTMENT(公寓), VILLA(别墅), OFFICE(办公), SHOP(商铺)
    
    -- 面积信息
    heating_area REAL NOT NULL CHECK (heating_area > 0),   -- 供暖面积(㎡)
    building_area REAL,                                    -- 建筑面积(㎡)
    usable_area REAL,                                      -- 使用面积(㎡)
    
    -- 业主信息
    owner_name VARCHAR(50) NOT NULL,                       -- 业主姓名
    owner_gender VARCHAR(10) DEFAULT 'UNKNOWN',            -- 性别：MALE, FEMALE, UNKNOWN
    owner_id_card VARCHAR(18),                             -- 身份证号
    owner_phone VARCHAR(20) NOT NULL,                      -- 联系电话
    owner_phone_backup VARCHAR(20),                        -- 备用电话
    owner_email VARCHAR(100),                              -- 电子邮箱
    owner_address TEXT,                                    -- 联系地址
    
    -- 住户信息（如果与业主不同）
    resident_name VARCHAR(50),                             -- 实际居住人
    resident_phone VARCHAR(20),                            -- 居住人电话
    resident_relationship VARCHAR(20),                     -- 与业主关系
    
    -- 业务状态
    occupancy_status VARCHAR(20) DEFAULT 'OCCUPIED',       -- 居住状态：OCCUPIED(自住), RENTED(出租), VACANT(空置)
    heating_status VARCHAR(20) DEFAULT 'NORMAL',           -- 供暖状态：NORMAL(正常), SUSPENDED(停供), PARTIAL(部分)
    customer_level VARCHAR(20) DEFAULT 'NORMAL',           -- 客户等级：VIP(重要), NORMAL(普通), FOCUS(关注)
    
    -- 状态管理
    status INTEGER DEFAULT 1 NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 软删除相关
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 约束
    CHECK (status IN (0, 1)),
    CHECK (is_deleted IN (0, 1)),
    CHECK (owner_gender IN ('MALE', 'FEMALE', 'UNKNOWN')),
    CHECK (house_type IN ('RESIDENCE', 'APARTMENT', 'VILLA', 'OFFICE', 'SHOP', 'OTHER')),
    CHECK (occupancy_status IN ('OCCUPIED', 'RENTED', 'VACANT', 'OTHER')),
    CHECK (heating_status IN ('NORMAL', 'SUSPENDED', 'PARTIAL', 'OTHER')),
    CHECK (customer_level IN ('VIP', 'NORMAL', 'FOCUS', 'BLACKLIST')),
    
    -- 外键约束
    FOREIGN KEY (community_id) REFERENCES idh_community(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id),
    
    -- 唯一约束：同一小区内房屋唯一
    UNIQUE (community_id, building_number, unit_number, room_number)
);

-- 客户表索引
CREATE INDEX IF NOT EXISTS idx_idh_customer_community ON idh_customer(community_id);
CREATE INDEX IF NOT EXISTS idx_idh_customer_owner_phone ON idh_customer(owner_phone);
CREATE INDEX IF NOT EXISTS idx_idh_customer_owner_name ON idh_customer(owner_name);
CREATE INDEX IF NOT EXISTS idx_idh_customer_occupancy ON idh_customer(occupancy_status);
CREATE INDEX IF NOT EXISTS idx_idh_customer_heating ON idh_customer(heating_status);
CREATE INDEX IF NOT EXISTS idx_idh_customer_status ON idh_customer(status);
CREATE INDEX IF NOT EXISTS idx_idh_customer_is_deleted ON idh_customer(is_deleted);
CREATE INDEX IF NOT EXISTS idx_idh_customer_created_at ON idh_customer(created_at DESC);

-- ============================================
-- 供暖账单表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_heating_bill (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 业务标识
    bill_no VARCHAR(50) UNIQUE NOT NULL,                   -- 账单编号
    customer_id INTEGER NOT NULL,                          -- 客户ID
    
    -- 计费信息
    heating_season VARCHAR(20) NOT NULL,                   -- 供暖季：如2025-2026
    
    -- 费用明细
    heating_area REAL NOT NULL,                            -- 计费面积
    unit_price REAL NOT NULL,                              -- 单价(元/㎡)
    base_amount REAL NOT NULL,                             -- 基础费用
    discount_amount REAL DEFAULT 0,                        -- 优惠金额
    penalty_amount REAL DEFAULT 0,                         -- 违约金
    other_fees REAL DEFAULT 0,                             -- 其他费用
    
    -- 应缴实缴
    should_pay REAL NOT NULL CHECK (should_pay >= 0),      -- 应缴总额
    actual_pay REAL DEFAULT 0 CHECK (actual_pay >= 0),     -- 实缴金额
    arrears REAL DEFAULT 0 CHECK (arrears >= 0),           -- 欠费
    
    -- 缴费信息
    payment_status VARCHAR(20) DEFAULT 'UNPAID',          -- 缴费状态
    payment_method VARCHAR(20),                           -- 支付方式
    payment_date DATE,                                    -- 缴费日期
    payment_transaction_no VARCHAR(100),                  -- 交易流水号
    payment_operator_id INTEGER,                          -- 收费员ID
    
    -- 账单状态
    bill_status VARCHAR(20) DEFAULT 'ACTIVE',             -- 账单状态
    due_date DATE NOT NULL,                               -- 截止日期
    overdue_days INTEGER DEFAULT 0,                       -- 逾期天数
    is_settled INTEGER DEFAULT 0,                         -- 是否已结算
    
    -- 状态管理
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 软删除相关
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 约束
    CHECK (is_deleted IN (0, 1)),
    CHECK (is_settled IN (0, 1)),
    CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'WRITTEN_OFF')),
    CHECK (bill_status IN ('DRAFT', 'ACTIVE', 'OVERDUE', 'SETTLED')),
    CHECK (ABS(should_pay - (base_amount + other_fees - discount_amount + penalty_amount)) < 0.01),
    CHECK (arrears = should_pay - actual_pay),
    
    -- 外键约束
    FOREIGN KEY (customer_id) REFERENCES idh_customer(id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_operator_id) REFERENCES sys_user(id),
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 账单表索引
CREATE INDEX IF NOT EXISTS idx_idh_bill_bill_no ON idh_heating_bill(bill_no);
CREATE INDEX IF NOT EXISTS idx_idh_bill_customer ON idh_heating_bill(customer_id);
CREATE INDEX IF NOT EXISTS idx_idh_bill_heating_season ON idh_heating_bill(heating_season);
CREATE INDEX IF NOT EXISTS idx_idh_bill_payment_status ON idh_heating_bill(payment_status);
CREATE INDEX IF NOT EXISTS idx_idh_bill_due_date ON idh_heating_bill(due_date);
CREATE INDEX IF NOT EXISTS idx_idh_bill_is_settled ON idh_heating_bill(is_settled);
CREATE INDEX IF NOT EXISTS idx_idh_bill_is_deleted ON idh_heating_bill(is_deleted);
CREATE INDEX IF NOT EXISTS idx_idh_bill_created_at ON idh_heating_bill(created_at DESC);

-- ============================================
-- 工单表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_service_ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 工单标识
    ticket_no VARCHAR(50) UNIQUE NOT NULL,                 -- 工单编号
    ticket_title VARCHAR(200) NOT NULL,                    -- 工单标题
    
    -- 关联信息
    customer_id INTEGER NOT NULL,                          -- 客户ID
    related_bill_id INTEGER,                               -- 关联账单ID
    
    -- 工单分类
    ticket_type VARCHAR(20) NOT NULL,                      -- 工单类型
    ticket_priority VARCHAR(20) DEFAULT 'NORMAL',          -- 工单优先级
    
    -- 问题描述
    problem_description TEXT NOT NULL,                     -- 问题描述
    customer_expectation TEXT,                             -- 客户期望
    attachments TEXT,                                      -- 附件列表(JSON格式)
    
    -- 处理信息
    assigned_to INTEGER,                                   -- 指派给(用户ID)
    processor_id INTEGER,                                  -- 实际处理人
    process_start_time DATETIME,                           -- 处理开始时间
    process_end_time DATETIME,                             -- 处理结束时间
    actual_duration INTEGER,                               -- 实际耗时(分钟)
    
    -- 处理结果
    process_result TEXT,                                   -- 处理结果
    process_notes TEXT,                                    -- 处理说明
    customer_feedback TEXT,                                -- 客户反馈
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5), -- 满意度评分
    
    -- 状态跟踪
    ticket_status VARCHAR(20) DEFAULT 'PENDING',           -- 工单状态
    status_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 状态变更时间
    next_followup_time DATETIME,                           -- 下次跟进时间
    
    -- SLA信息
    sla_level VARCHAR(20),                                 -- SLA等级
    response_deadline DATETIME,                            -- 响应截止时间
    resolve_deadline DATETIME,                             -- 解决截止时间
    is_overdue INTEGER DEFAULT 0,                          -- 是否超时
    
    -- 状态管理
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 软删除相关
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 约束
    CHECK (is_deleted IN (0, 1)),
    CHECK (is_overdue IN (0, 1)),
    CHECK (ticket_type IN ('COMPLAINT_SUB', 'COMPLAINT_OB', 'REPAIR', 'CONSULTATION', 'PAYMENT', 'TEMPERATURE', 'OTHER')),
    CHECK (ticket_priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    CHECK (ticket_status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED')),
    CHECK (sla_level IN ('STANDARD', 'PRIORITY', 'VIP')),
    
    -- 外键约束
    FOREIGN KEY (customer_id) REFERENCES idh_customer(id) ON DELETE RESTRICT,
    FOREIGN KEY (related_bill_id) REFERENCES idh_heating_bill(id),
    FOREIGN KEY (assigned_to) REFERENCES sys_user(id),
    FOREIGN KEY (processor_id) REFERENCES sys_user(id),
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 工单表索引
CREATE INDEX IF NOT EXISTS idx_idh_ticket_ticket_no ON idh_service_ticket(ticket_no);
CREATE INDEX IF NOT EXISTS idx_idh_ticket_customer ON idh_service_ticket(customer_id);
CREATE INDEX IF NOT EXISTS idx_idh_ticket_type ON idh_service_ticket(ticket_type);
CREATE INDEX IF NOT EXISTS idx_idh_ticket_status ON idh_service_ticket(ticket_status);
CREATE INDEX IF NOT EXISTS idx_idh_ticket_priority ON idh_service_ticket(ticket_priority);
CREATE INDEX IF NOT EXISTS idx_idh_ticket_assigned_to ON idh_service_ticket(assigned_to);
CREATE INDEX IF NOT EXISTS idx_idh_ticket_created_at ON idh_service_ticket(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idh_ticket_is_deleted ON idh_service_ticket(is_deleted);

-- ============================================
-- 收费记录表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_payment_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 交易标识
    payment_no VARCHAR(50) UNIQUE NOT NULL,                -- 收费单号
    receipt_no VARCHAR(50) UNIQUE,                         -- 收据编号
    transaction_no VARCHAR(100),                           -- 交易流水号
    
    -- 关联信息
    customer_id INTEGER NOT NULL,                          -- 客户ID
    collector_id INTEGER NOT NULL,                         -- 收费员ID
    
    -- 账单信息
    related_bill_ids TEXT NOT NULL,                        -- 关联账单IDs(JSON数组)
    bill_count INTEGER NOT NULL CHECK (bill_count > 0),    -- 账单数量
    
    -- 金额信息
    should_pay NUMERIC(12, 2) NOT NULL CHECK (should_pay > 0),         -- 应缴总额
    actual_receipt NUMERIC(12, 2) NOT NULL CHECK (actual_receipt > 0), -- 实收金额
    discount_amount NUMERIC(12, 2) DEFAULT 0,              -- 优惠金额
    penalty_amount NUMERIC(12, 2) DEFAULT 0,               -- 违约金
    should_change NUMERIC(12, 2) DEFAULT 0,                -- 应找(元)
	actual_change NUMERIC(12, 2) DEFAULT 0,                -- 实找(元)
    change_loss NUMERIC(12, 2) DEFAULT 0,                  -- 找零损耗(元)
    
    -- 支付信息
    payment_method VARCHAR(20) NOT NULL,                   -- 支付方式
    payment_channel VARCHAR(50),                           -- 支付渠道
    payment_account VARCHAR(100),                          -- 支付账号
    payment_date DATE NOT NULL,                            -- 缴费日期
    payment_time TIME NOT NULL,                            -- 缴费时间
    
    -- 收据信息
    is_receipt_issued INTEGER DEFAULT 0,                   -- 是否已开票
    receipt_issued_at DATETIME,                            -- 开票时间
    receipt_issued_by INTEGER,                             -- 开票人
    
    -- 状态管理
    pay_status VARCHAR(20) DEFAULT 'COMPLETED',            -- 支付状态
    reconciliation_status VARCHAR(20) DEFAULT 'PENDING',   -- 对账状态
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 软删除相关
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 备注
    remark TEXT,                                           -- 备注信息
    operator_notes TEXT,                                   -- 操作员备注
    
    -- 约束
    CHECK (is_deleted IN (0, 1)),
    CHECK (is_receipt_issued IN (0, 1)),
    CHECK (payment_method IN ('CASH', 'WECHAT', 'ALIPAY', 'BANK_CARD', 'BANK_TRANSFER', 'OTHER')),
    CHECK (pay_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIAL')),
    CHECK (reconciliation_status IN ('PENDING', 'RECONCILED', 'DISCREPANCY', 'ADJUSTED')),
    
    -- 外键约束
    FOREIGN KEY (customer_id) REFERENCES idh_customer(id) ON DELETE RESTRICT,
    FOREIGN KEY (collector_id) REFERENCES sys_user(id),
    FOREIGN KEY (receipt_issued_by) REFERENCES sys_user(id),
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 收费记录表索引
CREATE INDEX IF NOT EXISTS idx_idh_payment_payment_no ON idh_payment_record(payment_no);
CREATE INDEX IF NOT EXISTS idx_idh_payment_receipt_no ON idh_payment_record(receipt_no);
CREATE INDEX IF NOT EXISTS idx_idh_payment_customer ON idh_payment_record(customer_id);
CREATE INDEX IF NOT EXISTS idx_idh_payment_collector ON idh_payment_record(collector_id);
CREATE INDEX IF NOT EXISTS idx_idh_payment_date ON idh_payment_record(payment_date);
CREATE INDEX IF NOT EXISTS idx_idh_payment_method ON idh_payment_record(payment_method);
CREATE INDEX IF NOT EXISTS idx_idh_pay_status ON idh_payment_record(pay_status);
CREATE INDEX IF NOT EXISTS idx_idh_payment_is_deleted ON idh_payment_record(is_deleted);
CREATE INDEX IF NOT EXISTS idx_idh_payment_created_at ON idh_payment_record(created_at DESC);

-- ============================================
-- 资金存现表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_fund_deposit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 业务标识
    deposit_no VARCHAR(50) UNIQUE NOT NULL,                -- 存现单号
    community_id INTEGER NOT NULL,                         -- 小区ID
    
    -- 存现信息
    deposit_date DATE NOT NULL,                            -- 存现日期
    bank_name VARCHAR(100) NOT NULL,                       -- 银行名称
    bank_account VARCHAR(100),                             -- 银行账号
    deposit_amount NUMERIC(12, 2) NOT NULL CHECK (deposit_amount > 0), -- 存现金额
    
    -- 经办信息
    depositor_id INTEGER NOT NULL,                         -- 存现人ID
    verifier_id INTEGER,                                   -- 审核人ID
    deposit_time TIME NOT NULL,                            -- 存现时间
    
    -- 状态管理
    deposit_status VARCHAR(20) DEFAULT 'PENDING',          -- 存现状态
    verification_status VARCHAR(20) DEFAULT 'PENDING',     -- 审核状态
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 软删除相关
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 备注
    remark TEXT,                                           -- 备注信息
    verification_notes TEXT,                               -- 审核备注
    
    -- 约束
    CHECK (is_deleted IN (0, 1)),
    CHECK (deposit_status IN ('PENDING', 'DEPOSITED', 'CONFIRMED', 'CANCELLED')),
    CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED', 'ADJUSTED')),
    
    -- 外键约束
    FOREIGN KEY (community_id) REFERENCES idh_community(id) ON DELETE RESTRICT,
    FOREIGN KEY (depositor_id) REFERENCES sys_user(id),
    FOREIGN KEY (verifier_id) REFERENCES sys_user(id),
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 资金存现表索引
CREATE INDEX IF NOT EXISTS idx_idh_deposit_deposit_no ON idh_fund_deposit(deposit_no);
CREATE INDEX IF NOT EXISTS idx_idh_deposit_community ON idh_fund_deposit(community_id);
CREATE INDEX IF NOT EXISTS idx_idh_deposit_date ON idh_fund_deposit(deposit_date);
CREATE INDEX IF NOT EXISTS idx_idh_deposit_depositor ON idh_fund_deposit(depositor_id);
CREATE INDEX IF NOT EXISTS idx_idh_deposit_status ON idh_fund_deposit(deposit_status);
CREATE INDEX IF NOT EXISTS idx_idh_deposit_is_deleted ON idh_fund_deposit(is_deleted);
CREATE INDEX IF NOT EXISTS idx_idh_deposit_created_at ON idh_fund_deposit(created_at DESC);

-- ============================================
-- 测温记录表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_temperature_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 关联信息
    ticket_id INTEGER NOT NULL,                            -- 工单ID
    customer_id INTEGER NOT NULL,                          -- 客户ID
    technician_id INTEGER NOT NULL,                        -- 测温人员ID
    
    -- 测温信息
    measurement_date DATE NOT NULL,                        -- 测温日期
    measurement_time TIME NOT NULL,                        -- 测温时间
    measurement_location VARCHAR(100) NOT NULL,            -- 测温地点
    outdoor_temperature REAL,                              -- 室外温度
    weather_condition VARCHAR(50),                         -- 天气状况
    
    -- 温度记录(JSON格式存储详细数据)
    temperature_data TEXT NOT NULL,                        -- 温度数据(JSON)
    avg_temperature REAL NOT NULL,                         -- 平均温度
    min_temperature REAL NOT NULL,                         -- 最低温度
    max_temperature REAL NOT NULL,                         -- 最高温度
    
    -- 设备信息
    device_model VARCHAR(100),                             -- 测温设备型号
    device_sn VARCHAR(100),                                -- 设备序列号
    calibration_date DATE,                                 -- 校准日期
    
    -- 评估结果
    evaluation_result VARCHAR(20) NOT NULL,                -- 测温评估结果
    qualification_status VARCHAR(20) NOT NULL,             -- 测温是否达标
    adjustment_suggestion TEXT,                            -- 调整建议
    followup_action TEXT,                                  -- 后续措施
    
    -- 状态管理
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    
    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by INTEGER,
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- 软删除相关
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- 备注
    remarks TEXT,                                          -- 备注信息
    customer_signature TEXT,                               -- 客户签字(图片路径或base64)
    
    -- 约束
    CHECK (is_deleted IN (0, 1)),
    CHECK (evaluation_result IN ('PENDING', 'QUALIFIED', 'UNQUALIFIED', 'BORDERLINE')),
    CHECK (qualification_status IN ('PASS', 'FAIL', 'CONDITIONAL_PASS')),
    CHECK (avg_temperature BETWEEN -50 AND 50),
    CHECK (min_temperature <= avg_temperature),
    CHECK (max_temperature >= avg_temperature),
    
    -- 外键约束
    FOREIGN KEY (ticket_id) REFERENCES idh_service_ticket(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES idh_customer(id) ON DELETE RESTRICT,
    FOREIGN KEY (technician_id) REFERENCES sys_user(id),
    FOREIGN KEY (created_by) REFERENCES sys_user(id),
    FOREIGN KEY (updated_by) REFERENCES sys_user(id),
    FOREIGN KEY (deleted_by) REFERENCES sys_user(id)
);

-- 测温记录表索引
CREATE INDEX IF NOT EXISTS idx_idh_temp_ticket ON idh_temperature_record(ticket_id);
CREATE INDEX IF NOT EXISTS idx_idh_temp_customer ON idh_temperature_record(customer_id);
CREATE INDEX IF NOT EXISTS idx_idh_temp_date ON idh_temperature_record(measurement_date);
CREATE INDEX IF NOT EXISTS idx_idh_temp_technician ON idh_temperature_record(technician_id);
CREATE INDEX IF NOT EXISTS idx_idh_temp_evaluation ON idh_temperature_record(evaluation_result);
CREATE INDEX IF NOT EXISTS idx_idh_temp_is_deleted ON idh_temperature_record(is_deleted);
CREATE INDEX IF NOT EXISTS idx_idh_temp_created_at ON idh_temperature_record(created_at DESC);

-- ============================================
-- 视图定义（方便查询）
-- ============================================

-- 用户详情视图（包含部门、岗位信息）
CREATE VIEW IF NOT EXISTS v_user_detail AS
SELECT 
    u.id,
    u.username,
    u.nickname,
    u.real_name,
    u.email,
    u.phone,
    u.avatar,
    u.status as user_status,
    u.last_login_at,
    u.last_login_ip,
    
    -- 部门信息
    d.id as dept_id,
    d.dept_name,
    d.dept_code,
    d.parent_id as dept_parent_id,
    d.tree_path as dept_tree_path,
    d.leader_id as dept_leader_id,
    d.leader_name as dept_leader_name,
    
    -- 岗位信息
    p.id as post_id,
    p.post_code,
    p.post_name,
    
    -- 角色信息（聚合）
    (
        SELECT GROUP_CONCAT(r.role_key, '|')
        FROM sys_role r
        JOIN sys_user_role ur ON r.id = ur.role_id
        WHERE ur.user_id = u.id AND ur.is_deleted = 0 AND r.is_deleted = 0
    ) as role_keys,
    
    (
        SELECT GROUP_CONCAT(r.role_name, ', ')
        FROM sys_role r
        JOIN sys_user_role ur ON r.id = ur.role_id
        WHERE ur.user_id = u.id AND ur.is_deleted = 0 AND r.is_deleted = 0
    ) as role_names,
    
    -- 审计字段
    u.created_at,
    u.updated_at
    
FROM sys_user u
LEFT JOIN sys_dept d ON u.dept_id = d.id AND d.is_deleted = 0
LEFT JOIN sys_post p ON u.post_id = p.id AND p.is_deleted = 0
WHERE u.is_deleted = 0;

-- 角色菜单权限视图
CREATE VIEW IF NOT EXISTS v_role_menu_permission AS
SELECT 
    r.id as role_id,
    r.role_key,
    r.role_name,
    r.data_scope,
    
    m.id as menu_id,
    m.parent_id,
    m.menu_type,
    m.menu_name,
    m.permission,
    m.path,
    m.component,
    m.icon,
    m.sort_order,
    m.hidden,
    m.meta_title,
    m.meta_ignore_auth,
    m.meta_hide_menu,
    
    rm.permission_type,
    
    -- 构建完整的权限标识
    CASE 
        WHEN m.menu_type = 3 THEN m.permission || ':' || rm.permission_type
        ELSE m.permission
    END as full_permission
    
FROM sys_role r
JOIN sys_role_menu rm ON r.id = rm.role_id AND rm.is_deleted = 0
JOIN sys_menu m ON rm.menu_id = m.id AND m.is_deleted = 0
WHERE r.is_deleted = 0 AND r.status = 1
ORDER BY r.sort_order, m.sort_order;

-- 部门树形结构视图
CREATE VIEW IF NOT EXISTS v_dept_tree AS
WITH RECURSIVE dept_tree AS (
    -- 顶级部门
    SELECT 
        id,
        dept_name,
        dept_code,
        parent_id,
        tree_path,
        1 as level,
        dept_name as full_name,
        leader_name
    FROM sys_dept 
    WHERE parent_id = 0 AND is_deleted = 0
    
    UNION ALL
    
    -- 递归查询子部门
    SELECT 
        d.id,
        d.dept_name,
        d.dept_code,
        d.parent_id,
        d.tree_path,
        dt.level + 1,
        dt.full_name || ' / ' || d.dept_name,
        d.leader_name
    FROM sys_dept d
    JOIN dept_tree dt ON d.parent_id = dt.id
    WHERE d.is_deleted = 0
)
SELECT * FROM dept_tree ORDER BY tree_path, sort_order;

-- 客户详情视图
CREATE VIEW IF NOT EXISTS v_customer_detail AS
SELECT 
    c.*,
    com.community_name,
    com.community_address,
    com.community_type,
    com.property_type,
    conf.heating_unit_price,
    conf.vacant_rate
FROM idh_customer c
LEFT JOIN idh_community com ON c.community_id = com.id AND com.is_deleted = 0
LEFT JOIN idh_community_config conf ON c.community_id = conf.community_id AND conf.is_deleted = 0
WHERE c.is_deleted = 0 AND c.status = 1;

-- 账单汇总视图
CREATE VIEW IF NOT EXISTS v_bill_summary AS
SELECT 
    b.*,
    c.owner_name,
    c.owner_phone,
    c.building_number,
    c.unit_number,
    c.room_number,
    com.community_name,
    CASE 
        WHEN b.payment_status = 'PAID' THEN '已缴费'
        WHEN b.payment_status = 'PARTIAL' THEN '部分缴费'
        WHEN b.payment_status = 'OVERDUE' THEN '已逾期'
		WHEN b.payment_status = 'WRITTEN_OFF' THEN '已注销'
        ELSE '未缴费'
    END as payment_status_name
FROM idh_heating_bill b
JOIN idh_customer c ON b.customer_id = c.id AND c.is_deleted = 0
LEFT JOIN idh_community com ON c.community_id = com.id AND com.is_deleted = 0
WHERE b.is_deleted = 0;

-- 工单详情视图
CREATE VIEW IF NOT EXISTS v_ticket_detail AS
SELECT 
    t.*,
    c.owner_name,
    c.owner_phone,
    c.building_number || '栋' || c.unit_number || '单元' || c.room_number || '室' as full_address,
    com.community_name,
    creator.username as creator_name,
    processor.username as processor_name,
    assigned.username as assigned_name
FROM idh_service_ticket t
JOIN idh_customer c ON t.customer_id = c.id AND c.is_deleted = 0
LEFT JOIN idh_community com ON c.community_id = com.id AND com.is_deleted = 0
LEFT JOIN sys_user creator ON t.created_by = creator.id
LEFT JOIN sys_user processor ON t.processor_id = processor.id
LEFT JOIN sys_user assigned ON t.assigned_to = assigned.id
WHERE t.is_deleted = 0;

-- 收费统计视图
CREATE VIEW IF NOT EXISTS v_payment_statistics AS
SELECT 
    DATE(p.payment_date) as pay_date,
    p.payment_method,
    COUNT(*) as payment_count,
    SUM(p.actual_receipt) as should_pay,
    COUNT(DISTINCT p.customer_id) as customer_count,
    GROUP_CONCAT(DISTINCT c.community_name) as communities
FROM idh_payment_record p
JOIN idh_customer c ON p.customer_id = c.id AND c.is_deleted = 0
WHERE p.is_deleted = 0 AND p.pay_status = 'COMPLETED'
GROUP BY DATE(p.payment_date), p.payment_method;

-- 小区统计视图
CREATE VIEW IF NOT EXISTS v_community_stats AS
SELECT 
    c.id,
    c.community_name,
    c.community_address,
    c.total_building_area,
    c.building_count,
    c.household_count,
    COUNT(DISTINCT cust.id) as customer_count,
    COUNT(DISTINCT bill.id) as bill_count,
    SUM(CASE WHEN bill.payment_status = 'PAID' THEN bill.actual_pay ELSE 0 END) as total_paid,
    SUM(CASE WHEN bill.payment_status = 'UNPAID' THEN bill.should_pay ELSE 0 END) as total_unpaid
FROM idh_community c
LEFT JOIN idh_customer cust ON c.id = cust.community_id AND cust.is_deleted = 0 AND cust.status = 1
LEFT JOIN idh_heating_bill bill ON cust.id = bill.customer_id AND bill.is_deleted = 0
WHERE c.is_deleted = 0
GROUP BY c.id, c.community_name, c.community_address, c.total_building_area, c.building_count, c.household_count;

-- ============================================
-- 触发器（维护数据完整性）
-- ============================================

-- 更新部门树路径
CREATE TRIGGER update_dept_tree_path 
AFTER INSERT ON sys_dept
BEGIN
    UPDATE sys_dept 
    SET tree_path = CASE 
        WHEN parent_id = 0 THEN CAST(id AS TEXT)
        ELSE (SELECT tree_path FROM sys_dept WHERE id = NEW.parent_id) || '.' || CAST(NEW.id AS TEXT)
    END
    WHERE id = NEW.id;
END;

-- 自动更新更新时间戳
-- 系统表
CREATE TRIGGER update_sys_user_timestamp 
AFTER UPDATE ON sys_user
FOR EACH ROW
BEGIN
    UPDATE sys_user SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_sys_role_timestamp 
AFTER UPDATE ON sys_role
FOR EACH ROW
BEGIN
    UPDATE sys_role SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_sys_menu_timestamp 
AFTER UPDATE ON sys_menu
FOR EACH ROW
BEGIN
    UPDATE sys_menu SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_sys_dept_timestamp 
AFTER UPDATE ON sys_dept
FOR EACH ROW
BEGIN
    UPDATE sys_dept SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_sys_post_timestamp 
AFTER UPDATE ON sys_post
FOR EACH ROW
BEGIN
    UPDATE sys_post SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_sys_dict_timestamp 
AFTER UPDATE ON sys_dict
FOR EACH ROW
BEGIN
    UPDATE sys_dict SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 业务表
CREATE TRIGGER trg_idh_customer_update
AFTER UPDATE ON idh_customer
BEGIN
    UPDATE idh_customer SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER trg_idh_bill_update
AFTER UPDATE ON idh_heating_bill
BEGIN
    UPDATE idh_heating_bill SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER trg_idh_ticket_update
AFTER UPDATE ON idh_service_ticket
BEGIN
    UPDATE idh_service_ticket SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER trg_idh_payment_update
AFTER UPDATE ON idh_payment_record
BEGIN
    UPDATE idh_payment_record SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER trg_idh_community_update
AFTER UPDATE ON idh_community
BEGIN
    UPDATE idh_community SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER trg_idh_community_config_update
AFTER UPDATE ON idh_community_config
BEGIN
    UPDATE idh_community_config SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER trg_idh_fund_deposit_update
AFTER UPDATE ON idh_fund_deposit
BEGIN
    UPDATE idh_fund_deposit SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER trg_idh_temperature_record_update
AFTER UPDATE ON idh_temperature_record
BEGIN
    UPDATE idh_temperature_record SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 更新账单欠费的触发器
CREATE TRIGGER trg_update_bill_outstanding
AFTER UPDATE OF actual_pay ON idh_heating_bill
WHEN NOT (NEW.actual_pay = OLD.actual_pay)  -- 只有当实际支付金额变化时才触发
BEGIN
    UPDATE idh_heating_bill 
    SET arrears = should_pay - NEW.actual_pay,
        payment_status = CASE 
            WHEN NEW.actual_pay = 0 THEN 'UNPAID'
            WHEN NEW.actual_pay > 0 AND NEW.actual_pay < should_pay THEN 'PARTIAL'
            WHEN NEW.actual_pay >= should_pay THEN 'PAID'
            ELSE payment_status
        END
    WHERE id = NEW.id;
END;

-- 插入收费记录时更新账单状态
-- CREATE TRIGGER trg_after_payment_insert
-- AFTER INSERT ON idh_payment_record
-- BEGIN
    -- 更新关联账单的实缴金额
    -- 这里需要解析 related_bill_ids 并更新对应的账单
    -- 实际实现可能需要更复杂的逻辑
-- END;

-- 自动计算工单处理时长
CREATE TRIGGER trg_calculate_ticket_duration
AFTER UPDATE OF process_end_time ON idh_service_ticket
FOR EACH ROW
WHEN NEW.process_end_time IS NOT NULL AND OLD.process_end_time IS NULL
BEGIN
    UPDATE idh_service_ticket 
    SET actual_duration = ROUND(
        CASE 
            WHEN OLD.process_start_time IS NOT NULL 
            THEN (JULIANDAY(NEW.process_end_time) - JULIANDAY(OLD.process_start_time)) * 24 * 60
            ELSE 0
        END
    )
    WHERE id = NEW.id;
END;

-- ============================================
-- 初始化数据
-- ============================================

-- 1. 初始化超级管理员用户 (密码: admin123，使用bcrypt哈希)
INSERT INTO sys_user (username, nickname, email, password_hash, status, is_system) VALUES 
('admin', '超级管理员', 'phoenixkyo119@163.com', '$2a$10$i4QLSdJUQyLZq8hd/BUETuNTAh6.1i6PyfWCsB2wpa7YlfKETYatG', 1, 1);

-- 获取管理员ID
SELECT last_insert_rowid() as admin_id;

-- 2. 初始化角色
INSERT INTO sys_role (role_key, role_name, description, is_system, data_scope, sort_order, status, created_by, updated_by) VALUES 
('admin', '超级管理员', '拥有系统所有权限', 1, 1, 1, 1, 1, 1),
('operator', '操作员', '普通操作员角色', 1, 5, 2, 1, 1, 1),
('viewer', '查看员', '只读权限角色', 1, 5, 3, 1, 1, 1),
('collector', '收费员', '收费权限角色', 1, 5, 4, 1, 1, 1),
('technician', '技术员', '技术处理角色', 1, 5, 5, 1, 1, 1);

-- 3. 初始化部门（修正语法错误）
INSERT INTO sys_dept (dept_name, dept_code, parent_id, dept_level, sort_order, created_by, updated_by) VALUES 
('陕西合智泽熙新能源科技有限公司', 'ROOT', 0, 1, 1, 1, 1),
('总经办', 'GMO', 1, 2, 10, 1, 1),
('运行技术部', 'OPT', 1, 2, 20, 1, 1),
('工程技术部', 'ENG', 1, 2, 30, 1, 1),
('市场开发部', 'MKT', 1, 2, 40, 1, 1),
('用户服务部', 'CS', 1, 2, 50, 1, 1),
('综合管理部', 'GMD', 1, 2, 60, 1, 1),
('计划财务部', 'FD', 1, 2, 70, 1, 1),
('东北区中心站', 'NECTR', 1, 2, 80, 1, 1),
('西北区中心站', 'NWCTR', 1, 2, 90, 1, 1),
('南区中心站', 'SCTR', 1, 2, 100, 1, 1),
('临潼区中心站', 'LTCTR', 1, 2, 110, 1, 1);

-- 4. 初始化岗位
INSERT INTO sys_post (post_code, post_name, sort_order, created_by, updated_by) VALUES 
('GM', '总经理', 10, 1, 1),
('VP', '副总经理', 20, 1, 1),
('MGR', '部长', 30, 1, 1),
('SPCLST', '专员', 40, 1, 1),
('BT', '管家', 50, 1, 1);

-- 5. 关联超级管理员角色
INSERT INTO sys_user_role (user_id, role_id, created_by) VALUES 
(
    (SELECT id FROM sys_user WHERE username = 'admin'),
    (SELECT id FROM sys_role WHERE role_key = 'admin'),
    (SELECT id FROM sys_user WHERE username = 'admin')
);

-- 6. 初始化系统菜单（使用 Element Plus 图标）
INSERT INTO sys_menu (parent_id, menu_type, menu_name, permission, path, component, icon, sort_order, status, created_by, updated_by) VALUES 
-- 仪表板
(0, 2, '仪表板', 'dashboard', '/dashboard', '/dashboard/index', 'ep:home-filled', 1, 1, 1, 1),

-- 系统管理目录
(0, 1, '系统管理', 'system', '/system', 'LAYOUT', 'ep:setting', 100, 1, 1, 1),

-- 用户管理
((SELECT id FROM sys_menu WHERE menu_name = '系统管理'), 2, '用户管理', 'system:user', '/system/user', '/system/user/index', 'ep:user', 10, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '用户管理'), 3, '用户查询', 'system:user:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '用户管理'), 3, '用户新增', 'system:user:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '用户管理'), 3, '用户编辑', 'system:user:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '用户管理'), 3, '用户删除', 'system:user:delete', NULL, NULL, NULL, 4, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '用户管理'), 3, '用户导出', 'system:user:export', NULL, NULL, NULL, 5, 1, 1, 1),

-- 角色管理
((SELECT id FROM sys_menu WHERE menu_name = '系统管理'), 2, '角色管理', 'system:role', '/system/role', '/system/role/index', 'ep:user-filled', 20, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '角色管理'), 3, '角色查询', 'system:role:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '角色管理'), 3, '角色新增', 'system:role:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '角色管理'), 3, '角色编辑', 'system:role:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '角色管理'), 3, '角色删除', 'system:role:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 菜单管理
((SELECT id FROM sys_menu WHERE menu_name = '系统管理'), 2, '菜单管理', 'system:menu', '/system/menu', '/system/menu/index', 'ep:menu', 30, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '菜单管理'), 3, '菜单查询', 'system:menu:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '菜单管理'), 3, '菜单新增', 'system:menu:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '菜单管理'), 3, '菜单编辑', 'system:menu:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '菜单管理'), 3, '菜单删除', 'system:menu:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 部门管理
((SELECT id FROM sys_menu WHERE menu_name = '系统管理'), 2, '部门管理', 'system:dept', '/system/dept', '/system/dept/index', 'ep:office-building', 40, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '部门管理'), 3, '部门查询', 'system:dept:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '部门管理'), 3, '部门新增', 'system:dept:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '部门管理'), 3, '部门编辑', 'system:dept:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '部门管理'), 3, '部门删除', 'system:dept:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 岗位管理
((SELECT id FROM sys_menu WHERE menu_name = '系统管理'), 2, '岗位管理', 'system:post', '/system/post', '/system/post/index', 'ep:suitcase', 50, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '岗位管理'), 3, '岗位查询', 'system:post:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '岗位管理'), 3, '岗位新增', 'system:post:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '岗位管理'), 3, '岗位编辑', 'system:post:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '岗位管理'), 3, '岗位删除', 'system:post:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 字典管理
((SELECT id FROM sys_menu WHERE menu_name = '系统管理'), 2, '字典管理', 'system:dict', '/system/dict', '/system/dict/index', 'ep:notebook', 60, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '字典管理'), 3, '字典查询', 'system:dict:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '字典管理'), 3, '字典新增', 'system:dict:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '字典管理'), 3, '字典编辑', 'system:dict:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '字典管理'), 3, '字典删除', 'system:dict:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 操作日志
((SELECT id FROM sys_menu WHERE menu_name = '系统管理'), 2, '操作日志', 'system:log', '/system/log', '/system/log/index', 'ep:document', 70, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '操作日志'), 3, '日志查询', 'system:log:query', NULL, NULL, NULL, 1, 1, 1, 1),

-- 供热业务目录
(0, 1, '供热业务', 'heating', '/heating', 'LAYOUT', 'ep:sunny', 10, 1, 1, 1),

-- 小区管理
((SELECT id FROM sys_menu WHERE menu_name = '供热业务'), 2, '小区管理', 'heating:community', '/heating/community', '/heating/community/index', 'ep:house', 10, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '小区管理'), 3, '小区查询', 'heating:community:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '小区管理'), 3, '小区新增', 'heating:community:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '小区管理'), 3, '小区编辑', 'heating:community:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '小区管理'), 3, '小区删除', 'heating:community:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 客户管理
((SELECT id FROM sys_menu WHERE menu_name = '供热业务'), 2, '客户管理', 'heating:customer', '/heating/customer', '/heating/customer/index', 'ep:user-filled', 20, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '客户管理'), 3, '客户查询', 'heating:customer:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '客户管理'), 3, '客户新增', 'heating:customer:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '客户管理'), 3, '客户编辑', 'heating:customer:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '客户管理'), 3, '客户删除', 'heating:customer:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 账单管理
((SELECT id FROM sys_menu WHERE menu_name = '供热业务'), 2, '账单管理', 'heating:bill', '/heating/bill', '/heating/bill/index', 'ep:ticket', 30, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '账单管理'), 3, '账单查询', 'heating:bill:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '账单管理'), 3, '账单新增', 'heating:bill:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '账单管理'), 3, '账单编辑', 'heating:bill:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '账单管理'), 3, '账单删除', 'heating:bill:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 收费管理
((SELECT id FROM sys_menu WHERE menu_name = '供热业务'), 2, '收费管理', 'heating:payment', '/heating/payment', '/heating/payment/index', 'ep:money', 40, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '收费管理'), 3, '收费查询', 'heating:payment:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '收费管理'), 3, '收费新增', 'heating:payment:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '收费管理'), 3, '收费编辑', 'heating:payment:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '收费管理'), 3, '收费删除', 'heating:payment:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 工单管理
((SELECT id FROM sys_menu WHERE menu_name = '供热业务'), 2, '工单管理', 'heating:ticket', '/heating/ticket', '/heating/ticket/index', 'ep:tools', 50, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '工单管理'), 3, '工单查询', 'heating:ticket:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '工单管理'), 3, '工单新增', 'heating:ticket:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '工单管理'), 3, '工单编辑', 'heating:ticket:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '工单管理'), 3, '工单删除', 'heating:ticket:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 测温管理
((SELECT id FROM sys_menu WHERE menu_name = '供热业务'), 2, '测温管理', 'heating:temperature', '/heating/temperature', '/heating/temperature/index', 'ep:thermometer', 60, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '测温管理'), 3, '测温查询', 'heating:temperature:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '测温管理'), 3, '测温新增', 'heating:temperature:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '测温管理'), 3, '测温编辑', 'heating:temperature:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '测温管理'), 3, '测温删除', 'heating:temperature:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 资金管理
((SELECT id FROM sys_menu WHERE menu_name = '供热业务'), 2, '资金管理', 'heating:fund', '/heating/fund', '/heating/fund/index', 'ep:wallet', 70, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '资金管理'), 3, '资金查询', 'heating:fund:query', NULL, NULL, NULL, 1, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '资金管理'), 3, '资金新增', 'heating:fund:add', NULL, NULL, NULL, 2, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '资金管理'), 3, '资金编辑', 'heating:fund:edit', NULL, NULL, NULL, 3, 1, 1, 1),
((SELECT id FROM sys_menu WHERE menu_name = '资金管理'), 3, '资金删除', 'heating:fund:delete', NULL, NULL, NULL, 4, 1, 1, 1),

-- 统计分析目录
(0, 1, '统计分析', 'statistics', '/statistics', 'LAYOUT', 'ep:data-analysis', 20, 1, 1, 1),

-- 收费统计
((SELECT id FROM sys_menu WHERE menu_name = '统计分析'), 2, '收费统计', 'statistics:payment', '/statistics/payment', '/statistics/payment/index', 'ep:pie-chart', 10, 1, 1, 1),

-- 工单统计
((SELECT id FROM sys_menu WHERE menu_name = '统计分析'), 2, '工单统计', 'statistics:ticket', '/statistics/ticket', '/statistics/ticket/index', 'ep:histogram', 20, 1, 1, 1),

-- 温度统计
((SELECT id FROM sys_menu WHERE menu_name = '统计分析'), 2, '温度统计', 'statistics:temperature', '/statistics/temperature', '/statistics/temperature/index', 'ep:trend-charts', 30, 1, 1, 1),

-- 个人中心
(0, 2, '个人中心', 'profile', '/profile', '/profile/index', 'ep:avatar', 999, 1, 1, 1);

-- 7. 关联超级管理员角色和菜单权限（所有菜单）
INSERT INTO sys_role_menu (role_id, menu_id, permission_type, created_by)
SELECT 
    1 as role_id, 
    id as menu_id,
    1 as permission_type,
    1 as created_by
FROM sys_menu
WHERE is_deleted = 0;

-- 8. 初始化数据字典（修正后的完整版本）
INSERT INTO sys_dict (dict_type, dict_code, dict_value, dict_label, description, sort_order, is_system, is_default, status, created_by, updated_by) VALUES
-- 菜单类型
('MENU_TYPE', '1', '1', '目录', '菜单类型：目录', 1, 1, 1, 1, 1, 1),
('MENU_TYPE', '2', '2', '菜单', '菜单类型：菜单', 2, 1, 0, 1, 1, 1),
('MENU_TYPE', '3', '3', '按钮', '菜单类型：按钮', 3, 1, 0, 1, 1, 1),

-- 小区类型
('COMMUNITY_TYPE', 'RESIDENTIAL', 'RESIDENTIAL', '住宅小区', '小区类型：住宅', 1, 1, 1, 1, 1, 1),
('COMMUNITY_TYPE', 'COMMERCIAL', 'COMMERCIAL', '商业小区', '小区类型：商业', 2, 1, 0, 1, 1, 1),
('COMMUNITY_TYPE', 'MIXED', 'MIXED', '混合小区', '小区类型：混合', 3, 1, 0, 1, 1, 1),

-- 物业类型
('PROPERTY_TYPE', 'NEW', 'NEW', '新建小区', '物业类型：新建', 1, 1, 1, 1, 1, 1),
('PROPERTY_TYPE', 'OLD', 'OLD', '老旧小区', '物业类型：老旧', 2, 1, 0, 1, 1, 1),
('PROPERTY_TYPE', 'REFURBISHED', 'REFURBISHED', '改造小区', '物业类型：改造', 3, 1, 0, 1, 1, 1),

-- 性别
('GENDER', 'UNKNOWN', 'UNKNOWN', '未知', '性别：未知', 1, 1, 1, 1, 1, 1),
('GENDER', 'MALE', 'MALE', '男', '性别：男', 2, 1, 0, 1, 1, 1),
('GENDER', 'FEMALE', 'FEMALE', '女', '性别：女', 3, 1, 0, 1, 1, 1),

-- 房屋类型
('HOUSE_TYPE', 'RESIDENCE', 'RESIDENCE', '住宅', '房屋类型：住宅', 1, 1, 1, 1, 1, 1),
('HOUSE_TYPE', 'APARTMENT', 'APARTMENT', '公寓', '房屋类型：公寓', 2, 1, 0, 1, 1, 1),
('HOUSE_TYPE', 'VILLA', 'VILLA', '别墅', '房屋类型：别墅', 3, 1, 0, 1, 1, 1),
('HOUSE_TYPE', 'OFFICE', 'OFFICE', '办公', '房屋类型：办公', 4, 1, 0, 1, 1, 1),
('HOUSE_TYPE', 'SHOP', 'SHOP', '商铺', '房屋类型：商铺', 5, 1, 0, 1, 1, 1),
('HOUSE_TYPE', 'OTHER', 'OTHER', '其他', '房屋类型：其他', 6, 1, 0, 1, 1, 1),

-- 居住状态
('OCCUPANCY_STATUS', 'OCCUPIED', 'OCCUPIED', '自住', '居住状态：自住', 1, 1, 1, 1, 1, 1),
('OCCUPANCY_STATUS', 'RENTED', 'RENTED', '出租', '居住状态：出租', 2, 1, 0, 1, 1, 1),
('OCCUPANCY_STATUS', 'VACANT', 'VACANT', '空置', '居住状态：空置', 3, 1, 0, 1, 1, 1),
('OCCUPANCY_STATUS', 'OTHER', 'OTHER', '其他', '居住状态：其他', 4, 1, 0, 1, 1, 1),

-- 供暖状态
('HEATING_STATUS', 'NORMAL', 'NORMAL', '正常供暖', '供暖状态：正常', 1, 1, 1, 1, 1, 1),
('HEATING_STATUS', 'SUSPENDED', 'SUSPENDED', '暂停供暖', '供暖状态：暂停', 2, 1, 0, 1, 1, 1),
('HEATING_STATUS', 'PARTIAL', 'PARTIAL', '部分供暖', '供暖状态：部分', 3, 1, 0, 1, 1, 1),
('HEATING_STATUS', 'OTHER', 'OTHER', '其他', '供暖状态：其他', 4, 1, 0, 1, 1, 1),

-- 客户等级
('CUSTOMER_LEVEL', 'NORMAL', 'NORMAL', '普通客户', '客户等级：普通', 1, 1, 1, 1, 1, 1),
('CUSTOMER_LEVEL', 'VIP', 'VIP', '重要客户', '客户等级：重要', 2, 1, 0, 1, 1, 1),
('CUSTOMER_LEVEL', 'FOCUS', 'FOCUS', '重点关注', '客户等级：关注', 3, 1, 0, 1, 1, 1),
('CUSTOMER_LEVEL', 'BLACKLIST', 'BLACKLIST', '黑名单', '客户等级：黑名单', 4, 1, 0, 1, 1, 1),

-- 工单类型
('TICKET_TYPE', 'COMPLAINT_SUB', 'COMPLAINT_SUB', '投诉（主观）', '工单类型：投诉（主观）', 1, 1, 1, 1, 1, 1),
('TICKET_TYPE', 'COMPLAINT_OB', 'COMPLAINT_OB', '投诉（客观）', '工单类型：投诉（客观）', 2, 1, 0, 1, 1, 1),
('TICKET_TYPE', 'REPAIR', 'REPAIR', '报修', '工单类型：报修', 3, 1, 0, 1, 1, 1),
('TICKET_TYPE', 'CONSULTATION', 'CONSULTATION', '咨询', '工单类型：咨询', 4, 1, 0, 1, 1, 1),
('TICKET_TYPE', 'PAYMENT', 'PAYMENT', '缴费', '工单类型：缴费', 5, 1, 0, 1, 1, 1),
('TICKET_TYPE', 'TEMPERATURE', 'TEMPERATURE', '测温', '工单类型：测温', 6, 1, 0, 1, 1, 1),
('TICKET_TYPE', 'OTHER', 'OTHER', '其他', '工单类型：其他', 7, 1, 0, 1, 1, 1),

-- 工单优先级
('TICKET_PRIORITY', 'LOW', 'LOW', '低', '工单优先级：低', 1, 1, 0, 1, 1, 1),
('TICKET_PRIORITY', 'NORMAL', 'NORMAL', '中', '工单优先级：中', 2, 1, 1, 1, 1, 1),
('TICKET_PRIORITY', 'HIGH', 'HIGH', '高', '工单优先级：高', 3, 1, 0, 1, 1, 1),
('TICKET_PRIORITY', 'URGENT', 'URGENT', '紧急', '工单优先级：紧急', 4, 1, 0, 1, 1, 1),

-- 工单状态
('TICKET_STATUS', 'PENDING', 'PENDING', '待处理', '工单状态：待处理', 1, 1, 1, 1, 1, 1),
('TICKET_STATUS', 'ASSIGNED', 'ASSIGNED', '已分配', '工单状态：已分配', 2, 1, 0, 1, 1, 1),
('TICKET_STATUS', 'IN_PROGRESS', 'IN_PROGRESS', '处理中', '工单状态：处理中', 3, 1, 0, 1, 1, 1),
('TICKET_STATUS', 'RESOLVED', 'RESOLVED', '已解决', '工单状态：已解决', 4, 1, 0, 1, 1, 1),
('TICKET_STATUS', 'CLOSED', 'CLOSED', '已关闭', '工单状态：已关闭', 5, 1, 0, 1, 1, 1),
('TICKET_STATUS', 'CANCELLED', 'CANCELLED', '已取消', '工单状态：已取消', 6, 1, 0, 1, 1, 1),
('TICKET_STATUS', 'REOPENED', 'REOPENED', '重新打开', '工单状态：重新打开', 7, 1, 0, 1, 1, 1),

-- SLA等级
('SLA_LEVEL', 'STANDARD', 'STANDARD', '标准', 'SLA等级：标准', 1, 1, 1, 1, 1, 1),
('SLA_LEVEL', 'PRIORITY', 'PRIORITY', '优先', 'SLA等级：优先', 2, 1, 0, 1, 1, 1),
('SLA_LEVEL', 'VIP', 'VIP', '重要', 'SLA等级：重要', 3, 1, 0, 1, 1, 1),

-- 缴费状态
('PAYMENT_STATUS', 'UNPAID', 'UNPAID', '未缴费', '缴费状态：未缴费', 1, 1, 1, 1, 1, 1),
('PAYMENT_STATUS', 'PARTIAL', 'PARTIAL', '部分缴费', '缴费状态：部分缴费', 2, 1, 0, 1, 1, 1),
('PAYMENT_STATUS', 'PAID', 'PAID', '已缴费', '缴费状态：已缴费', 3, 1, 0, 1, 1, 1),
('PAYMENT_STATUS', 'OVERDUE', 'OVERDUE', '已逾期', '缴费状态：已逾期', 4, 1, 0, 1, 1, 1),
('PAYMENT_STATUS', 'WRITTEN_OFF', 'WRITTEN_OFF', '已注销', '缴费状态：已注销', 5, 1, 0, 1, 1, 1),

-- 账单状态
('BILL_STATUS', 'DRAFT', 'DRAFT', '草稿', '账单状态：草稿', 1, 1, 1, 1, 1, 1),
('BILL_STATUS', 'ACTIVE', 'ACTIVE', '生效', '账单状态：生效', 2, 1, 0, 1, 1, 1),
('BILL_STATUS', 'OVERDUE', 'OVERDUE', '逾期', '账单状态：逾期', 3, 1, 0, 1, 1, 1),
('BILL_STATUS', 'SETTLED', 'SETTLED', '已结算', '账单状态：已结算', 4, 1, 0, 1, 1, 1),

-- 支付方式
('PAYMENT_METHOD', 'CASH', 'CASH', '现金', '支付方式：现金', 1, 1, 1, 1, 1, 1),
('PAYMENT_METHOD', 'WECHAT', 'WECHAT', '微信支付', '支付方式：微信', 2, 1, 0, 1, 1, 1),
('PAYMENT_METHOD', 'ALIPAY', 'ALIPAY', '支付宝', '支付方式：支付宝', 3, 1, 0, 1, 1, 1),
('PAYMENT_METHOD', 'BANK_CARD', 'BANK_CARD', '银行卡', '支付方式：银行卡', 4, 1, 0, 1, 1, 1),
('PAYMENT_METHOD', 'BANK_TRANSFER', 'BANK_TRANSFER', '银行转账', '支付方式：银行转账', 5, 1, 0, 1, 1, 1),
('PAYMENT_METHOD', 'OTHER', 'OTHER', '其他', '支付方式：其他', 6, 1, 0, 1, 1, 1),

-- 支付状态
('PAY_STATUS', 'PENDING', 'PENDING', '未支付', '支付状态：未支付', 1, 1, 1, 1, 1, 1),
('PAY_STATUS', 'COMPLETED', 'COMPLETED', '支付完成', '支付状态：完成', 2, 1, 0, 1, 1, 1),
('PAY_STATUS', 'FAILED', 'FAILED', '支付失败', '支付状态：失败', 3, 1, 0, 1, 1, 1),
('PAY_STATUS', 'REFUNDED', 'REFUNDED', '已退款', '支付状态：退款', 4, 1, 0, 1, 1, 1),
('PAY_STATUS', 'PARTIAL', 'PARTIAL', '部分支付', '支付状态：部分', 5, 1, 0, 1, 1, 1),

-- 对账状态
('RECONCILIATION_STATUS', 'PENDING', 'PENDING', '未对账', '对账状态：未对账', 1, 1, 1, 1, 1, 1),
('RECONCILIATION_STATUS', 'RECONCILED', 'RECONCILED', '已对账', '对账状态：已对账', 2, 1, 0, 1, 1, 1),
('RECONCILIATION_STATUS', 'DISCREPANCY', 'DISCREPANCY', '不一致', '对账状态：不一致', 3, 1, 0, 1, 1, 1),
('RECONCILIATION_STATUS', 'ADJUSTED', 'ADJUSTED', '已调整', '对账状态：已调整', 4, 1, 0, 1, 1, 1),

-- 存现状态
('DEPOSIT_STATUS', 'PENDING', 'PENDING', '未存现', '存现状态：未存现', 1, 1, 1, 1, 1, 1),
('DEPOSIT_STATUS', 'DEPOSITED', 'DEPOSITED', '已存现', '存现状态：已存现', 2, 1, 0, 1, 1, 1),
('DEPOSIT_STATUS', 'CONFIRMED', 'CONFIRMED', '已确认', '存现状态：已确认', 3, 1, 0, 1, 1, 1),
('DEPOSIT_STATUS', 'CANCELLED', 'CANCELLED', '已取消', '存现状态：已取消', 4, 1, 0, 1, 1, 1),

-- 审核状态
('VERIFICATION_STATUS', 'PENDING', 'PENDING', '未审核', '审核状态：未审核', 1, 1, 1, 1, 1, 1),
('VERIFICATION_STATUS', 'APPROVED', 'APPROVED', '已批准', '审核状态：已批准', 2, 1, 0, 1, 1, 1),
('VERIFICATION_STATUS', 'REJECTED', 'REJECTED', '已拒绝', '审核状态：已拒绝', 3, 1, 0, 1, 1, 1),
('VERIFICATION_STATUS', 'ADJUSTED', 'ADJUSTED', '已调整', '审核状态：已调整', 4, 1, 0, 1, 1, 1),

-- 测温评估结果
('EVALUATION_RESULT', 'PENDING', 'PENDING', '未评估', '测温评估：未评估', 1, 1, 1, 1, 1, 1),
('EVALUATION_RESULT', 'QUALIFIED', 'QUALIFIED', '合格', '测温评估：合格', 2, 1, 0, 1, 1, 1),
('EVALUATION_RESULT', 'UNQUALIFIED', 'UNQUALIFIED', '不合格', '测温评估：不合格', 3, 1, 0, 1, 1, 1),
('EVALUATION_RESULT', 'BORDERLINE', 'BORDERLINE', '边缘', '测温评估：边缘', 4, 1, 0, 1, 1, 1),

-- 测温是否达标
('QUALIFICATION_STATUS', 'PASS', 'PASS', '通过', '测温结果：通过', 1, 1, 0, 1, 1, 1),
('QUALIFICATION_STATUS', 'FAIL', 'FAIL', '未通过', '测温结果：未通过', 2, 1, 1, 1, 1, 1),
('QUALIFICATION_STATUS', 'CONDITIONAL_PASS', 'CONDITIONAL_PASS', '有条件通过', '测温结果：有条件通过', 3, 1, 0, 1, 1, 1),

-- 数据权限范围
('DATA_SCOPE', '1', '1', '全部数据', '数据权限：全部', 1, 1, 1, 1, 1, 1),
('DATA_SCOPE', '2', '2', '本单位数据', '数据权限：本单位', 2, 1, 0, 1, 1, 1),
('DATA_SCOPE', '3', '3', '本单位及以下数据', '数据权限：本单位及以下', 3, 1, 0, 1, 1, 1),
('DATA_SCOPE', '4', '4', '本部门数据', '数据权限：本部门', 4, 1, 0, 1, 1, 1),
('DATA_SCOPE', '5', '5', '本部门及以下数据', '数据权限：本部门及以下', 5, 1, 0, 1, 1, 1),
('DATA_SCOPE', '6', '6', '指定部门数据', '数据权限：指定部门', 6, 1, 0, 1, 1, 1),
('DATA_SCOPE', '7', '7', '仅本人数据', '数据权限：仅本人', 7, 1, 0, 1, 1, 1);

-- 9. 初始化测试小区数据
INSERT INTO idh_community (community_code, community_name, community_address, total_building_area, building_count, unit_count, household_count, community_type, property_type, status, created_by, updated_by) VALUES 
('XQ001', '花园小区', '西安市雁塔区科技路123号', 85000.5, 15, 45, 750, 'RESIDENTIAL', 'OLD', 1, 1, 1),
('XQ002', '阳光新城', '西安市未央区凤城五路456号', 120000.0, 20, 60, 1200, 'RESIDENTIAL', 'NEW', 1, 1, 1),
('XQ003', '商业中心', '西安市碑林区东大街789号', 50000.0, 8, 24, 200, 'COMMERCIAL', 'REFURBISHED', 1, 1, 1);

-- 10. 初始化小区配置
INSERT INTO idh_community_config (community_id, heating_unit_price, vacant_rate, discount_rate, heating_season_start_month, heating_season_start_day, heating_season_end_month, heating_season_end_day, payment_deadline_days, overdue_fine_rate, status, created_by, updated_by) VALUES 
(1, 5.80, 0.3, 0.05, 11, 15, 3, 31, 30, 0.0005, 1, 1, 1),
(2, 6.00, 0.25, 0.08, 11, 15, 3, 31, 30, 0.0005, 1, 1, 1),
(3, 7.50, 0.2, 0.0, 11, 15, 3, 31, 30, 0.001, 1, 1, 1);

-- 11. 初始化测试客户数据
INSERT INTO idh_customer (community_id, building_number, unit_number, room_number, floor_number, house_type, heating_area, building_area, usable_area, owner_name, owner_gender, owner_id_card, owner_phone, owner_email, occupancy_status, heating_status, customer_level, status, created_by, updated_by) VALUES 
(1, '1', '1', '101', 1, 'RESIDENCE', 85.5, 98.0, 82.0, '张三', 'MALE', '610102198001010011', '13800138001', 'zhangsan@example.com', 'OCCUPIED', 'NORMAL', 'NORMAL', 1, 1, 1),
(1, '1', '1', '102', 1, 'RESIDENCE', 89.0, 102.0, 85.0, '李四', 'FEMALE', '610102198002020022', '13800138002', 'lisi@example.com', 'RENTED', 'NORMAL', 'NORMAL', 1, 1, 1),
(1, '2', '1', '201', 2, 'RESIDENCE', 92.0, 106.0, 88.0, '王五', 'MALE', '610102198003030033', '13800138003', 'wangwu@example.com', 'OCCUPIED', 'NORMAL', 'VIP', 1, 1, 1),
(2, '3', '2', '301', 3, 'APARTMENT', 75.0, 86.0, 72.0, '赵六', 'FEMALE', '610102198004040044', '13800138004', 'zhaoliu@example.com', 'OCCUPIED', 'SUSPENDED', 'NORMAL', 1, 1, 1);

-- 12. 初始化测试账单数据
INSERT INTO idh_heating_bill (bill_no, customer_id, heating_season, heating_area, unit_price, base_amount, should_pay, actual_pay, arrears, payment_status, due_date, bill_status, created_by, updated_by) VALUES 
('BILL20240001', 1, '2024-2025', 85.5, 5.80, 495.90, 495.90, 495.90, (495.90 - 495.90), 'PAID', '2024-12-31', 'ACTIVE', 1, 1),
('BILL20240002', 2, '2024-2025', 89.0, 5.80, 516.20, 516.20, 0, (516.20 - 0), 'UNPAID', '2024-12-31', 'ACTIVE', 1, 1),
('BILL20240003', 3, '2024-2025', 92.0, 5.80, 533.60, 533.60, 300.00, (533.60 - 300.00), 'PARTIAL', '2024-12-31', 'ACTIVE', 1, 1),
('BILL20240004', 4, '2024-2025', 75.0, 6.00, 450.00, 450.00, 0, (450.0 - 0), 'UNPAID', '2024-12-31', 'ACTIVE', 1, 1);

-- 13. 初始化测试工单数据
INSERT INTO idh_service_ticket (ticket_no, ticket_title, customer_id, ticket_type, ticket_priority, problem_description, ticket_status, created_by, updated_by) VALUES 
('TICKET20240001', '暖气片不热报修', 1, 'REPAIR', 'NORMAL', '客厅暖气片温度不达标，只有15度左右', 'RESOLVED', 1, 1),
('TICKET20240002', '缴费咨询', 2, 'CONSULTATION', 'LOW', '咨询今年的缴费政策和优惠', 'CLOSED', 1, 1),
('TICKET20240003', '温度不达标投诉', 3, 'COMPLAINT_SUB', 'HIGH', '卧室温度只有16度，多次报修未解决', 'IN_PROGRESS', 1, 1),
('TICKET20240004', '测温申请', 4, 'TEMPERATURE', 'NORMAL', '申请进行室内温度测量', 'PENDING', 1, 1);

-- 14. 初始化测试收费记录
INSERT INTO idh_payment_record (payment_no, customer_id, collector_id, related_bill_ids, bill_count, should_pay, actual_receipt, payment_method, payment_date, payment_time, pay_status, created_by, updated_by) VALUES 
('PAY20240001', 1, 1, '[1]', 1, 495.90, 500.00, 'CASH', '2024-01-15', '14:30:00', 'COMPLETED', 1, 1),
('PAY20240002', 3, 1, '[3]', 1, 533.60, 300.00, 'WECHAT', '2024-01-16', '10:15:00', 'PARTIAL', 1, 1);

-- ============================================
-- 结束初始化......
-- ============================================

-- 15. 提交事务
COMMIT;

-- 打印初始化完成信息
SELECT '数据库初始化完成!' as message;
SELECT COUNT(*) as user_count FROM sys_user;
SELECT COUNT(*) as role_count FROM sys_role;
SELECT COUNT(*) as dept_count FROM sys_dept;
SELECT COUNT(*) as menu_count FROM sys_menu;
SELECT COUNT(*) as dict_count FROM sys_dict;
SELECT COUNT(*) as community_count FROM idh_community;
SELECT COUNT(*) as customer_count FROM idh_customer;
SELECT COUNT(*) as bill_count FROM idh_heating_bill;
SELECT COUNT(*) as ticket_count FROM idh_service_ticket;
SELECT COUNT(*) as payment_count FROM idh_payment_record;

-- ============================================
-- 数据库维护命令
-- ============================================

-- 1. 重新分析表和索引（优化查询计划）
ANALYZE;

-- 2. 检查数据库完整性
PRAGMA integrity_check;

-- 3. 清理碎片空间（建议在低峰期执行）
-- VACUUM;

-- 4. 重建索引（针对性能下降的情况）
-- REINDEX;

-- 5. 设置优化参数（可在运行时调整）
PRAGMA optimize;

-- 6. 查看数据库大小信息
SELECT 
    name as table_name,
    sql as table_sql
FROM sqlite_master 
WHERE type = 'table' 
ORDER BY name;

-- 7. 查看索引信息
SELECT 
    name as index_name,
    tbl_name as table_name,
    sql as index_sql
FROM sqlite_master 
WHERE type = 'index' 
ORDER BY tbl_name, name;

-- 8. 查看数据库统计信息
SELECT 
    COUNT(DISTINCT tbl_name) as table_count,
    COUNT(DISTINCT name) as object_count,
    SUM(pgsize) as total_size_bytes,
    ROUND(SUM(pgsize) / 1024.0 / 1024.0, 2) as total_size_mb
FROM dbstat;

-- 9. 启用外键约束（确保已启用）
PRAGMA foreign_keys = ON;

-- 10. 验证外键约束
PRAGMA foreign_key_check;

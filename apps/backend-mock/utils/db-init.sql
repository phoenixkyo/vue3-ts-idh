-- 禁用外键约束
PRAGMA foreign_keys = OFF;

-- 创建客户表
CREATE TABLE IF NOT EXISTS idh_customer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INTEGER NOT NULL,
    building VARCHAR(20) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    room VARCHAR(20) NOT NULL,
    owner_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    area REAL NOT NULL,
    heating_season VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    fee_type VARCHAR(20) NOT NULL,
    should_pay REAL NOT NULL,
    actual_pay REAL DEFAULT 0,
    arrears REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (community_id) REFERENCES idh_community(id)
);

-- 创建账单表
CREATE TABLE IF NOT EXISTS idh_bill (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    heating_season VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    fee_type VARCHAR(20) NOT NULL,
    should_pay REAL NOT NULL,
    actual_pay REAL DEFAULT 0,
    arrears REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES idh_customer(id)
);

-- 创建工单表
CREATE TABLE IF NOT EXISTS idh_ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT '未开始',
    creator VARCHAR(50) NOT NULL,
    processor VARCHAR(50) NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES idh_customer(id)
);

-- 创建收费记录表
CREATE TABLE IF NOT EXISTS idh_payment_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    receipt_number VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL,
    bill_ids TEXT NOT NULL, -- JSON格式存储的账单ID数组
    total_amount REAL NOT NULL,
    paid_amount REAL NOT NULL,
    change_amount REAL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL,
    payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES idh_customer(id)
);

-- 创建小区表
CREATE TABLE IF NOT EXISTS idh_community (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200) NOT NULL,
    building_area REAL NOT NULL,
    building_count INTEGER NOT NULL,
    unit_count INTEGER NOT NULL,
    household_count INTEGER NOT NULL,
    property_type VARCHAR(20) NOT NULL, -- 新建、老旧
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建小区配置表
CREATE TABLE IF NOT EXISTS idh_community_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INTEGER NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0, -- 0: 非默认, 1: 默认
    unit_price REAL NOT NULL DEFAULT 5.80,
    change_amount REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (community_id) REFERENCES idh_community(id)
);

-- 创建测温记录表
CREATE TABLE IF NOT EXISTS idh_temperature_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    temperature REAL NOT NULL,
    temperature_time TEXT NOT NULL,
    customer_id INTEGER NOT NULL,
    staff_name VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES idh_ticket(id),
    FOREIGN KEY (customer_id) REFERENCES idh_customer(id)
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS idh_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES idh_dept(id),
    FOREIGN KEY (post_id) REFERENCES idh_post(id)
);

-- 创建角色表
CREATE TABLE IF NOT EXISTS idh_role (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    data_scope VARCHAR(50) NOT NULL, -- 本单位及以下数据、本部门及以下数据、本单位数据、本部门数据、全部数据、指定部门数据
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建角色用户表
CREATE TABLE IF NOT EXISTS idh_role_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES idh_role(id),
    FOREIGN KEY (user_id) REFERENCES idh_user(id)
);

-- 创建菜单表
CREATE TABLE IF NOT EXISTS idh_menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL DEFAULT 0,
    name VARCHAR(50) NOT NULL,
    path VARCHAR(100) NOT NULL,
    component VARCHAR(100),
    icon VARCHAR(50),
    title VARCHAR(50) NOT NULL,
    order_num INTEGER NOT NULL DEFAULT 0,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建部门表
CREATE TABLE IF NOT EXISTS idh_dept (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL DEFAULT 0,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 组织、部门
    manager_id INTEGER,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES idh_user(id)
);

-- 创建岗位表
CREATE TABLE IF NOT EXISTS idh_post (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建工作流表
CREATE TABLE IF NOT EXISTS idh_workflow (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    operator_id INTEGER NOT NULL,
    operator_name VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES idh_ticket(id),
    FOREIGN KEY (operator_id) REFERENCES idh_user(id)
);

-- 插入默认数据
-- 插入默认部门
INSERT INTO idh_dept (parent_id, name, type, description) VALUES (0, '总公司', '组织', '总公司');

-- 插入默认岗位
INSERT INTO idh_post (name, description) VALUES ('管理员', '系统管理员');
INSERT INTO idh_post (name, description) VALUES ('客服人员', '客服人员');
INSERT INTO idh_post (name, description) VALUES ('收费人员', '收费人员');

-- 插入默认角色
INSERT INTO idh_role (name, description, data_scope) VALUES ('超级管理员', '系统超级管理员', '全部数据');
INSERT INTO idh_role (name, description, data_scope) VALUES ('管理员', '系统管理员', '本单位及以下数据');
INSERT INTO idh_role (name, description, data_scope) VALUES ('客服人员', '客服人员', '本部门数据');
INSERT INTO idh_role (name, description, data_scope) VALUES ('收费人员', '收费人员', '本部门数据');

-- 插入默认用户（密码: 123456）
INSERT INTO idh_user (dept_id, post_id, username, nickname, real_name, gender, phone, email, password, is_admin) VALUES (1, 1, 'admin', '管理员', '系统管理员', '男', '13800138000', 'admin@example.com', 'e10adc3949ba59abbe56e057f20f883e', 1);

-- 插入默认角色用户关系
INSERT INTO idh_role_user (role_id, user_id) VALUES (1, 1);

-- 插入默认菜单
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (0, 'Dashboard', '/dashboard', 'dashboard/index', 'el-icon-data-line', '仪表盘', 1);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (0, 'Workorder', '/workorder', 'workorder/index', 'el-icon-tickets', '客服工单', 2);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (0, 'Cash', '/cash', 'cash/index', 'el-icon-money', '线下缴费', 3);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (0, 'Analysis', '/analysis', 'analysis/index', 'el-icon-data-analysis', '统计分析', 4);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (0, 'System', '/system', '', 'el-icon-setting', '系统管理', 5);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (5, 'User', '/system/user', 'system/user/index', 'el-icon-user', '用户管理', 1);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (5, 'Role', '/system/role', 'system/role/index', 'el-icon-rank', '角色管理', 2);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (5, 'Menu', '/system/menu', 'system/menu/index', 'el-icon-menu', '菜单管理', 3);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (5, 'Dept', '/system/dept', 'system/dept/index', 'el-icon-office-building', '部门管理', 4);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (5, 'Post', '/system/post', 'system/post/index', 'el-icon-s-cooperation', '岗位管理', 5);
INSERT INTO idh_menu (parent_id, name, path, component, icon, title, order_num) VALUES (0, 'Community', '/community', 'community/index', 'el-icon-location-information', '小区管理', 6);

-- 启用外键约束
PRAGMA foreign_keys = ON;

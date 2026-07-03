-- ============================================
-- IDH智慧供热客服系统数据库初始化脚本 (MySQL版本)
-- 版本: 2.0
-- 作者：Neo
-- 创建时间: 2026年05月11日
-- 适配: MySQL 8.0+
-- ============================================

-- ============================================
-- 开始初始化......
-- ============================================

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 系统用户表：存储系统用户信息
-- ============================================

CREATE TABLE IF NOT EXISTS sys_user (
    -- 基础信息
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    nickname VARCHAR(50) NOT NULL COMMENT '用户昵称',
    real_name VARCHAR(50) NULL COMMENT '真实姓名',
    email VARCHAR(100) NULL COMMENT '邮箱',
    phone VARCHAR(20) NULL COMMENT '手机号',
    avatar TEXT NULL COMMENT '头像地址',

    -- 密码安全
    password_hash TEXT NOT NULL COMMENT '密码哈希 (bcrypt/argon2)',
    password_salt TEXT NULL COMMENT '密码盐值 (如果使用 PBKDF2)',
    password_strength INT UNSIGNED DEFAULT 0 COMMENT '密码强度评分 0-100',
    password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '密码最后修改时间',

    -- 状态信息
    status TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '状态 0:禁用 1:启用',
    is_system TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '是否系统内置 0:否 1:是',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记 0:正常 1:删除',
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 部门岗位信息
    dept_id INT UNSIGNED NULL COMMENT '部门ID',
    post_id INT UNSIGNED NULL COMMENT '岗位ID',
    employee_no VARCHAR(50) NULL COMMENT '员工编号',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号(乐观锁)',

    -- 登录信息
    last_login_at DATETIME NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) NULL COMMENT '最后登录IP',
    login_fail_count INT UNSIGNED DEFAULT 0 COMMENT '登录失败次数',
    locked_until DATETIME NULL COMMENT '锁定截止时间',

    -- 扩展信息
    gender TINYINT UNSIGNED DEFAULT 0 COMMENT '性别 0:未知 1:男 2:女',
    birthday DATE NULL COMMENT '生日',
    signature TEXT NULL COMMENT '个性签名',
    remark TEXT NULL COMMENT '备注',

    -- 约束
    UNIQUE KEY uk_sys_user_username (username),
    UNIQUE KEY uk_sys_user_email (email),

    -- 主键
    PRIMARY KEY (id),

    -- 外键
    KEY idx_sys_user_dept_id (dept_id),
    KEY idx_sys_user_post_id (post_id),
    KEY idx_sys_user_status (status),
    KEY idx_sys_user_is_deleted (is_deleted),
    KEY idx_sys_user_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- ============================================
-- 系统角色表：存储角色信息
-- ============================================

CREATE TABLE IF NOT EXISTS sys_role (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色ID',
    role_key VARCHAR(50) NOT NULL COMMENT '角色标识（英文）',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    description TEXT NULL COMMENT '角色描述',
    data_scope TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '数据权限范围 1:全部 2:本单位 3:本单位及以下 4:本部门 5:本部门及以下 6:指定部门 7:仅本人',

    -- 状态管理
    status TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '状态 0:禁用 1:启用',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 排序和显示
    sort_order INT UNSIGNED DEFAULT 0 COMMENT '排序序号',
    icon VARCHAR(100) NULL COMMENT '角色图标',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 约束
    UNIQUE KEY uk_sys_role_role_key (role_key),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_sys_role_status (status),
    KEY idx_sys_role_is_deleted (is_deleted),
    KEY idx_sys_role_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统角色表';

-- ============================================
-- 系统菜单表：存储菜单和按钮权限
-- ============================================

CREATE TABLE IF NOT EXISTS sys_menu (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
    parent_id INT UNSIGNED DEFAULT 0 NOT NULL COMMENT '父菜单ID，0表示根菜单',
    menu_type TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '菜单类型 1:目录 2:菜单 3:按钮',
    menu_name VARCHAR(50) NOT NULL COMMENT '菜单名称',
    permission VARCHAR(100) NULL COMMENT '权限标识（如：sys:user:add）',

    -- 路由相关
    path VARCHAR(200) NULL COMMENT '路由路径',
    component VARCHAR(200) NULL COMMENT '组件路径',
    redirect VARCHAR(200) NULL COMMENT '重定向地址',
    external_link VARCHAR(500) NULL COMMENT '外链地址',

    -- 显示相关
    icon VARCHAR(100) NULL COMMENT '菜单图标',
    sort_order INT UNSIGNED DEFAULT 0 COMMENT '排序序号',
    hidden TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '是否隐藏 0:显示 1:隐藏',
    hide_children TINYINT UNSIGNED DEFAULT 0 COMMENT '是否隐藏子菜单',
    keep_alive TINYINT UNSIGNED DEFAULT 1 COMMENT '是否缓存组件',
    affix TINYINT UNSIGNED DEFAULT 0 COMMENT '是否固定标签页',

    -- 状态管理
    status TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '状态',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 元信息
    meta_title VARCHAR(50) NULL COMMENT '页面标题',
    meta_ignore_auth TINYINT UNSIGNED DEFAULT 0 COMMENT '是否忽略权限验证',
    meta_hide_menu TINYINT UNSIGNED DEFAULT 0 COMMENT '是否隐藏菜单',
    meta_order_no INT UNSIGNED NULL COMMENT '菜单排序号',
    meta_frame_src VARCHAR(500) NULL COMMENT '内嵌iframe地址',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_sys_menu_parent_id (parent_id),
    KEY idx_sys_menu_menu_type (menu_type),
    KEY idx_sys_menu_permission (permission),
    KEY idx_sys_menu_path (path),
    KEY idx_sys_menu_status (status),
    KEY idx_sys_menu_is_deleted (is_deleted),
    KEY idx_sys_menu_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统菜单表';

-- ============================================
-- 系统部门表：组织架构部门信息
-- ============================================

CREATE TABLE IF NOT EXISTS sys_dept (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '部门ID',
    dept_code VARCHAR(50) NULL COMMENT '部门编码',
    dept_name VARCHAR(50) NOT NULL COMMENT '部门名称',
    description TEXT NULL COMMENT '部门描述',
    parent_id INT UNSIGNED DEFAULT 0 NOT NULL COMMENT '父部门ID',
    leader_id INT UNSIGNED NULL COMMENT '部门负责人ID',
    leader_name VARCHAR(50) NULL COMMENT '部门负责人姓名',

    -- 部门信息
    sort_order INT UNSIGNED DEFAULT 0 COMMENT '排序序号',
    dept_level INT UNSIGNED DEFAULT 1 COMMENT '部门层级',
    tree_path VARCHAR(500) DEFAULT '0' COMMENT '树路径（如：0.1.2）',
    ancestors TEXT NULL COMMENT '祖级列表（JSON数组）',

    -- 联系信息
    phone VARCHAR(20) NULL COMMENT '联系电话',
    email VARCHAR(100) NULL COMMENT '邮箱',
    address TEXT NULL COMMENT '地址',

    -- 状态管理
    status TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '状态 0:禁用 1:启用',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 约束
    UNIQUE KEY uk_sys_dept_dept_code (dept_code),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_sys_dept_parent_id (parent_id),
    KEY idx_sys_dept_tree_path (tree_path),
    KEY idx_sys_dept_status (status),
    KEY idx_sys_dept_is_deleted (is_deleted),
    KEY idx_sys_dept_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统部门表';

-- ============================================
-- 系统岗位表：存储岗位信息
-- ============================================

CREATE TABLE IF NOT EXISTS sys_post (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '岗位ID',
    post_code VARCHAR(50) NOT NULL COMMENT '岗位编码',
    post_name VARCHAR(50) NOT NULL COMMENT '岗位名称',
    description TEXT NULL COMMENT '岗位描述',

    -- 状态管理
    status TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '状态 0:禁用 1:启用',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 排序
    sort_order INT UNSIGNED DEFAULT 0 COMMENT '排序序号',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 约束
    UNIQUE KEY uk_sys_post_post_code (post_code),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_sys_post_status (status),
    KEY idx_sys_post_is_deleted (is_deleted),
    KEY idx_sys_post_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统岗位表';

-- ============================================
-- 系统用户和系统角色多对多关联表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_user_role (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    role_id INT UNSIGNED NOT NULL COMMENT '角色ID',

    -- 状态和审计
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',
    deleted_at DATETIME NULL COMMENT '删除时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',

    -- 约束
    UNIQUE KEY uk_sys_user_role_user_role (user_id, role_id),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_sys_user_role_user_id (user_id),
    KEY idx_sys_user_role_role_id (role_id),
    KEY idx_sys_user_role_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户角色关联表';

-- ============================================
-- 系统角色和系统菜单多对多关联表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_role_menu (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
    role_id INT UNSIGNED NOT NULL COMMENT '角色ID',
    menu_id INT UNSIGNED NOT NULL COMMENT '菜单ID',

    -- 权限类型（针对按钮）
    permission_type TINYINT UNSIGNED DEFAULT 1 COMMENT '1:查看 2:新增 3:编辑 4:删除 5:导入 6:导出',

    -- 状态和审计
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',
    deleted_at DATETIME NULL COMMENT '删除时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',

    -- 约束
    UNIQUE KEY uk_sys_role_menu_role_menu_perm (role_id, menu_id, permission_type),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_sys_role_menu_role_id (role_id),
    KEY idx_sys_role_menu_menu_id (menu_id),
    KEY idx_sys_role_menu_permission_type (permission_type),
    KEY idx_sys_role_menu_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统角色菜单关联表';

-- ============================================
-- 系统操作日志表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_operation_log (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',

    -- 用户信息
    user_id INT UNSIGNED NULL COMMENT '用户ID',
    username VARCHAR(50) NULL COMMENT '用户名',
    nickname VARCHAR(50) NULL COMMENT '昵称',

    -- 操作信息
    module VARCHAR(50) NOT NULL COMMENT '操作模块',
    operation_type VARCHAR(20) NOT NULL COMMENT '操作类型（CREATE, UPDATE, DELETE, LOGIN等）',
    operation_desc TEXT NULL COMMENT '操作描述',
    request_method VARCHAR(10) NULL COMMENT '请求方法',
    request_url TEXT NULL COMMENT '请求URL',

    -- 请求参数和结果
    request_params TEXT NULL COMMENT '请求参数（JSON格式）',
    response_result TEXT NULL COMMENT '响应结果',
    status_code INT NULL COMMENT '状态码',
    error_message TEXT NULL COMMENT '错误信息',

    -- 客户端信息
    ip_address VARCHAR(45) NULL COMMENT 'IP地址',
    user_agent TEXT NULL COMMENT '用户代理',
    location TEXT NULL COMMENT '地理位置',

    -- 性能信息
    execution_time INT NULL COMMENT '执行时间（毫秒）',

    -- 状态和审计
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_sys_log_user_id (user_id),
    KEY idx_sys_log_operation_type (operation_type),
    KEY idx_sys_log_module (module),
    KEY idx_sys_log_created_at (created_at),
    KEY idx_sys_log_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统操作日志表';

-- ============================================
-- 系统字典表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_dict (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '字典ID',

    -- 字典信息
    dict_type VARCHAR(50) NOT NULL COMMENT '字典类型',
    dict_code VARCHAR(50) NOT NULL COMMENT '字典编码',
    dict_value VARCHAR(200) NOT NULL COMMENT '字典值',
    dict_label VARCHAR(100) NOT NULL COMMENT '字典标签',
    description TEXT NULL COMMENT '字典描述',

    -- 显示设置
    sort_order INT UNSIGNED DEFAULT 0 COMMENT '排序序号',
    is_system TINYINT UNSIGNED DEFAULT 0 COMMENT '是否系统内置',
    is_default TINYINT UNSIGNED DEFAULT 0 COMMENT '是否默认',
    css_class VARCHAR(100) NULL COMMENT 'CSS样式',
    list_class VARCHAR(100) NULL COMMENT '列表样式',

    -- 状态管理
    status TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '状态',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',

    -- 软删除相关
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 约束
    UNIQUE KEY uk_sys_dict_type_code (dict_type, dict_code),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_sys_dict_type (dict_type),
    KEY idx_sys_dict_code (dict_code),
    KEY idx_sys_dict_status (status),
    KEY idx_sys_dict_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统字典表';

-- ============================================
-- 系统文件存储表
-- ============================================

CREATE TABLE IF NOT EXISTS sys_file (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '文件ID',
    file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path TEXT NOT NULL COMMENT '存储路径',
    file_url TEXT NOT NULL COMMENT '访问URL',

    -- 文件信息
    file_size BIGINT NOT NULL COMMENT '文件大小（字节）',
    file_type VARCHAR(100) NULL COMMENT '文件类型',
    file_extension VARCHAR(50) NULL COMMENT '文件扩展名',
    file_hash VARCHAR(64) NULL COMMENT '文件哈希值',

    -- 业务关联
    biz_type VARCHAR(50) NULL COMMENT '业务类型（avatar, document等）',
    biz_id VARCHAR(100) NULL COMMENT '业务ID',

    -- 状态管理
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',
    deleted_at DATETIME NULL COMMENT '删除时间',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_sys_file_biz_type (biz_type, biz_id),
    KEY idx_sys_file_created_by (created_by),
    KEY idx_sys_file_is_deleted (is_deleted),
    KEY idx_sys_file_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统文件存储表';

-- ============================================
-- 小区信息表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_community (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '小区ID',

    -- 基本信息
    community_code VARCHAR(50) NOT NULL COMMENT '小区编码',
    community_name VARCHAR(100) NOT NULL COMMENT '小区名称',
    community_address VARCHAR(200) NOT NULL COMMENT '小区地址',

    -- 建筑信息
    total_building_area DECIMAL(12,2) NOT NULL COMMENT '总建筑面积（㎡）',
    building_count INT NOT NULL COMMENT '楼栋数',
    unit_count INT NOT NULL COMMENT '单元数',
    household_count INT NOT NULL COMMENT '总户数',

    -- 分类信息
    community_type VARCHAR(20) NOT NULL DEFAULT 'RESIDENTIAL' COMMENT '小区类型：RESIDENTIAL(住宅), COMMERCIAL(商业), MIXED(混合)',
    property_type VARCHAR(20) NOT NULL DEFAULT 'OLD' COMMENT '物业类型：NEW(新建), OLD(老旧), REFURBISHED(改造)',

    -- 状态管理
    status TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '状态 0:停用 1:启用',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记 0:正常 1:删除',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号(乐观锁)',

    -- 软删除相关
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 约束
    UNIQUE KEY uk_idh_community_code (community_code),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_idh_community_name (community_name),
    KEY idx_idh_community_status (status),
    KEY idx_idh_community_is_deleted (is_deleted),
    KEY idx_idh_community_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小区信息表';

-- ============================================
-- 小区配置表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_community_config (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
    community_id INT UNSIGNED NOT NULL COMMENT '小区ID',

    -- 计价配置
    heating_unit_price DECIMAL(8,2) NOT NULL DEFAULT 5.80 COMMENT '供暖单价(元/㎡)',
    vacant_rate DECIMAL(5,4) NOT NULL DEFAULT 0.3 COMMENT '空置费率(比例)',
    discount_rate DECIMAL(5,4) DEFAULT 0 COMMENT '优惠折扣率',

    -- 收费配置
    is_default_community TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '是否默认小区 0:否 1:是',
    change_fund_amount DECIMAL(12,2) DEFAULT 0 COMMENT '备用金总额',

    -- 业务配置
    heating_season_start_month TINYINT UNSIGNED DEFAULT 11 COMMENT '供暖季开始月份',
    heating_season_start_day TINYINT UNSIGNED DEFAULT 15 COMMENT '供暖季开始日期',
    heating_season_end_month TINYINT UNSIGNED DEFAULT 3 COMMENT '供暖季结束月份',
    heating_season_end_day TINYINT UNSIGNED DEFAULT 31 COMMENT '供暖季结束日期',
    payment_deadline_days INT UNSIGNED DEFAULT 30 COMMENT '缴费截止天数',
    overdue_fine_rate DECIMAL(10,6) DEFAULT 0 COMMENT '滞纳金费率',

    -- 状态管理
    status TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '状态',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 软删除相关
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 约束
    UNIQUE KEY uk_idh_community_config_community (community_id),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_idh_community_config_default (is_default_community),
    KEY idx_idh_community_config_status (status),
    KEY idx_idh_community_config_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小区配置表';

-- ============================================
-- 客户信息表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_customer (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '客户ID',

    -- 所属小区
    community_id INT UNSIGNED NOT NULL COMMENT '小区ID',

    -- 房屋信息
    building_number VARCHAR(20) NOT NULL COMMENT '楼号',
    unit_number VARCHAR(20) NOT NULL COMMENT '单元号',
    room_number VARCHAR(20) NOT NULL COMMENT '房号',
    floor_number INT NULL COMMENT '楼层（可选）',
    house_type VARCHAR(20) DEFAULT 'RESIDENCE' COMMENT '户型：RESIDENCE(住宅), APARTMENT(公寓), VILLA(别墅), OFFICE(办公), SHOP(商铺)',

    -- 面积信息
    heating_area DECIMAL(10,2) NOT NULL COMMENT '供暖面积(㎡)',
    building_area DECIMAL(10,2) NULL COMMENT '建筑面积(㎡)',
    usable_area DECIMAL(10,2) NULL COMMENT '使用面积(㎡)',

    -- 业主信息
    owner_name VARCHAR(50) NOT NULL COMMENT '业主姓名',
    owner_gender VARCHAR(10) DEFAULT 'UNKNOWN' COMMENT '性别：MALE, FEMALE, UNKNOWN',
    owner_id_card VARCHAR(18) NULL COMMENT '身份证号',
    owner_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    owner_phone_backup VARCHAR(20) NULL COMMENT '备用电话',
    owner_email VARCHAR(100) NULL COMMENT '电子邮箱',
    owner_address TEXT NULL COMMENT '联系地址',

    -- 住户信息（如果与业主不同）
    resident_name VARCHAR(50) NULL COMMENT '实际居住人',
    resident_phone VARCHAR(20) NULL COMMENT '居住人电话',
    resident_relationship VARCHAR(20) NULL COMMENT '与业主关系',

    -- 业务状态
    occupancy_status VARCHAR(20) DEFAULT 'OCCUPIED' COMMENT '居住状态：OCCUPIED(自住), RENTED(出租), VACANT(空置)',
    heating_status VARCHAR(20) DEFAULT 'NORMAL' COMMENT '供暖状态：NORMAL(正常), SUSPENDED(停供), PARTIAL(部分)',
    customer_level VARCHAR(20) DEFAULT 'NORMAL' COMMENT '客户等级：VIP(重要), NORMAL(普通), FOCUS(关注)',

    -- 状态管理
    status TINYINT UNSIGNED DEFAULT 1 NOT NULL COMMENT '状态',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 软删除相关
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 约束
    UNIQUE KEY uk_idh_customer_room (community_id, building_number, unit_number, room_number),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_idh_customer_community (community_id),
    KEY idx_idh_customer_owner_phone (owner_phone),
    KEY idx_idh_customer_owner_name (owner_name),
    KEY idx_idh_customer_occupancy (occupancy_status),
    KEY idx_idh_customer_heating (heating_status),
    KEY idx_idh_customer_status (status),
    KEY idx_idh_customer_is_deleted (is_deleted),
    KEY idx_idh_customer_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户信息表';

-- ============================================
-- 供暖账单表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_heating_bill (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账单ID',

    -- 业务标识
    bill_no VARCHAR(50) NOT NULL COMMENT '账单编号',
    customer_id INT UNSIGNED NOT NULL COMMENT '客户ID',

    -- 计费信息
    heating_season VARCHAR(20) NOT NULL COMMENT '供暖季：如2025-2026',

    -- 费用明细
    heating_area DECIMAL(10,2) NOT NULL COMMENT '计费面积',
    unit_price DECIMAL(8,2) NOT NULL COMMENT '单价(元/㎡)',
    base_amount DECIMAL(12,2) NOT NULL COMMENT '基础费用',
    discount_amount DECIMAL(12,2) DEFAULT 0 COMMENT '优惠金额',
    penalty_amount DECIMAL(12,2) DEFAULT 0 COMMENT '违约金',
    other_fees DECIMAL(12,2) DEFAULT 0 COMMENT '其他费用',

    -- 应缴实缴
    should_pay DECIMAL(12,2) NOT NULL COMMENT '应缴总额',
    actual_pay DECIMAL(12,2) DEFAULT 0 COMMENT '实缴金额',
    arrears DECIMAL(12,2) DEFAULT 0 COMMENT '欠费',

    -- 缴费信息
    payment_status VARCHAR(20) DEFAULT 'UNPAID' COMMENT '缴费状态',
    payment_method VARCHAR(20) NULL COMMENT '支付方式',
    payment_date DATE NULL COMMENT '缴费日期',
    payment_transaction_no VARCHAR(100) NULL COMMENT '交易流水号',
    payment_operator_id INT UNSIGNED NULL COMMENT '收费员ID',

    -- 账单状态
    bill_status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '账单状态',
    due_date DATE NOT NULL COMMENT '截止日期',
    overdue_days INT UNSIGNED DEFAULT 0 COMMENT '逾期天数',
    is_settled TINYINT UNSIGNED DEFAULT 0 COMMENT '是否已结算',

    -- 状态管理
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 软删除相关
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 约束
    UNIQUE KEY uk_idh_heating_bill_no (bill_no),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_idh_bill_customer (customer_id),
    KEY idx_idh_bill_heating_season (heating_season),
    KEY idx_idh_bill_payment_status (payment_status),
    KEY idx_idh_bill_due_date (due_date),
    KEY idx_idh_bill_is_settled (is_settled),
    KEY idx_idh_bill_is_deleted (is_deleted),
    KEY idx_idh_bill_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供暖账单表';

-- ============================================
-- 工单表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_service_ticket (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '工单ID',

    -- 工单标识
    ticket_no VARCHAR(50) NOT NULL COMMENT '工单编号',
    ticket_title VARCHAR(200) NOT NULL COMMENT '工单标题',

    -- 关联信息
    customer_id INT UNSIGNED NOT NULL COMMENT '客户ID',
    related_bill_id INT UNSIGNED NULL COMMENT '关联账单ID',

    -- 工单分类
    ticket_type VARCHAR(20) NOT NULL COMMENT '工单类型',
    ticket_priority VARCHAR(20) DEFAULT 'NORMAL' COMMENT '工单优先级',

    -- 问题描述
    problem_description TEXT NOT NULL COMMENT '问题描述',
    customer_expectation TEXT NULL COMMENT '客户期望',
    attachments TEXT NULL COMMENT '附件列表(JSON格式)',

    -- 处理信息
    assigned_to INT UNSIGNED NULL COMMENT '指派给(用户ID)',
    processor_id INT UNSIGNED NULL COMMENT '实际处理人',
    process_start_time DATETIME NULL COMMENT '处理开始时间',
    process_end_time DATETIME NULL COMMENT '处理结束时间',
    actual_duration INT NULL COMMENT '实际耗时(分钟)',

    -- 处理结果
    process_result TEXT NULL COMMENT '处理结果',
    process_notes TEXT NULL COMMENT '处理说明',
    customer_feedback TEXT NULL COMMENT '客户反馈',
    satisfaction_rating TINYINT UNSIGNED NULL COMMENT '满意度评分 1-5',

    -- 状态跟踪
    ticket_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '工单状态',
    status_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '状态变更时间',
    next_followup_time DATETIME NULL COMMENT '下次跟进时间',

    -- SLA信息
    sla_level VARCHAR(20) NULL COMMENT 'SLA等级',
    response_deadline DATETIME NULL COMMENT '响应截止时间',
    resolve_deadline DATETIME NULL COMMENT '解决截止时间',
    is_overdue TINYINT UNSIGNED DEFAULT 0 COMMENT '是否超时',

    -- 状态管理
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 软删除相关
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 约束
    UNIQUE KEY uk_idh_service_ticket_no (ticket_no),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_idh_ticket_customer (customer_id),
    KEY idx_idh_ticket_type (ticket_type),
    KEY idx_idh_ticket_status (ticket_status),
    KEY idx_idh_ticket_priority (ticket_priority),
    KEY idx_idh_ticket_assigned_to (assigned_to),
    KEY idx_idh_ticket_created_at (created_at),
    KEY idx_idh_ticket_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单表';

-- ============================================
-- 收费记录表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_payment_record (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '收费记录ID',

    -- 交易标识
    payment_no VARCHAR(50) NOT NULL COMMENT '收费单号',
    receipt_no VARCHAR(50) NULL COMMENT '收据编号',
    transaction_no VARCHAR(100) NULL COMMENT '交易流水号',

    -- 关联信息
    customer_id INT UNSIGNED NOT NULL COMMENT '客户ID',
    collector_id INT UNSIGNED NOT NULL COMMENT '收费员ID',

    -- 账单信息
    related_bill_ids TEXT NOT NULL COMMENT '关联账单IDs(JSON数组)',
    bill_count INT NOT NULL COMMENT '账单数量',

    -- 金额信息
    should_pay DECIMAL(12,2) NOT NULL COMMENT '应缴总额',
    actual_receipt DECIMAL(12,2) NOT NULL COMMENT '实收金额',
    discount_amount DECIMAL(12,2) DEFAULT 0 COMMENT '优惠金额',
    penalty_amount DECIMAL(12,2) DEFAULT 0 COMMENT '违约金',
    should_change DECIMAL(12,2) DEFAULT 0 COMMENT '应找(元)',
    actual_change DECIMAL(12,2) DEFAULT 0 COMMENT '实找(元)',
    change_loss DECIMAL(12,2) DEFAULT 0 COMMENT '找零损耗(元)',

    -- 支付信息
    payment_method VARCHAR(20) NOT NULL COMMENT '支付方式',
    payment_channel VARCHAR(50) NULL COMMENT '支付渠道',
    payment_account VARCHAR(100) NULL COMMENT '支付账号',
    payment_date DATE NOT NULL COMMENT '缴费日期',
    payment_time TIME NOT NULL COMMENT '缴费时间',

    -- 收据信息
    is_receipt_issued TINYINT UNSIGNED DEFAULT 0 COMMENT '是否已开票',
    receipt_issued_at DATETIME NULL COMMENT '开票时间',
    receipt_issued_by INT UNSIGNED NULL COMMENT '开票人',

    -- 状态管理
    pay_status VARCHAR(20) DEFAULT 'COMPLETED' COMMENT '支付状态',
    reconciliation_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '对账状态',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 软删除相关
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 备注
    remark TEXT NULL COMMENT '备注信息',
    operator_notes TEXT NULL COMMENT '操作员备注',

    -- 约束
    UNIQUE KEY uk_idh_payment_payment_no (payment_no),
    UNIQUE KEY uk_idh_payment_receipt_no (receipt_no),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_idh_payment_customer (customer_id),
    KEY idx_idh_payment_collector (collector_id),
    KEY idx_idh_payment_date (payment_date),
    KEY idx_idh_payment_method (payment_method),
    KEY idx_idh_pay_status (pay_status),
    KEY idx_idh_payment_is_deleted (is_deleted),
    KEY idx_idh_payment_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收费记录表';

-- ============================================
-- 资金存现表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_fund_deposit (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '存现记录ID',

    -- 业务标识
    deposit_no VARCHAR(50) NOT NULL COMMENT '存现单号',
    community_id INT UNSIGNED NOT NULL COMMENT '小区ID',

    -- 存现信息
    deposit_date DATE NOT NULL COMMENT '存现日期',
    bank_name VARCHAR(100) NOT NULL COMMENT '银行名称',
    bank_account VARCHAR(100) NULL COMMENT '银行账号',
    deposit_amount DECIMAL(12,2) NOT NULL COMMENT '存现金额',

    -- 经办信息
    depositor_id INT UNSIGNED NOT NULL COMMENT '存现人ID',
    verifier_id INT UNSIGNED NULL COMMENT '审核人ID',
    deposit_time TIME NOT NULL COMMENT '存现时间',

    -- 状态管理
    deposit_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '存现状态',
    verification_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '审核状态',
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 软删除相关
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 备注
    remark TEXT NULL COMMENT '备注信息',
    verification_notes TEXT NULL COMMENT '审核备注',

    -- 约束
    UNIQUE KEY uk_idh_fund_deposit_no (deposit_no),

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_idh_deposit_community (community_id),
    KEY idx_idh_deposit_date (deposit_date),
    KEY idx_idh_deposit_depositor (depositor_id),
    KEY idx_idh_deposit_status (deposit_status),
    KEY idx_idh_deposit_is_deleted (is_deleted),
    KEY idx_idh_deposit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资金存现表';

-- ============================================
-- 测温记录表
-- ============================================

CREATE TABLE IF NOT EXISTS idh_temperature_record (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '测温记录ID',

    -- 关联信息
    ticket_id INT UNSIGNED NOT NULL COMMENT '工单ID',
    customer_id INT UNSIGNED NOT NULL COMMENT '客户ID',
    technician_id INT UNSIGNED NOT NULL COMMENT '测温人员ID',

    -- 测温信息
    measurement_date DATE NOT NULL COMMENT '测温日期',
    measurement_time TIME NOT NULL COMMENT '测温时间',
    measurement_location VARCHAR(100) NOT NULL COMMENT '测温地点',
    outdoor_temperature DECIMAL(5,2) NULL COMMENT '室外温度',
    weather_condition VARCHAR(50) NULL COMMENT '天气状况',

    -- 温度记录(JSON格式存储详细数据)
    temperature_data TEXT NOT NULL COMMENT '温度数据(JSON)',
    avg_temperature DECIMAL(5,2) NOT NULL COMMENT '平均温度',
    min_temperature DECIMAL(5,2) NOT NULL COMMENT '最低温度',
    max_temperature DECIMAL(5,2) NOT NULL COMMENT '最高温度',

    -- 设备信息
    device_model VARCHAR(100) NULL COMMENT '测温设备型号',
    device_sn VARCHAR(100) NULL COMMENT '设备序列号',
    calibration_date DATE NULL COMMENT '校准日期',

    -- 评估结果
    evaluation_result VARCHAR(20) NOT NULL COMMENT '测温评估结果',
    qualification_status VARCHAR(20) NOT NULL COMMENT '测温是否达标',
    adjustment_suggestion TEXT NULL COMMENT '调整建议',
    followup_action TEXT NULL COMMENT '后续措施',

    -- 状态管理
    is_deleted TINYINT UNSIGNED DEFAULT 0 NOT NULL COMMENT '删除标记',

    -- 审计字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    created_by INT UNSIGNED NULL COMMENT '创建人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '更新时间',
    updated_by INT UNSIGNED NULL COMMENT '更新人',
    version INT UNSIGNED DEFAULT 1 NOT NULL COMMENT '版本号',

    -- 软删除相关
    deleted_at DATETIME NULL COMMENT '删除时间',
    deleted_by INT UNSIGNED NULL COMMENT '删除人',

    -- 备注
    remarks TEXT NULL COMMENT '备注信息',
    customer_signature TEXT NULL COMMENT '客户签字(图片路径或base64)',

    -- 主键
    PRIMARY KEY (id),

    -- 索引
    KEY idx_idh_temp_ticket (ticket_id),
    KEY idx_idh_temp_customer (customer_id),
    KEY idx_idh_temp_date (measurement_date),
    KEY idx_idh_temp_technician (technician_id),
    KEY idx_idh_temp_evaluation (evaluation_result),
    KEY idx_idh_temp_is_deleted (is_deleted),
    KEY idx_idh_temp_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='测温记录表';

-- ============================================
-- 视图定义（MySQL 8.0+ 支持）
-- ============================================

-- 用户详情视图（包含部门、岗位信息）
DROP VIEW IF EXISTS v_user_detail;
CREATE ALGORITHM=MERGE VIEW v_user_detail AS
SELECT
    u.id,
    u.username,
    u.nickname,
    u.real_name,
    u.email,
    u.phone,
    u.avatar,
    u.status AS user_status,
    u.last_login_at,
    u.last_login_ip,

    -- 部门信息
    d.id AS dept_id,
    d.dept_name,
    d.dept_code,
    d.parent_id AS dept_parent_id,
    d.tree_path AS dept_tree_path,
    d.leader_id AS dept_leader_id,
    d.leader_name AS dept_leader_name,

    -- 岗位信息
    p.id AS post_id,
    p.post_code,
    p.post_name,

    -- 角色信息（聚合）
    GROUP_CONCAT(DISTINCT r.role_key SEPARATOR '|') AS role_keys,

    GROUP_CONCAT(DISTINCT r.role_name SEPARATOR ', ') AS role_names,

    -- 审计字段
    u.created_at,
    u.updated_at

FROM sys_user u
LEFT JOIN sys_dept d ON u.dept_id = d.id AND d.is_deleted = 0
LEFT JOIN sys_post p ON u.post_id = p.id AND p.is_deleted = 0
LEFT JOIN sys_user_role ur ON u.id = ur.user_id AND ur.is_deleted = 0
LEFT JOIN sys_role r ON ur.role_id = r.id AND r.is_deleted = 0
WHERE u.is_deleted = 0
GROUP BY u.id, u.username, u.nickname, u.real_name, u.email, u.phone, u.avatar, u.status, u.last_login_at, u.last_login_ip, d.id, d.dept_name, d.dept_code, d.parent_id, d.tree_path, d.leader_id, d.leader_name, p.id, p.post_code, p.post_name, u.created_at, u.updated_at;

-- 角色菜单权限视图
DROP VIEW IF EXISTS v_role_menu_permission;
CREATE ALGORITHM=MERGE VIEW v_role_menu_permission AS
SELECT
    r.id AS role_id,
    r.role_key,
    r.role_name,
    r.data_scope,

    m.id AS menu_id,
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
        WHEN m.menu_type = 3 THEN CONCAT(m.permission, ':', rm.permission_type)
        ELSE m.permission
    END AS full_permission

FROM sys_role r
JOIN sys_role_menu rm ON r.id = rm.role_id AND rm.is_deleted = 0
JOIN sys_menu m ON rm.menu_id = m.id AND m.is_deleted = 0
WHERE r.is_deleted = 0 AND r.status = 1
ORDER BY r.sort_order, m.sort_order;

-- 部门树形结构视图（使用递归CTE）
DROP VIEW IF EXISTS v_dept_tree;
CREATE ALGORITHM=UNDEFINED VIEW v_dept_tree AS
WITH RECURSIVE dept_tree AS (
    -- 顶级部门
    SELECT
        id,
        dept_name,
        dept_code,
        parent_id,
        tree_path,
        1 AS level,
        dept_name AS full_name,
        leader_name,
        sort_order
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
        CONCAT(dt.full_name, ' / ', d.dept_name) AS full_name,
        d.leader_name,
        d.sort_order
    FROM sys_dept d
    JOIN dept_tree dt ON d.parent_id = dt.id
    WHERE d.is_deleted = 0
)
SELECT * FROM dept_tree ORDER BY tree_path, sort_order;

-- 客户详情视图
DROP VIEW IF EXISTS v_customer_detail;
CREATE ALGORITHM=MERGE VIEW v_customer_detail AS
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
DROP VIEW IF EXISTS v_bill_summary;
CREATE ALGORITHM=MERGE VIEW v_bill_summary AS
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
    END AS payment_status_name
FROM idh_heating_bill b
JOIN idh_customer c ON b.customer_id = c.id AND c.is_deleted = 0
LEFT JOIN idh_community com ON c.community_id = com.id AND com.is_deleted = 0
WHERE b.is_deleted = 0;

-- 工单详情视图
DROP VIEW IF EXISTS v_ticket_detail;
CREATE ALGORITHM=MERGE VIEW v_ticket_detail AS
SELECT
    t.*,
    c.owner_name,
    c.owner_phone,
    CONCAT(c.building_number, '栋', c.unit_number, '单元', c.room_number, '室') AS full_address,
    com.community_name,
    creator.username AS creator_name,
    processor.username AS processor_name,
    assigned.username AS assigned_name
FROM idh_service_ticket t
JOIN idh_customer c ON t.customer_id = c.id AND c.is_deleted = 0
LEFT JOIN idh_community com ON c.community_id = com.id AND com.is_deleted = 0
LEFT JOIN sys_user creator ON t.created_by = creator.id
LEFT JOIN sys_user processor ON t.processor_id = processor.id
LEFT JOIN sys_user assigned ON t.assigned_to = assigned.id
WHERE t.is_deleted = 0;

-- 收费统计视图
DROP VIEW IF EXISTS v_payment_statistics;
CREATE ALGORITHM=UNDEFINED VIEW v_payment_statistics AS
SELECT
    DATE(p.payment_date) AS pay_date,
    p.payment_method,
    COUNT(*) AS payment_count,
    SUM(p.actual_receipt) AS total_receipt,
    COUNT(DISTINCT p.customer_id) AS customer_count,
    GROUP_CONCAT(DISTINCT c.community_name SEPARATOR ',') AS communities
FROM idh_payment_record p
JOIN idh_customer c ON p.customer_id = c.id AND c.is_deleted = 0
WHERE p.is_deleted = 0 AND p.pay_status = 'COMPLETED'
GROUP BY DATE(p.payment_date), p.payment_method;

-- 小区统计视图
DROP VIEW IF EXISTS v_community_stats;
CREATE ALGORITHM=UNDEFINED VIEW v_community_stats AS
SELECT
    c.id,
    c.community_name,
    c.community_address,
    c.total_building_area,
    c.building_count,
    c.household_count,
    COUNT(DISTINCT cust.id) AS customer_count,
    COUNT(DISTINCT bill.id) AS bill_count,
    SUM(CASE WHEN bill.payment_status = 'PAID' THEN bill.actual_pay ELSE 0 END) AS total_paid,
    SUM(CASE WHEN bill.payment_status = 'UNPAID' THEN bill.should_pay ELSE 0 END) AS total_unpaid
FROM idh_community c
LEFT JOIN idh_customer cust ON c.id = cust.community_id AND cust.is_deleted = 0 AND cust.status = 1
LEFT JOIN idh_heating_bill bill ON cust.id = bill.customer_id AND bill.is_deleted = 0
WHERE c.is_deleted = 0
GROUP BY c.id, c.community_name, c.community_address, c.total_building_area, c.building_count, c.household_count;

-- ============================================
-- 初始化数据
-- ============================================

-- 1. 初始化超级管理员用户 (密码: admin123，使用bcrypt哈希)
INSERT INTO sys_user (username, nickname, email, password_hash, status, is_system) VALUES
('admin', '超级管理员', 'phoenixkyo119@163.com', '$2a$10$i4QLSdJUQyLZq8hd/BUETuNTAh6.1i6PyfWCsB2wpa7YlfKETYatG', 1, 1);

-- 2. 初始化角色
INSERT INTO sys_role (role_key, role_name, description, is_system, data_scope, sort_order, status, created_by, updated_by) VALUES
('admin', '超级管理员', '拥有系统所有权限', 1, 1, 1, 1, 1, 1),
('operator', '操作员', '普通操作员角色', 1, 5, 2, 1, 1, 1),
('viewer', '查看员', '只读权限角色', 1, 5, 3, 1, 1, 1),
('collector', '收费员', '收费权限角色', 1, 5, 4, 1, 1, 1),
('technician', '技术员', '技术处理角色', 1, 5, 5, 1, 1, 1);

-- 3. 初始化部门
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
INSERT INTO sys_user_role (user_id, role_id, created_by)
SELECT
    (SELECT id FROM sys_user WHERE username = 'admin'),
    (SELECT id FROM sys_role WHERE role_key = 'admin'),
    (SELECT id FROM sys_user WHERE username = 'admin');

-- 6. 初始化系统菜单
INSERT INTO sys_menu (parent_id, menu_type, menu_name, permission, path, component, icon, sort_order, status, created_by, updated_by)
SELECT 0, 2, '仪表板', 'dashboard', '/dashboard', '/dashboard/index', 'ep:home-filled', 1, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE menu_name = '仪表板');

-- 系统管理目录
INSERT INTO sys_menu (parent_id, menu_type, menu_name, permission, path, component, icon, sort_order, status, created_by, updated_by)
SELECT 0, 1, '系统管理', 'system', '/system', 'LAYOUT', 'ep:setting', 100, 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE menu_name = '系统管理');

-- 7. 初始化测试小区数据
INSERT INTO idh_community (community_code, community_name, community_address, total_building_area, building_count, unit_count, household_count, community_type, property_type, status, created_by, updated_by) VALUES
('XQ001', '花园小区', '西安市雁塔区科技路123号', 85000.50, 15, 45, 750, 'RESIDENTIAL', 'OLD', 1, 1, 1),
('XQ002', '阳光新城', '西安市未央区凤城五路456号', 120000.00, 20, 60, 1200, 'RESIDENTIAL', 'NEW', 1, 1, 1),
('XQ003', '商业中心', '西安市碑林区东大街789号', 50000.00, 8, 24, 200, 'COMMERCIAL', 'REFURBISHED', 1, 1, 1);

-- 8. 初始化小区配置
INSERT INTO idh_community_config (community_id, heating_unit_price, vacant_rate, discount_rate, heating_season_start_month, heating_season_start_day, heating_season_end_month, heating_season_end_day, payment_deadline_days, overdue_fine_rate, status, created_by, updated_by) VALUES
(1, 5.80, 0.30, 0.05, 11, 15, 3, 31, 30, 0.0005, 1, 1, 1),
(2, 6.00, 0.25, 0.08, 11, 15, 3, 31, 30, 0.0005, 1, 1, 1),
(3, 7.50, 0.20, 0.00, 11, 15, 3, 31, 30, 0.001, 1, 1, 1);

-- 9. 初始化测试客户数据
INSERT INTO idh_customer (community_id, building_number, unit_number, room_number, floor_number, house_type, heating_area, building_area, usable_area, owner_name, owner_gender, owner_id_card, owner_phone, owner_email, occupancy_status, heating_status, customer_level, status, created_by, updated_by) VALUES
(1, '1', '1', '101', 1, 'RESIDENCE', 85.50, 98.00, 82.00, '张三', 'MALE', '610102198001010011', '13800138001', 'zhangsan@example.com', 'OCCUPIED', 'NORMAL', 'NORMAL', 1, 1, 1),
(1, '1', '1', '102', 1, 'RESIDENCE', 89.00, 102.00, 85.00, '李四', 'FEMALE', '610102198002020022', '13800138002', 'lisi@example.com', 'RENTED', 'NORMAL', 'NORMAL', 1, 1, 1),
(1, '2', '1', '201', 2, 'RESIDENCE', 92.00, 106.00, 88.00, '王五', 'MALE', '610102198003030033', '13800138003', 'wangwu@example.com', 'OCCUPIED', 'NORMAL', 'VIP', 1, 1, 1),
(2, '3', '2', '301', 3, 'APARTMENT', 75.00, 86.00, 72.00, '赵六', 'FEMALE', '610102198004040044', '13800138004', 'zhaoliu@example.com', 'OCCUPIED', 'SUSPENDED', 'NORMAL', 1, 1, 1);

-- 10. 初始化测试账单数据
INSERT INTO idh_heating_bill (bill_no, customer_id, heating_season, heating_area, unit_price, base_amount, should_pay, actual_pay, arrears, payment_status, due_date, bill_status, created_by, updated_by) VALUES
('BILL20240001', 1, '2024-2025', 85.50, 5.80, 495.90, 495.90, 495.90, 0.00, 'PAID', '2024-12-31', 'ACTIVE', 1, 1),
('BILL20240002', 2, '2024-2025', 89.00, 5.80, 516.20, 516.20, 0.00, 516.20, 'UNPAID', '2024-12-31', 'ACTIVE', 1, 1),
('BILL20240003', 3, '2024-2025', 92.00, 5.80, 533.60, 533.60, 300.00, 233.60, 'PARTIAL', '2024-12-31', 'ACTIVE', 1, 1),
('BILL20240004', 4, '2024-2025', 75.00, 6.00, 450.00, 450.00, 0.00, 450.00, 'UNPAID', '2024-12-31', 'ACTIVE', 1, 1);

-- 11. 初始化测试工单数据
INSERT INTO idh_service_ticket (ticket_no, ticket_title, customer_id, ticket_type, ticket_priority, problem_description, ticket_status, created_by, updated_by) VALUES
('TICKET20240001', '暖气片不热报修', 1, 'REPAIR', 'NORMAL', '客厅暖气片温度不达标，只有15度左右', 'RESOLVED', 1, 1),
('TICKET20240002', '缴费咨询', 2, 'CONSULTATION', 'LOW', '咨询今年的缴费政策和优惠', 'CLOSED', 1, 1),
('TICKET20240003', '温度不达标投诉', 3, 'COMPLAINT_SUB', 'HIGH', '卧室温度只有16度，多次报修未解决', 'IN_PROGRESS', 1, 1),
('TICKET20240004', '测温申请', 4, 'TEMPERATURE', 'NORMAL', '申请进行室内温度测量', 'PENDING', 1, 1);

-- 12. 初始化测试收费记录
INSERT INTO idh_payment_record (payment_no, customer_id, collector_id, related_bill_ids, bill_count, should_pay, actual_receipt, payment_method, payment_date, payment_time, pay_status, created_by, updated_by) VALUES
('PAY20240001', 1, 1, '[1]', 1, 495.90, 500.00, 'CASH', '2024-01-15', '14:30:00', 'COMPLETED', 1, 1),
('PAY20240002', 3, 1, '[3]', 1, 533.60, 300.00, 'WECHAT', '2024-01-16', '10:15:00', 'PARTIAL', 1, 1);

-- 13. 初始化数据字典
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
('GENDER', '0', '0', '未知', '性别：未知', 1, 1, 1, 1, 1, 1),
('GENDER', '1', '1', '男', '性别：男', 2, 1, 0, 1, 1, 1),
('GENDER', '2', '2', '女', '性别：女', 3, 1, 0, 1, 1, 1),
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

-- ============================================
-- 完成初始化
-- ============================================

-- 设置外键约束检查
SET FOREIGN_KEY_CHECKS = 1;

-- 打印初始化完成信息
SELECT '数据库初始化完成!' AS message;

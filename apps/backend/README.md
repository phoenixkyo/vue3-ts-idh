# @vben/backend

## Description

Vben Admin 数据服务现已重构为基于 SQLite 数据库的完整后端服务，为前端开发提供真实的数据持久化支持。该服务模拟真实后端环境，支持完整的 CRUD 操作、复杂业务逻辑和文件上传等功能。这里使用了真实的后端服务来实现。唯一麻烦的是本地需要同时启动后端服务和前端服务，但是这样可以更好的模拟真实环境。该服务不需要手动启动，已经集成在 vite 插件内，随应用一起启用。

## Running the app

```bash
# development
$ pnpm run start

# production mode
$ pnpm run build
```

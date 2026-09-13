# dsh-rdb

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）的
关系数据库工作台插件：在 Web 界面侧边栏加一个「数据库」入口，面板里按条
记录数据库连接，左栏是连接与对象树（schema、表、视图），右侧分「数据」
「结构」「SQL」三个页签：翻页浏览、过滤、排序、双击改值、新增删除行并按
主键生成 SQL 预览后一次性提交；查看列、索引、DDL；SQL 编辑器执行任意语句
并导出 CSV。一个开关决定是否把 `db_*` 工具注入给 agent，每条连接单独控制
是否允许 agent 写入。

支持 SQLite（Node 内置 `node:sqlite`，无原生扩展）、PostgreSQL（`pg`）、
华为云 GaussDB（`gaussdb-node`）。

## 安装

```sh
dsh plugin --profile web add dsh-rdb            # 发布到 npm 之后
dsh plugin --profile web add file:./dsh-rdb-0.1.0.tgz   # 离线包
```

桌面版在「插件 → 配置中心 → 插件 → 从 .tgz 安装」选中包即可，重启生效。
驱动已打进 `lib/index.js`，没有运行时依赖。

## 使用

1. 侧边栏点「数据库」，左栏「+ 新增」选类型：SQLite 填数据库文件路径；
   PostgreSQL / GaussDB 填主机、端口、数据库、用户名、密码，可勾选 SSL。
   可选项：显示名称（默认 `数据库@主机` 或文件名，agent 用它引用这条连接）、
   「允许 agent 写入」（不勾时 agent 只能读）。「测试连接」返回服务端版本和延迟。
2. 对象树按 schema 切换，列出表和视图，支持名称过滤。选中一张表：
   - 数据：每页 100 行，列头点击排序，单列过滤（`=`、`like`、`is null` 等），
     双击单元格编辑（`∅` 置 NULL，Esc 取消），「新增行」「删除所选」，
     底部「保存改动」先展示将要执行的 SQL，确认后在一个事务里提交。
     没有主键的表只读，视图只读。「导出 CSV」下载整表。
   - 结构：列（类型、可空、默认值、主键）、索引、DDL。
   - SQL：Ctrl+Enter 执行光标所选或全部文本（单条语句），结果最多 1000 行，
     可导出；会改数据的语句先弹确认。
3. 顶部「允许 agent 使用」开关打开后，agent 获得这些工具：
   `db_connections`（列连接）、`db_schema`（列表 / 描述表）、`db_query`
   （只读，单条，最多 500 行）、`db_explain`（执行计划）、`db_execute`
   （事务写入，需连接勾选「允许 agent 写入」且 `confirm=true`，工具描述要求
   agent 先把 SQL 给用户确认）。关掉开关工具立刻注销。开关和连接都存在
   `~/.dsh/dsh-rdb.json`（0600），保存即生效，无需重启。

## 安全边界

- 密码以明文存在用户主目录私有文件里（与 dsh-ssh、dsh-s3 同一信任模型），
  不返回给浏览器或 agent。
- `/api/dsh-rdb/*` 路由只接受本机回环地址，并要求 dsh web 自己的浏览器
  会话 cookie；没有 cookie 的本地进程得到 401。
- `db_query` / `db_explain` 在服务端做只读判定（拒绝 DML、DDL、
  `select … into`、`for update` 等），与前端判定无关；`db_execute`
  再叠加连接级写入开关。
- 每条语句带 `statement_timeout`（默认 30 s），结果按行数截断
  （GUI 1000 行、工具 500 行、CSV 导出 10 万行）。

## 开发

```sh
npm install
npm run build        # esbuild：lib/index.js（host，ESM，内联 pg / gaussdb-node）
                     #         lib/client.js（浏览器半边，dsh 模块加载器封装）
npm run typecheck
npm pack             # 打出 dsh-rdb-<版本>.tgz
```

容器 / 无头环境验证：用 `DSH_HOME=<临时目录> dsh plugin --profile web add
file:<tgz>` 装进临时 profile，`dsh web --no-open --port 0` 启动后用就绪行里的
token URL 换 cookie，再打 `/api/dsh-rdb/*`；GUI 用 Playwright 打开 token URL
点侧边栏「数据库」即可截图。同一个 token 只能换一次 cookie，换浏览器要重启
dsh web；pnpm 对同版本号的 file: 包会复用 store 里的旧内容，迭代时先
`plugin remove` 再 add。

## 许可

MIT

# dsh-rdb

Relational database workbench for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`). Adds a "Database" entry to the web GUI sidebar: saved connections, a schema/table/view tree, a paged data grid with filters, sorting and inline edits committed as one previewed transaction, a structure view (columns, indexes, DDL), a SQL editor with CSV export — and a single switch that injects the `db_*` toolset into the agent (`db_connections`, `db_schema`, `db_query`, `db_explain`, `db_execute`). Writes by the agent are gated per connection.

Supports SQLite (`node:sqlite`, no native addon), PostgreSQL (`pg`) and Huawei Cloud GaussDB (`gaussdb-node`). Drivers are bundled, so the package has no runtime dependencies.

```sh
dsh plugin --profile web add dsh-rdb
# or, from a packed tarball:
dsh plugin --profile web add file:./dsh-rdb-0.1.0.tgz
```

Connections live in `~/.dsh/dsh-rdb.json` (mode 0600); passwords never reach the browser or the agent. Routes are loopback-only and require the GUI's browser-session cookie. `db_query` is read-only by server-side classification; `db_execute` requires the connection's "allow agent writes" flag and `confirm=true`. See [README.zh.md](README.zh.md) for the full guide (Chinese).

MIT

# Tuxun Admin FE 契约文件管理说明

本目录为 `tuxun-admin-fe` 消费的后端 API 契约只读镜像与守卫脚本。

## 📁 目录结构

```text
contract/
├── apifox-import.json     # OpenAPI / Apifox 导出文件 (只读镜像，生成 schema.d.ts 的输入)
├── api.md                 # 接口可读文档镜像
├── check-contract.py      # 契约结构与规范静态校验脚本
└── README.md              # 本说明文档
```

## ⚠️ 维护规则

1. **只读镜像**：本目录下的契约文件（`apifox-import.json` 与 `api.md`）为后端 repository（`tu-xun/docs/`）的镜像，**禁止在本仓手动修改接口定义**。
2. **生成物提交**：根据 `apifox-import.json` 生成的类型定义位于 `src/service/contract/schema.d.ts`，生成物需提交进 Git，以便在 PR/Commit 中对比破坏性变更。

## 🔄 契约升级 SOP

当后端契约更新时，请按以下步骤同步：

1. **镜像更新**：从后端仓复制最新的 `apifox-import.json` 和 `api.md` 覆盖本目录同名文件。
2. **重新生成 TS 类型**：

   ```bash
   pnpm gen:api-types
   ```

3. **结构校验**：

   ```bash
   pnpm check:contract
   ```

4. **编译检查与破坏性变更修复**（关键）：

   ```bash
   pnpm typecheck
   ```

   破坏性变更（如字段重命名、删减或类型改变）会在 `typecheck` 时表现为 TS 编译错误，按报错逐个修复 `src/service/` 与 `src/views/`。

5. **Mock 同步**：同步更新 `src/mocks/` 假数据。
6. **提交**：将 `contract/` 与关联的 `src/` 改动合并在同一个 Commit 中提交。

> **跨仓契约一致性**：`contract/` 与 `tuxun-fe/contract/` 应保持同版本（两端理解不可能不一致是排查联调问题的前提）。两仓 `api.md` 逐字节一致；`apifox-import.json` 可能有纯格式差异（数组换行风格），比对时用归一化哈希忽略格式：
>
> ```bash
> uv run python -c "import json,sys;print(json.dumps(json.load(open(sys.argv[1])),sort_keys=True))" contract/apifox-import.json | md5sum
> ```

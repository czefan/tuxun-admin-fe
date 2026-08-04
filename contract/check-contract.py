#!/usr/bin/env python3
"""
Tuxun Admin FE 契约文件校验脚本
使用方法: uv run python ./contract/check-contract.py
"""

import json
import re
import sys
from pathlib import Path

CONTRACT_DIR = Path(__file__).parent.resolve()
JSON_PATH = CONTRACT_DIR / "apifox-import.json"
MD_PATH = CONTRACT_DIR / "api.md"

def log_error(msg: str):
    print(f"\033[31m[ERROR]\033[0m {msg}")

def log_warn(msg: str):
    print(f"\033[33m[WARN]\033[0m {msg}")

def log_info(msg: str):
    print(f"\033[32m[INFO]\033[0m {msg}")

def resolve_ref(doc: dict, ref: str) -> bool:
    if not ref.startswith("#/"):
        return False
    parts = ref.lstrip("#/").split("/")
    curr = doc
    for part in parts:
        part = part.replace("~1", "/").replace("~0", "~")
        if isinstance(curr, dict) and part in curr:
            curr = curr[part]
        else:
            return False
    return True

def check_contract():
    errors = 0
    warnings = 0

    if not JSON_PATH.exists():
        log_error(f"契约文件不存在: {JSON_PATH}")
        sys.exit(1)
    
    if not MD_PATH.exists():
        log_error(f"契约 MD 文档不存在: {MD_PATH}")
        sys.exit(1)

    log_info("1. 正在校验 apifox-import.json JSON 结构与合法性...")
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        log_error(f"JSON 解析失败: {e}")
        sys.exit(1)

    # 收集所有的 operationId 和 (method, path)
    operation_ids = set()
    json_endpoints = set()

    paths = data.get("paths", {})
    
    def walk_and_check_node(node, path_str="root"):
        nonlocal errors, warnings
        if isinstance(node, dict):
            # 检查 $ref 不得有同级键
            if "$ref" in node and len(node) > 1:
                extra_keys = [k for k in node.keys() if k != "$ref"]
                log_warn(f"在 {path_str} 发现 $ref 的同级键 ({', '.join(extra_keys)})，OpenAPI 3.0 可能会忽略同级属性")
                warnings += 1

            # 检查 $ref 解析
            if "$ref" in node:
                ref = node["$ref"]
                if not resolve_ref(data, ref):
                    log_error(f"在 {path_str} 发现无法解析的 $ref: '{ref}'")
                    errors += 1

            # 检查 nullable: true 的 enum
            if node.get("nullable") is True and "enum" in node:
                enum_vals = node["enum"]
                if None not in enum_vals:
                    log_warn(f"在 {path_str} 发现 nullable: true 但 enum 中未包含 null/None: {enum_vals}")
                    warnings += 1

            for k, v in node.items():
                walk_and_check_node(v, f"{path_str}.{k}")
        elif isinstance(node, list):
            for idx, item in enumerate(node):
                walk_and_check_node(item, f"{path_str}[{idx}]")

    log_info("2. 正在校验 operationId 唯一性、$ref 可解析性与 OpenAPI 细节规约...")
    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, detail in methods.items():
            if method.lower() not in ["get", "post", "put", "delete", "patch", "options", "head"]:
                continue
            
            endpoint = (method.upper(), path)
            json_endpoints.add(endpoint)

            if isinstance(detail, dict):
                op_id = detail.get("operationId")
                if op_id:
                    if op_id in operation_ids:
                        log_error(f"发现重复的 operationId: '{op_id}' (接口: {method.upper()} {path})")
                        errors += 1
                    else:
                        operation_ids.add(op_id)
    
    walk_and_check_node(data)

    log_info("3. 正在校验 api.md 与 apifox-import.json 接口列表一致性...")
    md_content = MD_PATH.read_text(encoding="utf-8")
    # 匹配 md 中的接口标题，例如 `GET /api/test/login` 或 `POST /admin/mall/goods`
    md_matches = re.findall(r"(GET|POST|PUT|DELETE|PATCH)\s+([^\s\n`]+)", md_content)
    md_endpoints = set()
    for method, path in md_matches:
        p = path.strip().split("?")[0]
        if p.startswith("/api"):
            p = p[4:]
        if not p.startswith("/"):
            p = "/" + p
        md_endpoints.add((method.upper(), p))

    # 检查 JSON 有但 MD 没有的
    missing_in_md = json_endpoints - md_endpoints
    if missing_in_md:
        for method, path in missing_in_md:
            log_warn(f"接口 {method} {path} 存在于 JSON 中，但未在 api.md 中找到对应文档")
            warnings += 1

    # 检查 MD 有但 JSON 没有的
    missing_in_json = md_endpoints - json_endpoints
    if missing_in_json:
        for method, path in missing_in_json:
            log_error(f"接口 {method} {path} 存在于 api.md 中，但在 apifox-import.json 中未找到")
            errors += 1

    print("\n--- 契约校验总结 ---")
    log_info(f"JSON 接口总数: {len(json_endpoints)}, MD 接口总数: {len(md_endpoints)}")
    if warnings > 0:
        log_warn(f"共发现 {warnings} 处警告 (Warnings)")
    
    if errors > 0:
        log_error(f"校验未通过！共发现 {errors} 处错误 (Errors)")
        sys.exit(1)
    else:
        log_info("契约校验全部通过！✅")

if __name__ == "__main__":
    check_contract()

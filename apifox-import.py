#!/usr/bin/env python3
"""
Batch import OpenAPI 3.0 spec into Apifox project via REST API.
Usage: python3 apifox-import.py
"""

import json
import time
import urllib.request
import urllib.error

TOKEN = "afxp_b707e26InDtPKkDG8d1gh0TXlMDouly34YvB"
BASE = "https://app.apifox.com/api/v1"
PROJECT_ID = "7870815"
OPENAPI_FILE = "idropin-openapi.json"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "X-Apifox-Api-Version": "2024-03-28",
    "Content-Type": "application/json",
}


def apifox_request(method, path, body=None):
    url = f"{BASE}/{path}"
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())
    except Exception as e:
        return {"success": False, "error": str(e)}


def oas_schema_to_apifox(schema):
    """Convert OAS3 schema to Apifox jsonSchema format."""
    if not schema:
        return {"type": "object", "properties": {}}
    result = {}
    if "$ref" in schema:
        # inline ref name as description — we skip deep resolution for speed
        result["type"] = "object"
        result["description"] = schema["$ref"].split("/")[-1]
        return result
    for key in (
        "type",
        "format",
        "description",
        "example",
        "enum",
        "minimum",
        "maximum",
        "minLength",
        "maxLength",
        "pattern",
        "default",
        "nullable",
    ):
        if key in schema:
            result[key] = schema[key]
    if "properties" in schema:
        result["type"] = result.get("type", "object")
        result["properties"] = {
            k: oas_schema_to_apifox(v) for k, v in schema["properties"].items()
        }
    if "items" in schema:
        result["type"] = result.get("type", "array")
        result["items"] = oas_schema_to_apifox(schema["items"])
    if "required" in schema:
        result["required"] = schema["required"]
    if "allOf" in schema:
        merged = {"type": "object", "properties": {}}
        for sub in schema["allOf"]:
            converted = oas_schema_to_apifox(sub)
            merged["properties"].update(converted.get("properties", {}))
        result.update(merged)
    return result or {"type": "object"}


def resolve_ref(spec, ref):
    """Resolve $ref within the same document."""
    if not ref.startswith("#/"):
        return {}
    parts = ref.lstrip("#/").split("/")
    node = spec
    for part in parts:
        node = node.get(part, {})
    return node


def build_request_body(spec, operation):
    rb = operation.get("requestBody", {})
    if not rb:
        return {"type": "none"}

    content = rb.get("content", {})
    if "application/json" in content:
        schema = content["application/json"].get("schema", {})
        if "$ref" in schema:
            schema = resolve_ref(spec, schema["$ref"])
        return {
            "type": "application/json",
            "jsonSchema": oas_schema_to_apifox(schema),
            "description": rb.get("description", ""),
        }
    if "multipart/form-data" in content:
        schema = content["multipart/form-data"].get("schema", {})
        if "$ref" in schema:
            schema = resolve_ref(spec, schema["$ref"])
        props = schema.get("properties", {})
        params = []
        for name, s in props.items():
            params.append(
                {
                    "name": name,
                    "type": s.get("type", "string"),
                    "description": s.get("description", ""),
                    "required": name in schema.get("required", []),
                }
            )
        return {"type": "multipart/form-data", "parameters": params}
    if "application/x-www-form-urlencoded" in content:
        schema = content["application/x-www-form-urlencoded"].get("schema", {})
        if "$ref" in schema:
            schema = resolve_ref(spec, schema["$ref"])
        props = schema.get("properties", {})
        params = []
        for name, s in props.items():
            params.append(
                {
                    "name": name,
                    "type": s.get("type", "string"),
                    "description": s.get("description", ""),
                    "required": name in schema.get("required", []),
                }
            )
        return {"type": "application/x-www-form-urlencoded", "parameters": params}
    # fallback
    return {"type": "none"}


def build_parameters(spec, operation):
    params = {"header": [], "query": [], "path": [], "cookie": []}
    for p in operation.get("parameters", []):
        if "$ref" in p:
            p = resolve_ref(spec, p["$ref"])
        schema = p.get("schema", {})
        if "$ref" in schema:
            schema = resolve_ref(spec, schema["$ref"])
        entry = {
            "name": p.get("name", ""),
            "type": schema.get("type", "string"),
            "description": p.get("description", schema.get("description", "")),
            "required": p.get("required", False),
            "example": str(p.get("example", schema.get("example", ""))),
        }
        loc = p.get("in", "query")
        if loc in params:
            params[loc].append(entry)
    return params


def build_responses(spec, operation):
    responses = []
    for code, resp_obj in operation.get("responses", {}).items():
        if "$ref" in resp_obj:
            resp_obj = resolve_ref(spec, resp_obj["$ref"])
        try:
            status_code = int(code)
        except ValueError:
            continue
        content = resp_obj.get("content", {})
        schema = {}
        if "application/json" in content:
            schema = content["application/json"].get("schema", {})
            if "$ref" in schema:
                schema = resolve_ref(spec, schema["$ref"])
        responses.append(
            {
                "name": "成功" if status_code == 200 else f"HTTP {status_code}",
                "code": status_code,
                "contentType": "json",
                "jsonSchema": oas_schema_to_apifox(schema)
                if schema
                else {"type": "object", "properties": {}},
                "description": resp_obj.get("description", ""),
            }
        )
    if not responses:
        responses.append(
            {
                "name": "成功",
                "code": 200,
                "contentType": "json",
                "jsonSchema": {"type": "object", "properties": {}},
            }
        )
    return responses


def import_all():
    with open(OPENAPI_FILE, "r", encoding="utf-8") as f:
        spec = json.load(f)

    paths = spec.get("paths", {})
    total = sum(len(v) for v in paths.values())
    print(f"📦 Found {len(paths)} paths, {total} operations to import")

    ok = 0
    fail = 0
    errors = []

    for path, path_item in paths.items():
        for method, operation in path_item.items():
            if method.upper() not in (
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "HEAD",
                "OPTIONS",
            ):
                continue

            tags = operation.get("tags", ["其他"])
            summary = operation.get("summary", "")
            description = operation.get("description", "")
            name = summary or f"{method.upper()} {path}"

            body = {
                "method": method.upper(),
                "path": path,
                "name": name,
                "status": "released",
                "tags": tags,
                "description": description,
                "parameters": build_parameters(spec, operation),
                "requestBody": build_request_body(spec, operation),
                "responses": build_responses(spec, operation),
            }

            if operation.get("operationId"):
                body["operationId"] = operation["operationId"]

            result = apifox_request("POST", f"projects/{PROJECT_ID}/http-apis", body)

            if result.get("success"):
                ok += 1
                api_id = result["data"]["id"]
                print(f"  ✅ [{ok}/{total}] {method.upper()} {path} → id={api_id}")
            else:
                fail += 1
                err_msg = result.get("errorMessage", result.get("error", "unknown"))
                print(f"  ❌ [{fail} fails] {method.upper()} {path} → {err_msg}")
                errors.append({"path": path, "method": method, "error": err_msg})

            # Rate limiting: 10 req/s max
            time.sleep(0.12)

    print(f"\n{'=' * 50}")
    print(f"✅ Success: {ok}/{total}")
    print(f"❌ Failed:  {fail}/{total}")
    if errors:
        print("\nFailed APIs:")
        for e in errors:
            print(f"  {e['method'].upper()} {e['path']}: {e['error']}")


if __name__ == "__main__":
    import_all()

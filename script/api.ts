import { generateApi } from "swagger-typescript-api";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import type { IncomingMessage } from "http";
import { mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, existsSync } from "fs";
import os from "os";
import readline from "readline/promises";
import type {
  HttpMethod,
  HttpMethodUpper,
  ModulePlanItem,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIPathItem,
  OpenAPISchema,
  OpenAPISwagger,
  OperationInfo,
  TagOperation,
} from "./openapi-types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** OpenAPI 生成的请求封装输出目录（归档参考，由开发者手动合并到 src/services） */
const API_GEN_DIR = path.resolve(__dirname, "archive/openapi-gen/services");
/** OpenAPI 生成的类型输出目录（归档参考，由开发者手动合并到 src/types） */
const TYPES_API_GEN_DIR = path.resolve(__dirname, "archive/openapi-gen/types");
const LEGACY_GENERATED_TYPES_FILE = path.resolve(__dirname, "../src/types/generated-api.ts");
/** 使用手写类型的 service 模块 slug（与 {@link moduleSlugFromTag} 的基底名一致） */
const HAND_AUTHORED_TYPE_BASE_SLUGS = new Set(["flow-event"]);
const DEFAULT_API_URL = "http://localhost:3030/docs-json";
const TMP_JSON = path.join(os.tmpdir(), "ad-ops-swagger.json");
const TMP_TYPES_DIR = path.join(os.tmpdir(), "ad-ops-gen-types");
const RAW_SELECTED_TAGS = process.env.GEN_API_TAGS?.trim();
const RAW_OPERATION_IDS = process.env.GEN_API_OPERATION_IDS?.trim();
const RAW_OPS = process.env.GEN_API_OPS?.trim();
/** 按 URL 路径匹配（前缀 / glob / 可选 METHOD: 前缀），逗号分隔 */
const RAW_PATHS = process.env.GEN_API_PATHS?.trim();

/** 本地 OpenAPI JSON 路径；设置后跳过网络下载 */
const SPEC_PATH = process.env.GEN_API_SPEC?.trim();
const API_URL = (process.env.GEN_API_URL || DEFAULT_API_URL).trim();
const SOURCE_LABEL = SPEC_PATH ? `file:${SPEC_PATH}` : API_URL;

/** 上次成功生成时写入的 operation key 列表，供 `gen-api:update` 复用 */
const SELECTION_FILE = path.join(__dirname, ".gen-api-selection.json");
const GEN_API_ARGV = process.argv.slice(2);
const WANT_GEN_API_UPDATE =
  GEN_API_ARGV.includes("update") ||
  /^1|true|yes$/i.test(process.env.GEN_API_UPDATE?.trim() ?? "");

if (GEN_API_ARGV.includes("help") || GEN_API_ARGV.includes("--help") || GEN_API_ARGV.includes("-h")) {
  console.log(`gen-api.mjs — 从 OpenAPI 生成归档目录 script/archive/openapi-gen

生成物说明:
  - 请求函数 → script/archive/openapi-gen/services/<module>.ts
  - 类型声明 → script/archive/openapi-gen/types/<module>.ts（多模块时为 index.ts）
  - 不会修改 src/services/index.ts，也不会覆盖 src/services/、src/types/ 下手写文件
  - 请对照 diff，将需要的函数/类型合并到 src/services/<name>.ts、src/types/<name>.ts

用法:
  npm run gen:api
    交互选择接口，或使用环境变量指定范围（见下）。

  npm run gen:api:update
  node scripts/gen-api.mjs update
    更新接口：读取上次成功生成保存的接口列表（${path.basename(SELECTION_FILE)}），
    按当前 GEN_API_URL / GEN_API_SPEC 重新拉取文档后，仅对这些 operation 再生成。
    适合契约有增量、接口范围不变时快速同步。

  GEN_API_UPDATE=1 npm run gen:api
    与「update」子命令相同。

环境变量（文档来源）:
  GEN_API_SPEC=./openapi.json     使用本地 OpenAPI JSON
  GEN_API_URL=https://.../v3/api-docs
  GEN_API_INSECURE=1              跳过 HTTPS 校验（仅测试）

非交互指定接口范围（全量 gen:api 时，优先级从高到低）:
  GEN_API_OPERATION_IDS=id1,id2
  GEN_API_OPS=GET:/path,POST:/path2     精确 METHOD:path
  GEN_API_PATHS=/ads/report/foo,/ads/**  路径匹配（见下）
  GEN_API_TAGS=tag1 | all

GEN_API_PATHS / 交互 path: 匹配规则:
  - GET:/api/foo          仅匹配该方法的该路径（精确）
  - /api/foo              精确路径（所有 HTTP 方法）
  - /api/foo/             前缀匹配（含子路径）
  - /api/**/week-trend    glob（* 单段，** 任意）
  交互示例: path:/ads/report/ad-overview  或  /ads/report/**
`);
  process.exit(0);
}

const BANNER =
  "// AUTO-GENERATED — DO NOT EDIT MANUALLY\n" +
  "// Run: npm run gen:api to regenerate\n" +
  "// Output: script/archive/openapi-gen/services/ — merge into src/services/ manually when ready\n" +
  "// Source: " +
  SOURCE_LABEL +
  "\n\n";

const TYPES_BANNER =
  "// AUTO-GENERATED — DO NOT EDIT MANUALLY\n" +
  "// Run: npm run gen:api to regenerate\n" +
  "// Output: script/archive/openapi-gen/types/ — merge into src/types/ manually when ready\n" +
  "// Source: " +
  SOURCE_LABEL +
  "\n\n";

const HTTP_METHODS: HttpMethod[] = ["get", "post", "put", "patch", "delete"];

const METHOD_ORDER: Record<HttpMethodUpper, number> = {
  GET: 0,
  POST: 1,
  PUT: 2,
  PATCH: 3,
  DELETE: 4,
};

/** 将 swagger-typescript-api 产出的类型写入 script/archive/openapi-gen/types/（整文件覆盖，不 patch 手写类型） */
function writeOpenApiTypesFile(targetPath: string, typesBody: string): void {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, TYPES_BANNER + typesBody.trim() + "\n", "utf-8");
}

/**
 * 单模块 → script/archive/openapi-gen/types/<baseSlug>.ts；多模块 → index.ts
 * @param {Array<{ baseSlug: string }>} modulePlan
 */
function resolveOpenApiTypesOutputPath(modulePlan: ModulePlanItem[]): string {
  const generatedModules = modulePlan.filter((m) => !HAND_AUTHORED_TYPE_BASE_SLUGS.has(m.baseSlug));
  const uniqueBaseSlugs = [...new Set(generatedModules.map((m) => m.baseSlug))];
  if (uniqueBaseSlugs.length === 1) {
    return path.join(TYPES_API_GEN_DIR, uniqueBaseSlugs[0] + ".ts");
  }
  return path.join(TYPES_API_GEN_DIR, "index.ts");
}

/**
 * 归档服务模块的类型 import 路径（合并到 src 后应改为 @/types/<slug>）
 * @param {string} baseSlug
 * @param {Array<{ baseSlug: string }>} modulePlan
 */
function typesImportForBaseSlug(baseSlug: string, modulePlan: ModulePlanItem[]): string {
  if (HAND_AUTHORED_TYPE_BASE_SLUGS.has(baseSlug)) return "@/types/flow-event";
  const generatedModules = modulePlan.filter((m) => !HAND_AUTHORED_TYPE_BASE_SLUGS.has(m.baseSlug));
  const uniqueBaseSlugs = [...new Set(generatedModules.map((m) => m.baseSlug))];
  if (uniqueBaseSlugs.length === 1) {
    return "@/types/" + uniqueBaseSlugs[0];
  }
  return "@/types";
}

/**
 * 生成范围（类型与客户端仅包含选中接口）：
 * - 交互：按 tag 分组列出每个 operation，输入编号 / 范围 / all（不再按「目录」整 tag 选）。
 * - GEN_API_OPERATION_IDS=id1,id2（优先）；重复 operationId 时用 GEN_API_OPS。
 * - GEN_API_OPS=GET:/api/foo,POST:/api/bar（path 须与文档一致，可省略前导 /）。
 * - GEN_API_TAGS=tag1,tag2 | all（整 tag 全选，兼容旧流程）。
 * 类型写入 script/archive/openapi-gen/types/，仅含相关 schema；不修改 src/types 下手写文件。
 */

function downloadHttpsToFile(
  urlString: string,
  outPath: string,
  rejectUnauthorized: boolean,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const u = new URL(urlString);
    if (u.protocol !== "https:") {
      reject(new Error(`仅支持 https URL，当前为 ${u.protocol}`));
      return;
    }
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: "GET",
        rejectUnauthorized,
      },
      (incoming: IncomingMessage) => {
        const status = incoming.statusCode ?? 0;
        if (status >= 400) {
          reject(new Error(`HTTP ${status}`));
          incoming.resume();
          return;
        }
        const chunks: Buffer[] = [];
        incoming.on("data", (c: Buffer) => chunks.push(c));
        incoming.on("end", () => {
          writeFileSync(outPath, Buffer.concat(chunks), "utf-8");
          resolve(undefined);
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

// ── Step 1: 获取 Swagger JSON（本地文件 / HTTPS）──────────────────────────────
async function fetchSwaggerJson(): Promise<void> {
  if (SPEC_PATH) {
    console.log("Using local API spec:", SPEC_PATH);
    const abs = path.isAbsolute(SPEC_PATH) ? SPEC_PATH : path.resolve(process.cwd(), SPEC_PATH);
    writeFileSync(TMP_JSON, readFileSync(abs, "utf-8"));
    console.log("Copied spec to temp file.");
    return;
  }

  console.log("Downloading API spec...");
  const insecure =
    process.env.GEN_API_INSECURE === "1" || /^true$/i.test(process.env.GEN_API_INSECURE || "");

  let res;
  try {
    if (insecure) {
      await downloadHttpsToFile(API_URL, TMP_JSON, false);
      console.log("Download OK (GEN_API_INSECURE=1, TLS verify skipped).");
      return;
    }
    res = await fetch(API_URL);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Download failed:", msg);
    console.error("");
    console.error("常见原因：TLS/证书问题（curl 常为退出码 35）。可任选其一：");
    console.error("  • 仅测试环境：GEN_API_INSECURE=1 npm run gen:api");
    console.error("  • 使用本地文档：GEN_API_SPEC=./openapi.json npm run gen:api");
    console.error("  • 企业 CA：export NODE_EXTRA_CA_CERTS=/path/to/ca.pem 后再执行");
    console.error("  • 其它地址：GEN_API_URL=https://.../v3/api-docs npm run gen:api");
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  writeFileSync(TMP_JSON, await res.text(), "utf-8");
  console.log("Download OK.");
}

function loadSavedOpKeys(): Set<string> | null {
  if (!existsSync(SELECTION_FILE)) return null;
  try {
    const raw = JSON.parse(readFileSync(SELECTION_FILE, "utf-8"));
    const keys = raw.operationKeys;
    if (!Array.isArray(keys) || keys.length === 0) return null;
    return new Set(keys.map(String).filter(Boolean));
  } catch (e) {
    console.warn(
      "读取已保存接口列表失败:",
      SELECTION_FILE,
      e instanceof Error ? e.message : String(e),
    );
    return null;
  }
}

/** 每次成功生成后写入，供 gen-api:update 复用 */
function saveOpKeysSelection(keys: Iterable<string>, sourceLabel: string): void {
  try {
    const payload = {
      version: 1,
      sourceLabel: sourceLabel || SOURCE_LABEL,
      operationKeys: [...keys].sort(),
      savedAt: new Date().toISOString(),
    };
    writeFileSync(SELECTION_FILE, JSON.stringify(payload, null, 2) + "\n", "utf-8");
    console.log(
      "\n已保存接口范围（下次可 npm run gen:api:update）:",
      path.relative(process.cwd(), SELECTION_FILE),
    );
  } catch (e) {
    console.warn("写入接口范围缓存失败（不影响本次生成）:", e instanceof Error ? e.message : String(e));
  }
}

await fetchSwaggerJson();
const swaggerFull = JSON.parse(readFileSync(TMP_JSON, "utf-8")) as OpenAPISwagger;

mkdirSync(TMP_TYPES_DIR, { recursive: true });

function opKey(method: string, urlPath: string): string {
  return method.toLowerCase() + ":" + urlPath;
}

function listAllOperations(swagger: OpenAPISwagger): OperationInfo[] {
  const list: OperationInfo[] = [];
  for (const [urlPath, pathItem] of Object.entries(swagger.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      list.push({
        key: opKey(method, urlPath),
        method: method.toUpperCase() as HttpMethodUpper,
        urlPath,
        operationId: String(op.operationId ?? "").trim(),
        tag: op.tags?.[0]?.trim() || "misc",
        summary: String(op.summary ?? "").trim(),
        op,
      });
    }
  }
  list.sort((a, b) => {
    const t = a.tag.localeCompare(b.tag);
    if (t !== 0) return t;
    const p = a.urlPath.localeCompare(b.urlPath);
    if (p !== 0) return p;
    return (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99);
  });
  return list;
}

function splitCommaList(input?: string | null): string[] {
  return [...new Set((input || "").split(",").map((item: string) => item.trim()).filter(Boolean))];
}

/** 遍历 JSON 收集 $ref字符串 */
function walkRefs(node: unknown, out: Set<string>): void {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (const x of node) walkRefs(x, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  if (typeof obj.$ref === "string") {
    out.add(obj.$ref);
    return;
  }
  for (const v of Object.values(obj)) walkRefs(v, out);
}

/**
 * 仅保留选中接口，并收缩 components（类型生成更精准）
 * @param {object} swagger
 * @param {Set<string>} selectedKeys opKey 集合
 */
function buildFilteredSwagger(
  swagger: OpenAPISwagger,
  selectedKeys: Set<string>,
): OpenAPISwagger {
  const pathsOut: Record<string, OpenAPIPathItem> = {};
  const rootRefs = new Set<string>();

  for (const [urlPath, pathItem] of Object.entries(swagger.paths ?? {})) {
    const nextPathItem: OpenAPIPathItem = {};
    let any = false;
    if (Array.isArray(pathItem.parameters) && pathItem.parameters.length) {
      nextPathItem.parameters = pathItem.parameters;
      walkRefs(pathItem.parameters, rootRefs);
    }
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      const key = opKey(method, urlPath);
      if (!selectedKeys.has(key)) continue;
      nextPathItem[method] = op;
      walkRefs(op, rootRefs);
      any = true;
    }
    if (any) {
      pathsOut[urlPath] = nextPathItem;
    }
  }

  const compsIn = swagger.components ?? {};
  const componentsOut: Record<string, Record<string, unknown>> = {};
  const queue = [...rootRefs];
  const seenRef = new Set<string>();

  while (queue.length) {
    const ref = queue.shift();
    if (!ref || typeof ref !== "string" || !ref.startsWith("#/components/")) continue;
    if (seenRef.has(ref)) continue;
    seenRef.add(ref);
    const rest = ref.slice("#/components/".length);
    const slash = rest.indexOf("/");
    if (slash < 0) continue;
    const bucket = rest.slice(0, slash);
    const name = rest.slice(slash + 1);
    const bucketObj = compsIn[bucket];
    if (!bucketObj || bucketObj[name] === undefined) continue;
    if (!componentsOut[bucket]) componentsOut[bucket] = {};
    if (componentsOut[bucket][name] !== undefined) continue;
    componentsOut[bucket][name] = bucketObj[name];
    const more = new Set<string>();
    walkRefs(bucketObj[name], more);
    for (const r of more) queue.push(r);
  }

  return {
    openapi: swagger.openapi,
    info: swagger.info,
    servers: swagger.servers,
    security: swagger.security,
    tags: swagger.tags,
    paths: pathsOut,
    components: Object.keys(componentsOut).length ? componentsOut : undefined,
  };
}

function getTagMap(swagger: OpenAPISwagger): Map<string, TagOperation[]> {
  const map = new Map<string, TagOperation[]>();
  for (const [urlPath, pathItem] of Object.entries(swagger.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      const tag = op.tags?.[0]?.trim() || "misc";
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)!.push({ urlPath, method, op });
    }
  }
  return map;
}

function parseSelectedTags(input: string): string[] {
  return splitCommaList(input);
}

/**
 * @param {string} input
 * @param {number} max
 * @returns {Set<number>} 1-based indexes
 */
function parseIndexSelection(input: string, max: number): Set<number> {
  const normalized = input.trim();
  if (/^(all|\*)$/i.test(normalized)) {
    return new Set(Array.from({ length: max }, (_, i) => i + 1));
  }
  const out = new Set<number>();
  for (const part of normalized.split(",").map((s: string) => s.trim()).filter(Boolean)) {
    if (/^\d+\s*-\s*\d+$/.test(part)) {
      const [a, b] = part.split("-").map((x: string) => Number(x.trim()));
      if (!Number.isInteger(a) || !Number.isInteger(b) || a > b) {
        throw new Error(`无效范围: ${part}`);
      }
      for (let i = a; i <= b; i++) out.add(i);
    } else {
      const n = Number(part);
      if (!Number.isInteger(n)) throw new Error(`无效编号: ${part}`);
      out.add(n);
    }
  }
  for (const n of out) {
    if (n < 1 || n > max) throw new Error(`编号越界: ${n}（共 ${max} 项）`);
  }
  if (out.size === 0) throw new Error("未选择任何接口");
  return out;
}

/**
 * @param {Array<{ key: string }>} allOps
 * @param {Set<string>} tagSet
 */
function keysForTags(allOps: OperationInfo[], tagSet: Set<string>): Set<string> {
  return new Set(allOps.filter((o) => tagSet.has(o.tag)).map((o) => o.key));
}

/**
 * @param {Array<{ key: string, operationId: string }>} allOps
 * @param {string} rawIds
 */
function resolveKeysFromOperationIds(allOps: OperationInfo[], rawIds: string): Set<string> {
  if (/^(all|\*)$/i.test(rawIds)) {
    return new Set(allOps.map((o) => o.key));
  }
  const ids = splitCommaList(rawIds);
  const idToKeys = new Map<string, string[]>();
  for (const o of allOps) {
    if (!o.operationId) continue;
    if (!idToKeys.has(o.operationId)) idToKeys.set(o.operationId, []);
    idToKeys.get(o.operationId)!.push(o.key);
  }
  const keys = new Set<string>();
  for (const id of ids) {
    const ks = idToKeys.get(id);
    if (!ks || ks.length === 0) {
      throw new Error(`未知 operationId: ${id}。提示: 可用 GEN_API_OPS=GET:/path 精确指定`);
    }
    if (ks.length > 1) {
      throw new Error(
        `operationId「${id}」对应多条路径，请改用 GEN_API_OPS：` +
          ks.map((k: string) => k.replace(/^(\w+):/, (_: string, m: string) => m.toUpperCase() + ":")).join(" , "),
      );
    }
    keys.add(ks[0]);
  }
  return keys;
}

function resolveKeysFromMethodPath(allOps: OperationInfo[], raw: string): Set<string> {
  if (/^(all|\*)$/i.test(raw)) {
    return new Set(allOps.map((o) => o.key));
  }
  const keySet = new Set(allOps.map((o) => o.key));
  const keys = new Set<string>();
  for (const token of splitCommaList(raw)) {
    const m = token.match(/^(GET|POST|PUT|PATCH|DELETE)\s*:\s*(.+)$/i);
    if (!m) {
      throw new Error(`GEN_API_OPS 格式应为 METHOD:path，例如 GET:/ad/list — 当前: ${token}`);
    }
    const meth = m[1].toLowerCase();
    let pth = m[2].trim();
    if (!pth.startsWith("/")) pth = "/" + pth;
    const key = meth + ":" + pth;
    if (!keySet.has(key)) {
      const hint = allOps
        .filter((o) => o.urlPath === pth)
        .map((o) => `${o.method}:${o.urlPath}`)
        .join(", ");
      throw new Error(
        `未找到接口 ${key}` + (hint ? `。同路径已有: ${hint}` : ""),
      );
    }
    keys.add(key);
  }
  if (keys.size === 0) {
    throw new Error("GEN_API_OPS 未解析到任何接口");
  }
  return keys;
}

function normalizeUrlPath(p: unknown): string {
  let pth = String(p ?? "").trim();
  if (!pth) return "/";
  if (!pth.startsWith("/")) pth = "/" + pth;
  return pth;
}

/**
 * 解析单条路径规则：可选 METHOD: 前缀
 * @returns {{ method: string | null, pathPattern: string }}
 */
function parsePathPatternToken(token: string): { method: HttpMethodUpper | null; pathPattern: string } {
  const trimmed = token.trim();
  const m = trimmed.match(/^(GET|POST|PUT|PATCH|DELETE)\s*:\s*(.+)$/i);
  if (m) {
    return { method: m[1].toUpperCase() as HttpMethodUpper, pathPattern: normalizeUrlPath(m[2]) };
  }
  let pathPattern = trimmed;
  if (/^path:/i.test(pathPattern)) {
    pathPattern = pathPattern.slice(5).trim();
  }
  return { method: null, pathPattern: normalizeUrlPath(pathPattern) };
}

function escapeRegexChar(ch: string): string {
  return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** glob 路径 → RegExp（* 单段，** 跨段） */
function globPathToRegExp(globPath: string): RegExp {
  let re = "^";
  let i = 0;
  while (i < globPath.length) {
    if (globPath[i] === "*" && globPath[i + 1] === "*") {
      re += ".*";
      i += 2;
      if (globPath[i] === "/") i += 1;
    } else if (globPath[i] === "*") {
      re += "[^/]*";
      i += 1;
    } else if (globPath[i] === "?") {
      re += "[^/]";
      i += 1;
    } else {
      re += escapeRegexChar(globPath[i]);
      i += 1;
    }
  }
  re += "$";
  return new RegExp(re);
}

/**
 * @param {string} urlPath
 * @param {string} pathPattern
 * @param {{ exactOnly?: boolean }} [opts] 为 true 时仅精确路径（用于 METHOD:path）
 */
function operationMatchesPathPattern(
  urlPath: string,
  pathPattern: string,
  opts: { exactOnly?: boolean } = {},
): boolean {
  const path = normalizeUrlPath(urlPath);
  const pattern = normalizeUrlPath(pathPattern);
  const hasGlob = pattern.includes("*") || pattern.includes("?");
  const exactOnly = opts.exactOnly === true;

  if (hasGlob) {
    return globPathToRegExp(pattern).test(path);
  }
  if (pattern.endsWith("/")) {
    return path === pattern.slice(0, -1) || path.startsWith(pattern);
  }
  if (path === pattern) return true;
  if (exactOnly) return false;
  return path.startsWith(pattern + "/");
}

/**
 * GEN_API_PATHS 环境变量：逗号分隔路径规则（前缀 / glob / 可选 METHOD: 前缀）
 * @param {Array<{ key: string, urlPath: string, method: string }>} allOps
 * @param {string} raw
 */
function resolveKeysFromPathPatterns(allOps: OperationInfo[], raw: string): Set<string> {
  if (/^(all|\*)$/i.test(raw)) {
    return new Set(allOps.map((o) => o.key));
  }
  const tokens = splitCommaList(raw);
  if (tokens.length === 0) {
    throw new Error("路径匹配列表为空");
  }

  const matchers = tokens.map((t) => parsePathPatternToken(t));
  const matched = allOps.filter((o) =>
    matchers.some(({ method, pathPattern }) => {
      if (method !== null && o.method !== method) return false;
      return operationMatchesPathPattern(o.urlPath, pathPattern, { exactOnly: method !== null });
    }),
  );

  if (matched.length === 0) {
    const preview = allOps
      .filter((o) => {
        const p = matchers[0]?.pathPattern ?? "";
        return !p.includes("*") && o.urlPath.includes(p.replace(/\/$/, "") || p);
      })
      .slice(0, 8)
      .map((o) => `${o.method}:${o.urlPath}`)
      .join("\n    ");
    throw new Error(
      `路径规则未匹配任何接口: ${tokens.join(", ")}` +
        (preview ? `\n  相近路径示例:\n    ${preview}` : ""),
    );
  }

  console.log("\n路径匹配命中", matched.length, "个接口:");
  for (const o of matched) {
    console.log(`   [${o.method}] ${o.urlPath}${o.operationId ? `  (${o.operationId})` : ""}`);
  }

  return new Set(matched.map((o) => o.key));
}

/** 交互输入是否为路径选择（非编号） */
function isPathSelectionInput(input: string): boolean {
  const s = input.trim();
  if (!s || /^(all|\*)$/i.test(s)) return false;
  if (/^path:/i.test(s)) return true;
  if (s.startsWith("/")) return true;
  return /^(GET|POST|PUT|PATCH|DELETE)\s*:\s*\//i.test(s);
}

async function promptSelectOperations(allOps: OperationInfo[]): Promise<Set<string>> {
  console.log("\nOperations (grouped by tag).\n");
  console.log("选择方式:");
  console.log("  编号: 1,3,5-8 或 all");
  console.log("  路径: path:/ads/report/ad-overview  或  /ads/report/**  （前缀 / glob，可逗号多个）\n");
  let n = 0;
  /** @type {Map<number, string>} */
  const indexToKey = new Map();
  let lastTag = "";
  for (const o of allOps) {
    if (o.tag !== lastTag) {
      console.log(`\n── ${o.tag} ──`);
      lastTag = o.tag;
    }
    n += 1;
    indexToKey.set(n, o.key);
    const idPart = o.operationId ? `  ${o.operationId}` : "";
    const sum = o.summary ? ` — ${o.summary}` : "";
    console.log(`  ${n}. [${o.method}] ${o.urlPath}${idPart}${sum}`);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await rl.question(
      `\n请输入编号（1,3,5-8 / all）或路径（path:/前缀 或 /ads/**，逗号多个）: `,
    );
    const trimmed = answer.trim();
    if (!trimmed) {
      throw new Error("未输入选择");
    }
    if (isPathSelectionInput(trimmed)) {
      const raw = /^path:/i.test(trimmed) ? trimmed.slice(5).trim() : trimmed;
      return resolveKeysFromPathPatterns(allOps, raw);
    }
    const picked = parseIndexSelection(trimmed, n);
    const keys = new Set<string>();
    for (const i of picked) {
      const key = indexToKey.get(i);
      if (key) keys.add(key);
    }
    return keys;
  } finally {
    rl.close();
  }
}

/**
 * Env precedence: GEN_API_OPERATION_IDS > GEN_API_OPS > GEN_API_PATHS > GEN_API_TAGS; interactive = pick operations.
 * @param {object[]} allOps
 * @param {string[]} availableTagsFromFull
 */
async function resolveSelectedOpKeys(
  allOps: OperationInfo[],
  availableTagsFromFull: string[],
): Promise<Set<string>> {
  if (RAW_OPERATION_IDS) {
    return resolveKeysFromOperationIds(allOps, RAW_OPERATION_IDS);
  }
  if (RAW_OPS) {
    return resolveKeysFromMethodPath(allOps, RAW_OPS);
  }
  if (RAW_PATHS) {
    return resolveKeysFromPathPatterns(allOps, RAW_PATHS);
  }
  if (RAW_SELECTED_TAGS) {
    if (/^(all|\*)$/i.test(RAW_SELECTED_TAGS)) {
      return new Set(allOps.map((o) => o.key));
    }
    const selected = parseSelectedTags(RAW_SELECTED_TAGS);
    if (selected.length === 0) {
      throw new Error("GEN_API_TAGS 为空，请至少提供一个 tag。");
    }
    const invalid = selected.filter((tag) => !availableTagsFromFull.includes(tag));
    if (invalid.length > 0) {
      throw new Error(
        `GEN_API_TAGS 包含无效 tag: ${invalid.join(", ")}。可用 tag: ${availableTagsFromFull.join(", ")}`,
      );
    }
    return keysForTags(allOps, new Set(selected));
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "非交互环境请指定其一：\n" +
        "  GEN_API_OPERATION_IDS=id1,id2\n" +
        "  GEN_API_OPS=GET:/path,POST:/path2\n" +
        "  GEN_API_PATHS=/ads/report/foo,/ads/**\n" +
        "  GEN_API_TAGS=tag1 或 GEN_API_TAGS=all",
    );
  }

  return promptSelectOperations(allOps);
}

// ── Step 2: 解析 swagger JSON 并按选择的接口生成 ───────────────────────────────
// 方法：不解析任何生成的 TypeScript，所有类型信息来自 swagger JSON 本身

/** "#/components/schemas/Foo" → "Foo" */
const refToType = (ref?: string): string => ref?.replace("#/components/schemas/", "") ?? "unknown";

function getResponseType(swagger: OpenAPISwagger, op: OpenAPIOperation): string {
  const schema =
    op.responses?.["200"]?.content?.["*/*"]?.schema ??
    op.responses?.["200"]?.content?.["application/json"]?.schema;
  if (!schema) return "void";
  if (schema.type === "string") return "string";
  if (!schema.$ref) return "void";

  // 解包 ApiResponse 包装，取 .data 字段的实际类型
  const refName = refToType(schema.$ref);
  const schemaDef = swagger.components?.schemas?.[refName] as OpenAPISchema | undefined;
  const dataSchema = schemaDef?.properties?.data;
  if (!dataSchema) return "void";
  if (dataSchema.$ref) return refToType(dataSchema.$ref);
  if (dataSchema.type === "string") return "string";
  if (dataSchema.type === "object" && dataSchema.additionalProperties) {
    const v = dataSchema.additionalProperties;
    if (typeof v === "object") {
      const vType = v.type === "integer" || v.type === "number" ? "number" : "any";
      return "Record<string, " + vType + ">";
    }
  }
  return "void";
}

function getBodyType(op: OpenAPIOperation): string | null {
  const schema = op.requestBody?.content?.["application/json"]?.schema;
  if (!schema) return null;
  return schema.$ref ? refToType(schema.$ref) : null;
}

function schemaToPrimitive(schema?: OpenAPISchema): string {
  if (!schema) return "any";
  if (schema.$ref) return refToType(schema.$ref);
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "string") return "string";
  if (schema.type === "boolean") return "boolean";
  return "any";
}

function tagToSlug(tag: string, firstPath: string): string {
  const ascii = tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (ascii) return ascii;
  const seg = (firstPath || "").split("/").filter(Boolean)[0];
  return seg ? seg.replace(/[^a-z0-9]+/g, "-") : "misc";
}

/**
 * 输出文件名 slug：避免与手写 `src/services/flow.ts` 冲突，「Flow 事件定义」等 tag 落到 flow-event
 */
function moduleSlugFromTag(tag: string, firstPath: string): string {
  const raw = tagToSlug(tag, firstPath);
  return raw === "flow" ? "flow-event" : raw;
}

/** 避免生成 JS 保留字函数名 */
const JS_RESERVED = new Set(["export", "import", "delete", "class", "return", "default"]);
const safeFnName = (id: string): string => (JS_RESERVED.has(id) ? id + "Api" : id);

function operationFnStem(op: OpenAPIOperation, method: string, urlPath: string): string {
  const id = op.operationId?.trim();
  if (id) return id;
  const tail = urlPath
    .replace(/^\//, "")
    .replace(/\{([^}]+)\}/g, "$1")
    .replace(/\//g, "_");
  return `${method}_${tail}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

const allOperations = listAllOperations(swaggerFull);
const availableTagsFull = [...getTagMap(swaggerFull).keys()].sort((a, b) => a.localeCompare(b));

let selectedOpKeys: Set<string>;
try {
  if (WANT_GEN_API_UPDATE) {
    const saved = loadSavedOpKeys();
    if (!saved || saved.size === 0) {
      throw new Error(
        "未找到有效的已保存接口列表。请先执行一次 npm run gen:api（交互或环境变量）完成生成；" +
          "成功后会写入 " +
          path.relative(process.cwd(), SELECTION_FILE),
      );
    }
    const valid = new Set(allOperations.map((o) => o.key));
    const missing = [...saved].filter((k) => !valid.has(k));
    if (missing.length > 0) {
      console.warn(
        "\n以下 key 在最新 OpenAPI 中不存在（可能已删或路径变更），已排除，共",
        missing.length,
        "条:",
      );
      missing.slice(0, 25).forEach((k) => console.warn("  -", k));
      if (missing.length > 25) console.warn("  …");
    }
    selectedOpKeys = new Set([...saved].filter((k) => valid.has(k)));
    if (selectedOpKeys.size === 0) {
      throw new Error(
        "保存的接口在新文档中均已失效。请删除 " +
          path.relative(process.cwd(), SELECTION_FILE) +
          " 后重新执行 npm run gen:api",
      );
    }
    console.log("\n[gen-api update] 复用已保存接口数:", selectedOpKeys.size);
  } else {
    selectedOpKeys = await resolveSelectedOpKeys(allOperations, availableTagsFull);
  }
} catch (err) {
  console.error("Selection failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
}

if (selectedOpKeys.size === 0) {
  console.error("No operations selected; nothing to generate.");
  process.exit(1);
}

const swagger = buildFilteredSwagger(swaggerFull, selectedOpKeys);
writeFileSync(TMP_JSON, JSON.stringify(swagger), "utf-8");

const tagMap = getTagMap(swagger);
const availableTags = [...tagMap.keys()].sort((a, b) => a.localeCompare(b));
const orderedSelectedTags = availableTags;

console.log("\nGeneration scope:");
console.log("   接口数量:", selectedOpKeys.size);
orderedSelectedTags.forEach((tag) => {
  const n = (tagMap.get(tag) ?? []).length;
  console.log(`   - ${tag}（${n} 个接口）`);
});

function planApiModules(selectedTags: string[]): ModulePlanItem[] {
  const slugCounter = new Map<string, number>();
  const modules: ModulePlanItem[] = [];
  for (const tag of selectedTags) {
    const operations = tagMap.get(tag) ?? [];
    const baseSlug = moduleSlugFromTag(tag, operations[0]?.urlPath ?? "");
    const usedCount = slugCounter.get(baseSlug) ?? 0;
    const slug = usedCount === 0 ? baseSlug : `${baseSlug}-${usedCount + 1}`;
    slugCounter.set(baseSlug, usedCount + 1);
    modules.push({ tag, slug, baseSlug });
  }
  return modules;
}

const modulePlan = planApiModules(orderedSelectedTags);
const needsGlobalTypesFile = modulePlan.some((m) => !HAND_AUTHORED_TYPE_BASE_SLUGS.has(m.baseSlug));

// ── Step 3: 按需生成集中类型声明（仅当存在非手写类型模块时）──────────────────────
const openApiTypesTarget = needsGlobalTypesFile ? resolveOpenApiTypesOutputPath(modulePlan) : null;
if (needsGlobalTypesFile && openApiTypesTarget) {
  console.log("Generating types ->", path.relative(path.resolve(__dirname, ".."), openApiTypesTarget));
  mkdirSync(TMP_TYPES_DIR, { recursive: true });
  await generateApi({
    name: "types.ts",
    input: TMP_JSON,
    output: TMP_TYPES_DIR,
    generateClient: false,
    generateRouteTypes: false,
    extractRequestParams: true,
    extractRequestBody: true,
    modular: false,
    cleanOutput: true,
    prettier: { printWidth: 120, tabWidth: 2, trailingComma: "all", parser: "typescript" },
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Type generation failed:", message);
    process.exit(1);
  });

  const generatedFile = readdirSync(TMP_TYPES_DIR).find((f) => f.endsWith(".ts"));
  if (!generatedFile) {
    console.error("Generated types file not found.");
    process.exit(1);
  }
  const rawTypes = readFileSync(path.join(TMP_TYPES_DIR, generatedFile), "utf-8");
  const typesBody = rawTypes
    .replace(/^\/\* eslint-disable \*\/\n?/m, "")
    .replace(/^\/\* tslint:disable \*\/\n?/m, "")
    .replace(/^\/\/ @ts-nocheck\n?/m, "")
    .replace(/\/\*[\s\S]*?acacode[\s\S]*?\*\/\n?/, "")
    .trim();
  writeOpenApiTypesFile(openApiTypesTarget, typesBody);
  console.log(path.relative(path.resolve(__dirname, ".."), openApiTypesTarget) + " OK");
  rmSync(TMP_TYPES_DIR, { recursive: true, force: true });
} else {
  if (existsSync(LEGACY_GENERATED_TYPES_FILE)) {
    rmSync(LEGACY_GENERATED_TYPES_FILE, { force: true });
  }
  console.log("Skip OpenAPI types (hand-authored types only for selected modules).");
}

const moduleFiles: string[] = [];

mkdirSync(API_GEN_DIR, { recursive: true });

for (const { tag, slug, baseSlug } of modulePlan) {
  const operations = tagMap.get(tag) ?? [];
  const typesImport = typesImportForBaseSlug(baseSlug, modulePlan);
  const usedTypes = new Set();
  const funcBlocks = [];

  for (const { urlPath, method, op } of operations) {
    const stem = operationFnStem(op, method, urlPath);
    const fnName = safeFnName(stem);
    const responseType = getResponseType(swagger, op);
    const bodyType = getBodyType(op);

    if (responseType && !["void", "string", "any"].includes(responseType) && !responseType.startsWith("Record<")) {
      usedTypes.add(responseType);
    }
    if (bodyType) usedTypes.add(bodyType);

    const pathParams = (op.parameters ?? []).filter((p: OpenAPIParameter) => p.in === "path");
    const queryParams = (op.parameters ?? []).filter((p: OpenAPIParameter) => p.in === "query");
    const sigParts = [];

    // ① 路径参数 → 直接作为函数 arg（如 id: number）
    for (const p of pathParams) {
      sigParts.push(p.name + ": " + schemaToPrimitive(p.schema));
    }

    // ② Query 参数
    let queryVarName = null;
    if (queryParams.length === 1 && queryParams[0].schema?.$ref) {
      // 单个 $ref query 参数：直接用引用的类型（如 SkuStatsQueryRequest）
      queryVarName = queryParams[0].name;
      const qType = refToType(queryParams[0].schema.$ref);
      usedTypes.add(qType);
      sigParts.push(queryVarName + ": " + qType);
    } else if (queryParams.length > 0) {
      // 多个内联 query 参数：使用 swagger-typescript-api 生成的 XxxParams 接口
      const pType = stem.charAt(0).toUpperCase() + stem.slice(1) + "Params";
      usedTypes.add(pType);
      queryVarName = "params";
      sigParts.push("params?: " + pType);
    }

    // ③ 请求体
    let bodyVarName = null;
    if (bodyType) {
      bodyVarName = "data";
      sigParts.push("data: " + bodyType);
    }

    // URL 模板：{id} → ${id}，去掉开头的 /
    const urlTemplate = urlPath
      .replace(/^\//, "")
      .replace(/\{(\w+)\}/g, (_match: string, p: string) => {
        return "${" + p + "}";
      });
    const urlExpr = urlPath.includes("{")
      ? "`" + urlTemplate + "`"
      : '"' + urlTemplate + '"';

    // http 调用
    const isReadMethod = method === "get" || method === "delete";
    const secondArg = isReadMethod ? queryVarName : bodyVarName;
    const httpCall = secondArg
      ? "http." + method + "<" + responseType + ">(" + urlExpr + ", " + secondArg + ")"
      : "http." + method + "<" + responseType + ">(" + urlExpr + ")";

    // JSDoc
    const jsdocLines = ["/**"];
    if (op.summary) jsdocLines.push(" * " + op.summary);
    if (op.description && op.description !== op.summary) {
      jsdocLines.push(" * @description " + op.description);
    }
    jsdocLines.push(" * @tags " + tag, " */");

    funcBlocks.push(
      jsdocLines.join("\n") +
        "\n" +
        "export function " +
        fnName +
        "(" +
        sigParts.join(", ") +
        ") {\n" +
        "  return " +
        httpCall +
        ";\n" +
        "}",
    );
  }

  const importLine =
    usedTypes.size > 0
      ? "import type {\n  " + [...usedTypes].join(",\n  ") + ",\n} from \"" + typesImport + "\";\n"
      : "";

  const fileContent =
    BANNER +
    "import { http } from \"@/utils/request\";\n" +
    importLine +
    "\n" +
    funcBlocks.join("\n\n") +
    "\n";

  writeFileSync(path.join(API_GEN_DIR, slug + ".ts"), fileContent, "utf-8");
  console.log(slug + ".ts OK (" + funcBlocks.length + " functions)");
  moduleFiles.push(slug);
}

console.log("\nSummary:");
console.log("   已选接口数量:", selectedOpKeys.size);
console.log("   生成模块数量:", moduleFiles.length);
console.log("   模块文件:", moduleFiles.length > 0 ? moduleFiles.join(", ") : "(无)");

const apiGenRel = path.relative(path.resolve(__dirname, ".."), API_GEN_DIR);
const typesGenRel = path.relative(path.resolve(__dirname, ".."), TYPES_API_GEN_DIR);
console.log("\nDone. Request modules -> " + apiGenRel + "/<module>.ts");
console.log("   Types -> " + typesGenRel + "/（单模块为 <slug>.ts，多模块为 index.ts）");
console.log("   请手动将需要的函数/类型合并到 src/services/、src/types/，并在 index.ts 按需 export");
console.log("   快速同步契约：npm run gen:api:update（复用上次接口范围）");
console.log(
  "   非交互筛选：GEN_API_OPERATION_IDS=… | GEN_API_OPS=GET:/a | GEN_API_PATHS=/ads/** | GEN_API_TAGS=tag",
);
if (!needsGlobalTypesFile) {
  console.log("   （未生成 OpenAPI 类型；Flow 事件类型见 src/types/flow-event.ts）");
}
moduleFiles.forEach((f) => console.log("   " + apiGenRel + "/" + f + ".ts"));
if (needsGlobalTypesFile && openApiTypesTarget) {
  console.log("   " + path.relative(path.resolve(__dirname, ".."), openApiTypesTarget));
}

saveOpKeysSelection(selectedOpKeys, SOURCE_LABEL);

rmSync(TMP_JSON, { force: true });
if (existsSync(TMP_TYPES_DIR)) {
  rmSync(TMP_TYPES_DIR, { recursive: true, force: true });
}
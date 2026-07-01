import type { Graph, Node, Edge } from "@antv/x6";
import type {
  FlowNodeData,
  FlowNodeType,
  FlowDefinitionDetail,
  FlowConditionOperator,
  FlowTimeRange,
  FlowConditionItem,
  FlowEventParamFilterRow,
  FlowExecuteActionType,
  FlowWaitType,
} from "@/types";
import { normalizeFlowWaitType, resolveWaitTimerType } from "@/utils/flowWaitType";
import {
  flowExecuteGroupFromDingTalkBackendPayload,
  getDingTalkFeedAlarmPayloadFromNodeConfig,
  shouldHydrateDingTalkFeedAlarmFromNodeConfig,
} from "@/utils/dingTalkFeedAlarm";
import {
  FLOW_NODE_PRESETS,
  CONDITION_BRANCH_EDGE_DATA_KEY,
  applyNodeStatusStyle,
} from "./nodeConfig";
import {
  parseTimeWindowStringToFlowTimeRange,
  resolveConditionExprTimeWindowRaw,
} from "@/utils/flowConditionTimeWindow";
import { formatCanvasSilent } from "./flowCanvasFormatter";
import { onePortOutVertical, twoPortsVertical } from "./nodeShapes";
import {
  appendEventParamRow,
  setEventParamValue,
  stripEventParamRowsByDeniedParamKeys,
} from "@/utils/flowEventParamRows";

type BackendConditionExpr =
  | {
      type: "GROUP";
      combinator: "AND" | "OR";
      children: BackendConditionExpr[];
      /** 部分接口把条件组名称挂在 GROUP 上 */
      conditionName?: string;
      /** 整段 conditionExpr 的规则说明（与首个 CONDITION.remark 解耦） */
      remark?: string;
    }
  | {
      type: "CONDITION";
      field: string;
      operator: string;
      value: unknown;
      /** 条件项备注（用于回填 Trigger 规则说明） */
      remark?: string;
      /** 条件时间窗口选择（用于保存/回显） */
      timeWindow?: string;
      /** 条件时间窗口高级配置（用于新增时间模式） */
      timeWindowConfig?: {
        direction?: "PAST" | "FUTURE";
        logic?: "WITHIN" | "BEYOND" | "RANGE" | "FIXED" | "TOTAL";
        params?: Record<string, unknown>;
        label?: string;
      };
      /** 额外扩展数据（如 cascaderPath/cascaderPairs/displayValues） */
      extra?: Record<string, unknown>;
      /** 条件组名称（冗余在每条 CONDITION 上，便于后端聚合） */
      conditionName?: string;
    };

/** 从 conditionExpr 树中取条件组名称（边级 conditionName 缺失时回退） */
function extractConditionNameFromExpr(
  expr: BackendConditionExpr | undefined,
): string | undefined {
  if (!expr) {
    return undefined;
  }
  if (expr.type === "CONDITION") {
    const n = expr.conditionName;
    if (typeof n === "string" && n.trim().length > 0) {
      return n.trim();
    }
    return undefined;
  }
  const rootName = expr.conditionName;
  if (typeof rootName === "string" && rootName.trim().length > 0) {
    return rootName.trim();
  }
  for (const child of expr.children) {
    const found = extractConditionNameFromExpr(child);
    if (found) {
      return found;
    }
  }
  return undefined;
}

type BackendConditionNode = BackendConditionExpr;

type BackendTriggerEventGroupExpr = {
  type?: string;
  combinator?: string;
  name?: string;
  children?: unknown[];
  group?: {
    groupName?: string;
    eventRuleExpr?: {
      nodeType?: string;
      combinator?: string;
      children?: unknown[];
      rule?: unknown;
    };
    groupPropertyExpr?: {
      nodeType?: string;
      combinator?: string;
      children?: unknown[];
    };
    exprCombinator?: string;
  };
};

function parseBackendEventGroupExpr(
  raw: unknown,
): BackendTriggerEventGroupExpr | undefined {
  if (raw && typeof raw === "object") {
    return raw as BackendTriggerEventGroupExpr;
  }
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return undefined;
    try {
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === "object") {
        return parsed as BackendTriggerEventGroupExpr;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function parseBackendTriggerTimeToConfig(
  timeWindow: Record<string, unknown> | undefined,
): FlowConditionItem["eventTriggerTime"] | undefined {
  if (!timeWindow) return undefined;
  const direction = String(timeWindow.direction ?? "").toUpperCase();
  const logic = String(timeWindow.logic ?? "").toUpperCase();
  const params = (timeWindow.params ?? {}) as Record<string, unknown>;
  if (direction === "FUTURE" && logic === "WITHIN") {
    return {
      mode: "window_after_now",
      unit: String(params.unit ?? "DAY").toLowerCase() as "day" | "hour" | "minute",
      amount: typeof params.value === "number" ? params.value : undefined,
    };
  }
  if (direction === "FUTURE" && logic === "BEYOND") {
    return {
      mode: "offset_after_now",
      unit: String(params.unit ?? "DAY").toLowerCase() as "day" | "hour" | "minute",
      amount: typeof params.value === "number" ? params.value : undefined,
    };
  }
  if (direction === "FUTURE" && logic === "RANGE") {
    return {
      mode: "offset_range_after_now",
      unit: String(params.unit ?? "DAY").toLowerCase() as "day" | "hour" | "minute",
      rangeMin: typeof params.startOffset === "number" ? params.startOffset : undefined,
      rangeMax: typeof params.endOffset === "number" ? params.endOffset : undefined,
    };
  }
  if (direction === "FUTURE" && logic === "FIXED") {
    return {
      mode: "specific_date_range",
      dateStart: typeof params.startDate === "string" ? params.startDate : undefined,
      dateEnd: typeof params.endDate === "string" ? params.endDate : undefined,
    };
  }
  if (direction === "ABSOLUTE" && logic === "DATE_RANGE") {
    return {
      mode: "specific_date_range",
      dateStart: typeof params.startDate === "string" ? params.startDate : undefined,
      dateEnd: typeof params.endDate === "string" ? params.endDate : undefined,
    };
  }
  if (direction === "PAST" && logic === "WITHIN") {
    return {
      mode: "past_within",
      unit: String(params.unit ?? "DAY").toLowerCase() as "day" | "hour" | "minute",
      amount: typeof params.value === "number" ? params.value : undefined,
    };
  }
  if (direction === "PAST" && logic === "BEYOND") {
    return {
      mode: "past_beyond",
      unit: String(params.unit ?? "DAY").toLowerCase() as "day" | "hour" | "minute",
      amount: typeof params.value === "number" ? params.value : undefined,
    };
  }
  if (direction === "PAST" && logic === "RANGE") {
    return {
      mode: "past_range",
      unit: String(params.unit ?? "DAY").toLowerCase() as "day" | "hour" | "minute",
      rangeMin: typeof params.startOffset === "number" ? params.startOffset : undefined,
      rangeMax: typeof params.endOffset === "number" ? params.endOffset : undefined,
    };
  }
  if (direction === "PAST" && logic === "FIXED") {
    return {
      mode: "past_fixed",
      dateStart: typeof params.startDate === "string" ? params.startDate : undefined,
      dateEnd: typeof params.endDate === "string" ? params.endDate : undefined,
    };
  }
  if (direction === "PAST" && logic === "TOTAL") {
    return { mode: "past_total" };
  }
  return undefined;
}

function isEmptyPropertySlot(expr: Record<string, unknown> | undefined): boolean {
  if (!expr) return true;
  if (
    String(expr.nodeType) === "GROUP" &&
    Array.isArray(expr.children) &&
    expr.children.length === 0
  ) {
    return true;
  }
  return false;
}

/** 写入 JSON 时的前端标记，解析 property 树前剔除 */
function stripReenterGroupPropertyMarkers(expr: Record<string, unknown>): Record<string, unknown> {
  const { _reenterAttrsOnly: _a, _reenterDualSlot: _d, ...rest } = expr;
  return rest;
}

/**
 * - `_reenterDualSlot` + AND + 子节点 ×2 → 槽 0 事件参数、槽 1 流程属性
 * - `_reenterAttrsOnly` → 整棵为流程属性（保存端为「仅属性」最简树）
 * - 否则整棵为事件参数子树（含单条顶层 CONDITION）
 */
function splitReenterGroupPropertyExpr(
  raw: Record<string, unknown> | undefined,
): { eventSlot?: Record<string, unknown>; attrsSlot?: Record<string, unknown> } {
  if (!raw) return {};
  const dual =
    raw._reenterDualSlot === true &&
    String(raw.nodeType) === "GROUP" &&
    String(raw.combinator).toUpperCase() === "AND" &&
    Array.isArray(raw.children) &&
    raw.children.length === 2;
  if (dual) {
    const ch = raw.children as unknown[];
    return {
      eventSlot: ch[0] as Record<string, unknown>,
      attrsSlot: ch[1] as Record<string, unknown>,
    };
  }
  if (raw._reenterAttrsOnly === true) {
    return { attrsSlot: stripReenterGroupPropertyMarkers(raw) };
  }
  return { eventSlot: raw };
}

function flattenPropertyExprToFilters(expr: Record<string, unknown>): Array<{
  paramCode: string;
  operator: FlowConditionOperator;
  value: unknown;
  label: string;
  enumDisplayLabels?: string | string[];
}> {
  const out: Array<{
    paramCode: string;
    operator: FlowConditionOperator;
    value: unknown;
    label: string;
    enumDisplayLabels?: string | string[];
  }> = [];
  const walk = (node: Record<string, unknown>) => {
    const nt = String(node.nodeType ?? "");
    if (nt === "CONDITION") {
      const filter = (node.filter ?? {}) as Record<string, unknown>;
      const paramCode = String(filter.paramCode ?? "");
      if (!paramCode) return;
      const extra = (filter.extra ?? {}) as Record<string, unknown>;
      const displayLabelFromExtra =
        typeof extra.displayLabel === "string"
          ? extra.displayLabel
          : Array.isArray(extra.displayLabel) &&
            extra.displayLabel.every((it) => typeof it === "string")
            ? (extra.displayLabel as string[])
            : undefined;
      out.push({
        paramCode,
        operator: (typeof filter.operator === "string" ? filter.operator : "EQUALS") as FlowConditionOperator,
        value: filter.value,
        label: typeof filter.label === "string" ? filter.label : paramCode,
        enumDisplayLabels:
          displayLabelFromExtra ??
          (typeof filter.enumDisplayLabels === "string"
            ? filter.enumDisplayLabels
            : Array.isArray(filter.enumDisplayLabels) &&
              filter.enumDisplayLabels.every((it) => typeof it === "string")
              ? (filter.enumDisplayLabels as string[])
              : undefined),
      });
      return;
    }
    if (nt === "GROUP" && Array.isArray(node.children)) {
      (node.children as Record<string, unknown>[]).forEach(walk);
    }
  };
  walk(expr);
  return out;
}

function collectAttributeKeysFromConditionRoot(root: FlowConditionItem | null): Set<string> {
  const acc = new Set<string>();
  if (!root) {
    return acc;
  }
  const walk = (it: FlowConditionItem) => {
    if (it.attributeKey) {
      acc.add(it.attributeKey);
    }
    it.groupItems?.forEach(walk);
  };
  walk(root);
  return acc;
}

/** 从事件规则树各节点上剔除与流程属性槽冲突的 paramKey（误写入 eventParamFilterRows 的修复） */
function sanitizeMergedEventTreeDeniedParamKeys(
  node: FlowConditionItem,
  deny: ReadonlySet<string>,
): FlowConditionItem {
  if (deny.size === 0) {
    return node;
  }
  const nextSelf = stripEventParamRowsByDeniedParamKeys(node, deny);
  if (!nextSelf.groupItems?.length) {
    return nextSelf;
  }
  return {
    ...nextSelf,
    groupItems: nextSelf.groupItems.map((g) => sanitizeMergedEventTreeDeniedParamKeys(g, deny)),
  };
}

function mergePropertyExprIntoEvent(
  item: FlowConditionItem,
  expr: Record<string, unknown>,
  denyParamCodes?: ReadonlySet<string>,
): FlowConditionItem {
  const filters = flattenPropertyExprToFilters(expr).filter(
    (f) => !denyParamCodes?.has(f.paramCode),
  );
  let next = item;
  filters.forEach((f) => {
    next = appendEventParamRow(next, f.paramCode, f.operator);
    next = setEventParamValue(next, f.paramCode, f.value as FlowConditionItem["value"], {
      enumLabels: f.enumDisplayLabels,
    });
  });
  return next;
}

function applyEventParamPropertyExprToEvents(
  events: FlowConditionItem[],
  expr: Record<string, unknown> | undefined,
  denyParamCodes?: ReadonlySet<string>,
): FlowConditionItem[] {
  if (!expr || isEmptyPropertySlot(expr)) return events;
  if (events.length === 0) return events;
  if (events.length === 1) {
    return [mergePropertyExprIntoEvent(events[0], expr, denyParamCodes)];
  }
  if (
    String(expr.nodeType) === "GROUP" &&
    String(expr.combinator).toUpperCase() === "OR" &&
    Array.isArray(expr.children)
  ) {
    const ch = expr.children as Record<string, unknown>[];
    if (ch.length === events.length) {
      return events.map((ev, i) => mergePropertyExprIntoEvent(ev, ch[i], denyParamCodes));
    }
  }
  /** OR 子项数量与事件数不一致时，不将整棵树摊平到单一事件，避免语义错误 */
  return events;
}

function ruleToEventItem(rule: Record<string, unknown>, idBase: string): FlowConditionItem | null {
  const triggerCond = Array.isArray(rule.triggerConditions)
    ? (rule.triggerConditions[0] as Record<string, unknown> | undefined)
    : undefined;
  const timeWindow = (triggerCond?.timeWindow ?? undefined) as Record<string, unknown> | undefined;
  const eventKey = String(rule.eventCode ?? "");
  if (!eventKey) return null;
  return {
    id: `${idBase}-${Math.random().toString(36).slice(2, 9)}`,
    attributeKey: `event:${eventKey}`,
    conditionSource: "event",
    eventKey,
    eventName: typeof rule.eventName === "string" ? rule.eventName : undefined,
    eventOccurrenceOperator:
      typeof triggerCond?.occurrenceOperator === "string"
        ? (triggerCond.occurrenceOperator as FlowConditionItem["eventOccurrenceOperator"])
        : undefined,
    eventOccurrenceValue:
      typeof triggerCond?.occurrenceCount === "number" ? triggerCond.occurrenceCount : undefined,
    eventTriggerTime: parseBackendTriggerTimeToConfig(timeWindow),
  };
}

/** 递归解析 eventRuleExpr（CONDITION / 嵌套 GROUP） */
function parseEventRuleExprToFlowConditionRoot(
  expr: Record<string, unknown> | undefined,
  idPrefix: string,
): FlowConditionItem | null {
  if (!expr) return null;
  if (String(expr.nodeType) === "CONDITION" && expr.rule) {
    return ruleToEventItem(expr.rule as Record<string, unknown>, idPrefix);
  }
  if (String(expr.nodeType) === "GROUP" && Array.isArray(expr.children)) {
    const comb = String(expr.combinator ?? "AND").toUpperCase() === "OR" ? "or" : "and";
    const parts = (expr.children as Record<string, unknown>[])
      .map((c, i) => parseEventRuleExprToFlowConditionRoot(c, `${idPrefix}-${i}`))
      .filter((x): x is FlowConditionItem => x != null);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];
    const [root, ...rest] = parts;
    return {
      ...root,
      groupRelation: comb,
      groupItems: rest.map((r, ri) => ({
        ...r,
        relation: ri === 0 ? undefined : comb,
      })),
    };
  }
  return null;
}

/** 顶层 OR/AND 事件链：root 上叠了第一个条件 + `groupItems` 为其余兄弟，拆成线性列表供与 OR 参数子树对齐 */
function linearizeTopLevelEventSiblings(root: FlowConditionItem): FlowConditionItem[] {
  const stripMeta = (n: FlowConditionItem): FlowConditionItem => {
    const { groupRelation: _gr, groupItems: _gi, relation: _rel, ...rest } = n;
    return rest;
  };
  if (!root.groupItems?.length) return [stripMeta(root)];
  return [stripMeta(root), ...root.groupItems.map(stripMeta)];
}

function foldEventListToRoot(
  items: FlowConditionItem[],
  groupRelation: "and" | "or" | undefined,
): FlowConditionItem {
  const comb = groupRelation ?? "or";
  if (items.length === 1) return items[0];
  const [root, ...rest] = items;
  return {
    ...root,
    groupRelation: comb,
    groupItems: rest.map((r, ri) => ({
      ...r,
      relation: ri === 0 ? undefined : comb,
    })),
  };
}

function applySharedGroupPropertyExpr(
  root: FlowConditionItem,
  expr: Record<string, unknown> | undefined,
  denyParamCodes?: ReadonlySet<string>,
): FlowConditionItem {
  if (!expr || isEmptyPropertySlot(expr)) return root;
  const applyOne = (it: FlowConditionItem) =>
    mergePropertyExprIntoEvent({ ...it }, expr, denyParamCodes);
  if (!root.groupItems?.length) return applyOne(root);
  return {
    ...applyOne(root),
    groupItems: root.groupItems.map(applyOne),
  };
}

function parsePropertyExprToConditionItem(
  expr: Record<string, unknown> | undefined,
  idPrefix: string,
): FlowConditionItem | null {
  if (!expr) return null;
  const nt = String(expr.nodeType ?? "");
  if (nt === "CONDITION") {
    const filter = (expr.filter ?? {}) as Record<string, unknown>;
    const key = String(filter.paramCode ?? "");
    if (!key) return null;
    return {
      id: `${idPrefix}-attr-${Math.random().toString(36).slice(2, 9)}`,
      attributeKey: key,
      conditionSource: "attribute",
      operator:
        typeof filter.operator === "string"
          ? (filter.operator as FlowConditionItem["operator"])
          : undefined,
      value: filter.value as FlowConditionItem["value"],
    };
  }
  if (nt === "GROUP" && Array.isArray(expr.children)) {
    const comb =
      String(expr.combinator ?? "AND").toUpperCase() === "OR" ? ("or" as const) : ("and" as const);
    const parsed = (expr.children as unknown[])
      .map((c, i) =>
        parsePropertyExprToConditionItem(c as Record<string, unknown>, `${idPrefix}-${i}`),
      )
      .filter((x): x is FlowConditionItem => x != null);
    if (parsed.length === 0) return null;
    if (parsed.length === 1) return parsed[0];
    const [root, ...rest] = parsed;
    return {
      ...root,
      id: `${idPrefix}-grp-${Math.random().toString(36).slice(2, 9)}`,
      groupRelation: comb,
      groupItems: rest.map((r, ri) => ({
        ...r,
        relation: ri === 0 ? undefined : comb,
      })),
    };
  }
  return null;
}

function attrTreeSignature(root: FlowConditionItem): string {
  const keys: string[] = [];
  const walk = (it: FlowConditionItem) => {
    keys.push(`${it.attributeKey}:${String(it.operator)}:${JSON.stringify(it.value)}`);
    it.groupItems?.forEach(walk);
  };
  walk(root);
  return keys.sort().join("|");
}

type ReenterLeafMeta = { node: Record<string, unknown>; linkRelation?: "and" | "or" };

/** 收集带 `type:CONDITION` + `group` 的叶子，并记录与同父 GROUP 下前一兄弟之间的 and/or */
function collectReenterLeavesEnriched(root: unknown): ReenterLeafMeta[] {
  const acc: ReenterLeafMeta[] = [];
  const visit = (n: unknown, siblingLink: "and" | "or" | undefined): void => {
    if (!n || typeof n !== "object") return;
    const o = n as Record<string, unknown>;
    const typ = String(o.type ?? "").toUpperCase();
    if (typ === "GROUP" && Array.isArray(o.children)) {
      const comb = String(o.combinator ?? "AND").toUpperCase() === "OR" ? "OR" : "AND";
      (o.children as unknown[]).forEach((child, i) => {
        const L = i === 0 ? undefined : comb === "AND" ? ("and" as const) : ("or" as const);
        visit(child, L);
      });
      return;
    }
    if (typ === "CONDITION" && o.group) {
      acc.push({ node: o, linkRelation: siblingLink });
      return;
    }
    if (o.group && typeof o.group === "object" && typ !== "GROUP") {
      acc.push({ node: o, linkRelation: siblingLink });
    }
  };
  visit(root, undefined);
  return acc;
}

/** 单个 CONDITION 叶子 + group → 合并事件规则与参数槽后的 FlowConditionItem（不含顶层 relation） */
function mergeReenterGroupLeafIntoItem(
  leaf: Record<string, unknown>,
  idPrefix: string,
  attrTreeSeen: Set<string>,
  attrAccum: FlowConditionItem[],
): FlowConditionItem | null {
  const g = leaf.group as BackendTriggerEventGroupExpr["group"];
  if (!g) return null;

  const eventRule = g.eventRuleExpr as Record<string, unknown> | undefined;
  const parsedRoot = parseEventRuleExprToFlowConditionRoot(eventRule, idPrefix);
  if (!parsedRoot) return null;

  const { eventSlot, attrsSlot } = splitReenterGroupPropertyExpr(
    g.groupPropertyExpr as Record<string, unknown> | undefined,
  );

  const denyAttrParamKeysFromAttrsSlot = ((): Set<string> => {
    if (!attrsSlot || isEmptyPropertySlot(attrsSlot)) {
      return new Set();
    }
    const propRoot = parsePropertyExprToConditionItem(
      stripReenterGroupPropertyMarkers(attrsSlot),
      `${idPrefix}-attr-deny-keys`,
    );
    return collectAttributeKeysFromConditionRoot(propRoot);
  })();

  const linearEvents = linearizeTopLevelEventSiblings(parsedRoot);

  let mergedRoot = parsedRoot;
  if (eventSlot && !isEmptyPropertySlot(eventSlot)) {
    const perBranch =
      String(eventSlot.nodeType) === "GROUP" &&
      String(eventSlot.combinator ?? "AND").toUpperCase() === "OR" &&
      Array.isArray(eventSlot.children) &&
      eventSlot.children.length === linearEvents.length;
    const afterParams = perBranch
      ? foldEventListToRoot(
          applyEventParamPropertyExprToEvents(
            linearEvents,
            eventSlot,
            denyAttrParamKeysFromAttrsSlot,
          ),
          parsedRoot.groupRelation,
        )
      : applySharedGroupPropertyExpr(
          parsedRoot,
          eventSlot,
          denyAttrParamKeysFromAttrsSlot,
        );
    mergedRoot = sanitizeMergedEventTreeDeniedParamKeys(
      afterParams,
      denyAttrParamKeysFromAttrsSlot,
    );
  }

  if (attrsSlot && !isEmptyPropertySlot(attrsSlot)) {
    const propRoot = parsePropertyExprToConditionItem(
      stripReenterGroupPropertyMarkers(attrsSlot),
      `${idPrefix}-prop`,
    );
    if (propRoot) {
      const sig = attrTreeSignature(propRoot);
      if (!attrTreeSeen.has(sig)) {
        attrTreeSeen.add(sig);
        attrAccum.push({
          ...propRoot,
          relation: attrAccum.length === 0 ? undefined : "and",
        });
      }
    }
  }

  return mergedRoot;
}

/** `eventGroupExpr` 根下每一项「事件组」分支：GROUP OR，子项为 CONDITION 或 GROUP AND / GROUP OR */
function parseEventGroupBranchToItems(
  branch: Record<string, unknown>,
  branchIdx: number,
  attrTreeSeen: Set<string>,
  attrAccum: FlowConditionItem[],
): FlowConditionItem[] {
  const t = String(branch.type ?? "").toUpperCase();
  if (t === "CONDITION" && branch.group) {
    const one = mergeReenterGroupLeafIntoItem(branch, `reenter-b${branchIdx}-0`, attrTreeSeen, attrAccum);
    return one ? [one] : [];
  }
  if (t !== "GROUP" || !Array.isArray(branch.children)) return [];

  const children = branch.children as Record<string, unknown>[];
  const comb = String(branch.combinator ?? "OR").toUpperCase();

  if (comb !== "OR") {
    const andLeaves = children
      .filter((c) => String(c.type ?? "").toUpperCase() === "CONDITION" && c.group)
      .map((c, i) =>
        mergeReenterGroupLeafIntoItem(c, `reenter-b${branchIdx}-nd-${i}`, attrTreeSeen, attrAccum),
      )
      .filter((x): x is FlowConditionItem => x != null);
    return andLeaves.map((it, ii) => ({
      ...it,
      relation: ii === 0 ? undefined : ("and" as const),
    }));
  }

  const altChains: FlowConditionItem[][] = [];

  children.forEach((ch, chi) => {
    const chT = String(ch.type ?? "").toUpperCase();
    if (chT === "CONDITION" && ch.group) {
      const one = mergeReenterGroupLeafIntoItem(
        ch,
        `reenter-b${branchIdx}-a${altChains.length}-x${chi}`,
        attrTreeSeen,
        attrAccum,
      );
      if (one) altChains.push([one]);
      return;
    }
    if (chT !== "GROUP" || !Array.isArray(ch.children)) return;

    const subComb = String(ch.combinator ?? "AND").toUpperCase();
    const subCh = ch.children as Record<string, unknown>[];

    if (subComb === "AND") {
      const chain = subCh
        .filter((c) => String(c.type ?? "").toUpperCase() === "CONDITION" && c.group)
        .map((c, i) =>
          mergeReenterGroupLeafIntoItem(
            c,
            `reenter-b${branchIdx}-a${altChains.length}-and-${chi}-${i}`,
            attrTreeSeen,
            attrAccum,
          ),
        )
        .filter((x): x is FlowConditionItem => x != null)
        .map((it, ii) => ({
          ...it,
          relation: ii === 0 ? undefined : ("and" as const),
        }));
      if (chain.length) altChains.push(chain);
      return;
    }

    if (subComb === "OR") {
      subCh.forEach((sc, sci) => {
        if (String(sc.type ?? "").toUpperCase() !== "CONDITION" || !sc.group) return;
        const one = mergeReenterGroupLeafIntoItem(
          sc,
          `reenter-b${branchIdx}-a${altChains.length}-or-${chi}-${sci}`,
          attrTreeSeen,
          attrAccum,
        );
        if (one) altChains.push([one]);
      });
    }
  });

  const out: FlowConditionItem[] = [];
  altChains.forEach((chain, ai) => {
    chain.forEach((it, ii) => {
      out.push({
        ...it,
        relation:
          out.length === 0 ? undefined : ai > 0 && ii === 0 ? "or" : ii > 0 ? "and" : undefined,
      });
    });
  });
  return out;
}

function parseReenterEventGroupExprFlatFallback(
  expr: BackendTriggerEventGroupExpr,
  attrTreeSeen: Set<string>,
  attrAccum: FlowConditionItem[],
): FlowConditionItem[] {
  const leaves = collectReenterLeavesEnriched(expr);
  const eventOut: FlowConditionItem[] = [];
  leaves.forEach(({ node: leaf, linkRelation }, gi) => {
    const merged = mergeReenterGroupLeafIntoItem(leaf, `reenter-${gi}`, attrTreeSeen, attrAccum);
    if (!merged) return;
    eventOut.push({
      ...merged,
      relation: linkRelation ?? (gi === 0 ? undefined : "or"),
      eventGroupBranchIndex: 0,
    });
  });
  return [...eventOut, ...attrAccum];
}

function parseReenterEventGroupExprToItems(
  expr: BackendTriggerEventGroupExpr | undefined,
): FlowConditionItem[] {
  if (!expr) return [];
  const root = expr as Record<string, unknown>;
  const attrTreeSeen = new Set<string>();
  const attrAccum: FlowConditionItem[] = [];

  if (String(root.type ?? "").toUpperCase() === "GROUP" && Array.isArray(root.children)) {
    const bc = root.children as Record<string, unknown>[];
    if (bc.length === 0) return parseReenterEventGroupExprFlatFallback(expr, attrTreeSeen, attrAccum);
    const eventOut: FlowConditionItem[] = [];
    bc.forEach((branch, bi) => {
      const items = parseEventGroupBranchToItems(branch, bi, attrTreeSeen, attrAccum);
      items.forEach((it, ii) => {
        const rel =
          eventOut.length === 0 ? undefined : bi > 0 && ii === 0 ? "or" : it.relation;
        eventOut.push({ ...it, relation: rel, eventGroupBranchIndex: bi });
      });
    });
    return [...eventOut, ...attrAccum];
  }

  return parseReenterEventGroupExprFlatFallback(expr, attrTreeSeen, attrAccum);
}

/**
 * 条件组块在编辑器里是「根卡」：顶层 FlowConditionItem 不应带联级链指针。
 * 后端可能在同一 AND 组内给每条 CONDITION 写上相同的 `cascadeChainRootId`，
 * 回显时若根卡也带上，ConditionEditor 会把它当作联级子卡整行跳过。
 */
function stripTopLevelCascadeChainPointer(item: FlowConditionItem): FlowConditionItem {
  if (item.cascadeChainRootId == null && item.cascadeLevel == null) {
    return item;
  }
  const { cascadeChainRootId: _chainRoot, cascadeLevel: _level, ...rest } = item;
  return rest;
}

/** CONDITION 节点 → FlowConditionItem（不含与前后块 relation / group 结构） */
function conditionExprToLeafItem(
  node: BackendConditionExpr & { type: "CONDITION" },
): FlowConditionItem {
  const id = `expr_${Date.now()}_${Math.random()}`;
  const extra = node.extra;
  const timeWindow = resolveConditionExprTimeWindowRaw(node);

  const timeRange: FlowTimeRange | null | undefined =
    parseTimeWindowStringToFlowTimeRange(timeWindow);
  const timeWindowConfig =
    node.timeWindowConfig && typeof node.timeWindowConfig === "object"
      ? (node.timeWindowConfig as {
          direction?: "PAST" | "FUTURE";
          logic?: "WITHIN" | "BEYOND" | "RANGE" | "FIXED" | "TOTAL";
          params?: Record<string, unknown>;
          label?: string;
        })
      : undefined;
  const cascaderPath = Array.isArray(extra?.cascaderPath)
    ? extra.cascaderPath.filter((v): v is string => typeof v === "string")
    : undefined;
  const displayValues = Array.isArray(extra?.displayValues)
    ? extra.displayValues.filter((v): v is string => typeof v === "string")
    : undefined;
  const cascaderPairs = Array.isArray(extra?.cascaderPairs)
    ? extra.cascaderPairs
        .map((pair) => {
          if (!pair || typeof pair !== "object") {
            return null;
          }
          const p = pair as Record<string, unknown>;
          const attrKey = typeof p.attrKey === "string" ? p.attrKey : "";
          const attrLabel = typeof p.attrLabel === "string" ? p.attrLabel : "";
          const pairId = typeof p.id === "string" ? p.id : "";
          const label = typeof p.label === "string" ? p.label : "";
          if (!pairId && !label) {
            return null;
          }
          return {
            attrKey,
            attrLabel,
            id: pairId,
            label,
          };
        })
        .filter(
          (
            pair
          ): pair is { attrKey: string; attrLabel: string; id: string; label: string } =>
            pair !== null
        )
    : undefined;
  /** 联级分步：子卡节点 extra 可含 chain 元数据；未出现时保持与历史流程 JSON 一致。 */
  const cascadeChainRootId =
    typeof extra?.cascadeChainRootId === "string" && extra.cascadeChainRootId.trim().length > 0
      ? extra.cascadeChainRootId.trim()
      : undefined;
  const cascadeLevelRaw = extra?.cascadeLevel;
  const cascadeLevel =
    typeof cascadeLevelRaw === "number" && Number.isFinite(cascadeLevelRaw)
      ? cascadeLevelRaw
      : undefined;
  const rawCascadeUi = extra?.cascadeUi;
  const cascadeUi =
    rawCascadeUi && typeof rawCascadeUi === "object"
      ? {
          splitLevels:
            (rawCascadeUi as { splitLevels?: unknown }).splitLevels === true ? true : undefined,
        }
      : undefined;

  const conditionSource =
      typeof extra?.conditionSource === "string"
      ? (extra.conditionSource as "attribute" | "event")
      : undefined;
  const eventKey =
    typeof extra?.eventKey === "string"
      ? String(extra.eventKey)
      : String(node.field).startsWith("event:")
      ? String(node.field).slice("event:".length)
      : undefined;
  const isEvent = conditionSource === "event" || String(node.field).startsWith("event:");
  const eventParamFilterRows: FlowEventParamFilterRow[] | undefined = (() => {
    const raw = extra?.eventParamFilterRows;
    if (!Array.isArray(raw)) return undefined;
    const out: FlowEventParamFilterRow[] = [];
    for (const el of raw) {
      if (!el || typeof el !== "object") continue;
      const o = el as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const paramKey = typeof o.paramKey === "string" ? o.paramKey : "";
      const op = typeof o.operator === "string" ? o.operator : "EQUALS";
      if (!id || !paramKey) continue;
      out.push({ id, paramKey, operator: op as FlowConditionOperator });
    }
    return out.length > 0 ? out : undefined;
  })();

  const cascaderRootAttrKey =
    Array.isArray(cascaderPairs) && cascaderPairs.length > 0
      ? cascaderPairs[0]?.attrKey
      : undefined;
  const attributeKeyForUI =
    typeof cascaderRootAttrKey === "string" && cascaderRootAttrKey.trim().length > 0
      ? cascaderRootAttrKey.trim()
      : String(node.field);

  return {
    id,
    attributeKey: attributeKeyForUI,
    ...(isEvent ? { conditionSource: "event" as const } : {}),
    operator: node.operator as FlowConditionOperator,
    ...(typeof node.value === "object" &&
    node.value != null &&
    ("min" in node.value || "max" in node.value)
      ? (() => {
          const raw = (extra?.value as unknown) ?? (node.value as unknown);
          const rawMin =
            typeof raw === "object" && raw != null ? (raw as Record<string, unknown>).min : undefined;
          const rawMax =
            typeof raw === "object" && raw != null ? (raw as Record<string, unknown>).max : undefined;
          const min = rawMin != null ? Number(rawMin) : undefined;
          const max = rawMax != null ? Number(rawMax) : undefined;
          const hasValidBounds = Number.isFinite(min) && Number.isFinite(max);
          if (!hasValidBounds) {
            return {};
          }
          return {
            inputMode: "range" as const,
            min,
            max,
            value: undefined,
          };
        })()
      : {
          value:
            (extra?.value as number | string | string[] | boolean | undefined) ??
            (node.value as number | string | string[] | boolean),
        }),
    ...(cascaderPath != null ? { cascaderPath } : {}),
    ...(displayValues != null ? { displayValues } : {}),
    ...(cascaderPairs != null ? { cascaderPairs } : {}),
    ...(cascaderPairs != null
      ? {
          inputMode: "cascader",
          cascaderAttributes: cascaderPairs
            .filter((p) => typeof p.attrKey === "string" && p.attrKey.trim().length > 0)
            .map((p) => ({
              key: p.attrKey,
              label: p.attrLabel || p.attrKey,
            })),
        }
      : {}),
    ...(cascadeChainRootId ? { cascadeChainRootId } : {}),
    ...(cascadeLevel != null ? { cascadeLevel } : {}),
    ...(cascadeUi && cascadeUi.splitLevels === true ? { cascadeUi } : {}),
    ...(timeWindow ? { timeWindow } : {}),
    ...(timeWindowConfig ? { timeWindowConfig } : {}),
    ...(timeRange ? { timeRange } : {}),
    ...(isEvent
      ? {
          eventKey,
          eventName:
            typeof extra?.eventName === "string" ? String(extra.eventName) : eventKey,
          eventCategory:
            typeof extra?.eventCategory === "string"
              ? String(extra.eventCategory)
              : undefined,
          eventType:
            extra?.eventType === "active" || extra?.eventType === "passive"
              ? extra.eventType
              : undefined,
          eventParams:
            extra?.eventParams && typeof extra.eventParams === "object"
              ? (extra.eventParams as Record<string, string | number | boolean | string[]>)
              : undefined,
          eventParamDisplayLabels: (() => {
            const raw = extra?.eventParamDisplayLabels;
            if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
              return undefined;
            }
            const o = raw as Record<string, unknown>;
            const out: Record<string, string | string[]> = {};
            for (const [k, v] of Object.entries(o)) {
              if (typeof v === "string") {
                out[k] = v;
              } else if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
                out[k] = v as string[];
              }
            }
            return Object.keys(out).length > 0 ? out : undefined;
          })(),
          eventParamFilterRows,
          eventParamKey:
            typeof extra?.eventParamKey === "string" ? String(extra.eventParamKey) : undefined,
          eventParamLabel:
            typeof extra?.eventParamLabel === "string" ? String(extra.eventParamLabel) : undefined,
          eventParamType:
            extra?.eventParamType === "string" ||
            extra?.eventParamType === "number" ||
            extra?.eventParamType === "percentage" ||
            extra?.eventParamType === "enum" ||
            extra?.eventParamType === "boolean"
              ? extra.eventParamType
              : undefined,
          supportsDateSetting:
            typeof extra?.supportsDateSetting === "boolean"
              ? Boolean(extra.supportsDateSetting)
              : undefined,
        }
      : {}),
  };
}

/** 将同一 GROUP 下均为 CONDITION 的子节点合并为一个「条件卡片 + groupItems」 */
function mergeConditionChildrenToOneBlock(
  children: Array<BackendConditionExpr & { type: "CONDITION" }>,
  combinator: "AND" | "OR",
): FlowConditionItem {
  const groupRelation = combinator === "OR" ? ("or" as const) : ("and" as const);
  if (children.length === 1) {
    return stripTopLevelCascadeChainPointer(conditionExprToLeafItem(children[0]));
  }
  const first = conditionExprToLeafItem(children[0]);
  /** 仅「联级分步」(根卡 cascadeUi.splitLevels) 下，组内后续 cascader 才是链上子卡；否则不得写 chain 元数据，否则 ConditionEditor 会把带 cascadeChainRootId 的条目整行跳过。 */
  const splitCascadeGroup = first.cascadeUi?.splitLevels === true;
  const nested: FlowConditionItem[] = [];
  for (let i = 1; i < children.length; i++) {
    const leaf = conditionExprToLeafItem(children[i]);
    const { cascadeChainRootId: _dropRoot, cascadeLevel: _dropLv, ...leafRest } = leaf;
    const isSplitCascadeChild = splitCascadeGroup && leaf.inputMode === "cascader";
    nested.push({
      ...leafRest,
      relation: i === 1 ? undefined : groupRelation,
      ...(isSplitCascadeChild
        ? {
            cascadeChainRootId: first.id,
            cascadeLevel: leaf.cascadeLevel ?? i + 1,
          }
        : {}),
    });
  }
  return stripTopLevelCascadeChainPointer({
    ...first,
    groupRelation,
    groupItems: nested,
  });
}

/**
 * 单棵子树（一个条件组块）→ 一条 FlowConditionItem（含 groupItems）。
 */
function blockExprToFlowItem(node: BackendConditionExpr): FlowConditionItem {
  if (node.type === "CONDITION") {
    return stripTopLevelCascadeChainPointer(conditionExprToLeafItem(node));
  }
  let inner: BackendConditionExpr = node;
  while (
    inner.type === "GROUP" &&
    inner.combinator === "AND" &&
    inner.children?.length === 1 &&
    inner.children[0]
  ) {
    inner = inner.children[0];
  }
  if (inner.type === "CONDITION") {
    return stripTopLevelCascadeChainPointer(conditionExprToLeafItem(inner));
  }
  const children = inner.children ?? [];
  if (children.length === 0) {
    return stripTopLevelCascadeChainPointer(
      conditionExprToLeafItem({
        type: "CONDITION",
        field: "",
        operator: "EQUALS",
        value: undefined,
      }),
    );
  }
  if (children.length === 1 && children[0]) {
    return blockExprToFlowItem(children[0]);
  }
  const allCondition = children.every((c) => c.type === "CONDITION");
  if (allCondition) {
    return mergeConditionChildrenToOneBlock(
      children as Array<BackendConditionExpr & { type: "CONDITION" }>,
      inner.combinator,
    );
  }
  const comb = inner.combinator === "OR" ? ("or" as const) : ("and" as const);
  const first = blockExprToFlowItem(children[0]);
  const groupItems: FlowConditionItem[] = [];
  for (let i = 1; i < children.length; i++) {
    groupItems.push({
      ...blockExprToFlowItem(children[i]),
      relation: i === 1 ? undefined : comb,
    });
  }
  return stripTopLevelCascadeChainPointer({
    ...first,
    groupRelation: comb,
    groupItems,
  });
}

/**
 * 将后端根 GROUP 还原为 ConditionEditor 顶层列表。
 * 约定：单块保存为 GROUP + AND + [ 块 ]；多块且组间关系一致时根 children 与条件组一一对应。
 */
function exprToFlowConditionItems(expr: BackendConditionNode): FlowConditionItem[] {
  if (expr.type === "CONDITION") {
    return [stripTopLevelCascadeChainPointer(conditionExprToLeafItem(expr))];
  }

  let node: BackendConditionExpr = expr;
  let peeledAndWrapper = 0;
  while (
    node.type === "GROUP" &&
    node.combinator === "AND" &&
    node.children?.length === 1 &&
    node.children[0]
  ) {
    peeledAndWrapper++;
    node = node.children[0];
  }

  if (node.type === "CONDITION") {
    return [stripTopLevelCascadeChainPointer(conditionExprToLeafItem(node))];
  }

  const children = node.children ?? [];
  if (children.length === 0) {
    return [];
  }
  if (children.length === 1 && children[0]) {
    return exprToFlowConditionItems(children[0]);
  }

  /** 剥过「单块」外层 AND 包装后，整棵 node 对应编辑器里的一条顶层条件组 */
  if (peeledAndWrapper > 0) {
    return [blockExprToFlowItem(node)];
  }

  const comb = node.combinator === "OR" ? ("or" as const) : ("and" as const);
  const blocks = children.map((ch) => blockExprToFlowItem(ch));
  return blocks.map((b, i) => (i === 0 ? b : { ...b, relation: comb }));
}

function flattenConditionExprToItems(expr: BackendConditionExpr | undefined): FlowConditionItem[] {
  if (!expr) return [];
  return exprToFlowConditionItems(expr);
}

/**
 * 触发器出边 `edges[].conditionExpr` 仅承载流程属性条件（与 flowGraphPayload 约定一致）。
 * 接口若把属性条件写在 `extra.eventParamFilterRows` 或误标 `field: event:*`，`conditionExprToLeafItem`
 * 会误判为事件行；合并进 `conditionGroup` 前必须剥掉事件专用字段并固定为 attribute。
 */
function sanitizeStartTriggerEdgeConditionExprItems(items: FlowConditionItem[]): FlowConditionItem[] {
  const stripOne = (it: FlowConditionItem): FlowConditionItem => {
    const {
      eventKey: _ek,
      eventName: _en,
      eventCategory: _ec,
      eventType: _et,
      eventParams: _ep,
      eventParamDisplayLabels: _epdl,
      eventParamFilterRows: _epr,
      eventParamKey: _epk,
      eventParamLabel: _epl,
      eventParamType: _ept,
      supportsDateSetting: _sd,
      eventTriggerTime: _ett,
      eventOccurrenceOperator: _eoo,
      eventOccurrenceValue: _eov,
      groupItems,
      ...rest
    } = it;
    const next: FlowConditionItem = {
      ...rest,
      conditionSource: "attribute",
    };
    if (groupItems?.length) {
      next.groupItems = groupItems.map(stripOne);
    }
    return next;
  };
  return items.map(stripOne);
}

/**
 * 从 conditionExpr 取规则说明：优先根 GROUP.remark；兼容历史数据（写在首个 CONDITION.remark）。
 */
function extractRemarkFromExpr(expr: BackendConditionExpr | undefined): string | undefined {
  if (!expr) {
    return undefined;
  }
  if (expr.type === "GROUP") {
    if (typeof expr.remark === "string" && expr.remark.trim().length > 0) {
      return expr.remark.trim();
    }
    for (const child of expr.children) {
      const found = extractRemarkFromExpr(child);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
  if (expr.type === "CONDITION") {
    if (typeof expr.remark === "string" && expr.remark.trim().length > 0) {
      return expr.remark.trim();
    }
  }
  return undefined;
}

function mapBackendNodeTypeToFrontend(nodeTypeRaw: string | undefined): FlowNodeType | null {
  const t = (nodeTypeRaw ?? "").toLowerCase();
  // 兼容后端可能返回的命名差异（驼峰/下划线/中划线等）
  const normalized = t.replace(/[_-]/g, "");

  // 新后端枚举兼容：
  // Trigger / Check_Conditions / Action / Wait
  if (normalized === "start" || normalized === "trigger") return "start";
  if (normalized === "execute" || normalized === "action") return "execute";
  if (normalized === "wait") return "wait";
  // conditionCheck 可能来自：
  // - condition / check_conditions / checkconditions（历史/现有）
  // - conditionCheck（驼峰）
  // - condition_check / check-condition 等
  if (
    normalized === "condition" ||
    normalized === "checkconditions" ||
    normalized === "conditioncheck" ||
    normalized === "checkcondition"
  ) {
    return "conditionCheck";
  }

  // 开发阶段不再支持老 end / waitEvent 等节点，直接忽略
  return null;
}

/** 转换后给后端的节点结构：入口、出口、表单信息 */
export interface FlowNodeBackendPayload {
  id: string;
  nodeType: FlowNodeType;
  /** 入口：指向本节点的边（sourceNodeId + edgeId） */
  inlets: { sourceNodeId: string; edgeId: string }[];
  /** 出口：从本节点指出的边（targetNodeId + edgeId） */
  outlets: { targetNodeId: string; edgeId: string }[];
  /** 节点表单/属性（名称、状态、业务字段等） */
  form: FlowNodeData;
}

/** 条件检查 → 条件组分支 的纯展示用内部边（与 useFlowNodeOperations 写入的 data 一致） */
function isConditionGroupBranchInternalEdge(edge: Edge): boolean {
  const d = (edge.getData() ?? {}) as Record<string, unknown>;
  return d.isConditionGroupBranchEdge === true;
}

/** 从画布构建提交给后端的 payload（节点含入口、出口与表单） */
export function buildBackendPayload(graph: Graph): {
  nodes: FlowNodeBackendPayload[];
} {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();
  const inletsByNode = new Map<string, { sourceNodeId: string; edgeId: string }[]>();
  const outletsByNode = new Map<string, { targetNodeId: string; edgeId: string }[]>();
  nodes.forEach((n) => {
    inletsByNode.set(n.id, []);
    outletsByNode.set(n.id, []);
  });
  /** 与遍历顺序无关：每个节点第一条「非条件组内部」出边的 id（用于条件检查→分支 与后端 edgeCode 对齐） */
  const firstNonInternalOutEdgeIdBySource = new Map<string, string>();
  for (const edge of edges) {
    if (isConditionGroupBranchInternalEdge(edge)) {
      continue;
    }
    const srcId = edge.getSourceCellId();
    if (!firstNonInternalOutEdgeIdBySource.has(srcId)) {
      firstNonInternalOutEdgeIdBySource.set(srcId, edge.id);
    }
  }
  edges.forEach((e) => {
    const src = e.getSourceCellId();
    const tgt = e.getTargetCellId();

    if (isConditionGroupBranchInternalEdge(e)) {
      const branchId = tgt;
      const edgeIdForPayload =
        firstNonInternalOutEdgeIdBySource.get(branchId) ?? e.id;
      if (outletsByNode.has(src)) {
        outletsByNode
          .get(src)!
          .push({ targetNodeId: branchId, edgeId: edgeIdForPayload });
      }
      if (inletsByNode.has(branchId)) {
        inletsByNode
          .get(branchId)!
          .push({ sourceNodeId: src, edgeId: edgeIdForPayload });
      }
      return;
    }

    const edgeId = e.id;
    if (outletsByNode.has(src))
      outletsByNode.get(src)!.push({ targetNodeId: tgt, edgeId });
    if (inletsByNode.has(tgt))
      inletsByNode.get(tgt)!.push({ sourceNodeId: src, edgeId });
  });
  const payloadNodes: FlowNodeBackendPayload[] = nodes.map((node) => {
    const data = (node.getData() ?? {}) as FlowNodeData;
    return {
      id: node.id,
      nodeType: (data.nodeType ?? "execute") as FlowNodeType,
      inlets: inletsByNode.get(node.id) ?? [],
      outlets: outletsByNode.get(node.id) ?? [],
      form: data,
    };
  });
  return { nodes: payloadNodes };
}

/** 获取某节点通过出边直接连到的所有分支小圆节点 ID（删除条件节点时顺带删这些） */
export function getDownstreamBranchNodeIds(
  graph: Graph,
  nodeId: string
): string[] {
  const edges = graph.getEdges().filter((e) => e.getSourceCellId() === nodeId);
  const ids: string[] = [];
  edges.forEach((e) => {
    const targetId = e.getTargetCellId();
    const target = graph.getCellById(targetId);
    if (target?.isNode()) {
      const data = (target.getData() ?? {}) as FlowNodeData;
      if (data.nodeType === "branch") ids.push(targetId);
    }
  });
  return ids;
}

/**
 * 从后端 FlowDefinitionDetail 加载数据到 X6 画布
 * @param graph X6 画布实例
 * @param detail 后端返回的 Flow 定义详情
 */
export function loadFlowFromBackend(
  graph: Graph,
  detail: FlowDefinitionDetail,
): void {
  // 清空画布
  graph.clearCells();

  const nodes = detail.nodes ?? [];
  const edges = detail.edges ?? [];

  if (nodes.length === 0) {
    return;
  }

  // 创建节点映射：nodeCode -> Node
  const nodeMap = new Map<string, Node>();

  // 默认布局：从左到右，从上到下
  const horizontalGap = 220;
  const verticalGap = 140;
  const startX = 100;
  const startY = 100;

  // 后端已将条件配置收敛到 edges[].conditionExpr，前端不再使用 conditionGroups/actions 这类聚合字段

  // 第一步：创建所有节点（忽略不支持的老节点类型）
  nodes.forEach((nodeDef, index) => {
    const nodeType =
      mapBackendNodeTypeToFrontend(nodeDef.nodeType) ??
      mapBackendNodeTypeToFrontend(
        (nodeDef.nodeConfig as { nodeType?: string } | undefined)?.nodeType
      );
    if (!nodeType) return;
    const preset = FLOW_NODE_PRESETS[nodeType] ?? FLOW_NODE_PRESETS.execute;
    
    // 从 nodeConfig 中解析节点数据
    const nodeConfig = (nodeDef.nodeConfig ?? {}) as Partial<FlowNodeData> &
      Record<string, unknown>;
    const waitDurationRaw = nodeConfig.waitForTimeValue;
    const waitDurationFromBackend =
      typeof waitDurationRaw === "number"
        ? waitDurationRaw
        : typeof waitDurationRaw === "string" && waitDurationRaw.trim().length > 0
          ? Number(waitDurationRaw)
          : undefined;
    const waitUnitRaw =
      typeof nodeConfig.waitForTimeUnit === "string"
        ? nodeConfig.waitForTimeUnit
        : undefined;
    const waitUnitMapToFrontend: Record<string, FlowNodeData["waitUnit"]> = {
      // 新值：前后端统一为复数枚举
      minutes: "minutes",
      hours: "hours",
      days: "days",
      weeks: "weeks",
      months: "months",
      // 后端枚举名（如 WAIT_TIME_UNIT_HOURS）
      wait_time_unit_minutes: "minutes",
      wait_time_unit_hours: "hours",
      wait_time_unit_days: "days",
      wait_time_unit_weeks: "weeks",
      wait_time_unit_months: "months",
      // 兼容历史值
      minute: "minutes",
      hour: "hours",
      day: "days",
      week: "weeks",
      month: "months",
    };
    const waitUnitFromBackend = waitUnitRaw
      ? waitUnitMapToFrontend[String(waitUnitRaw).toLowerCase()]
      : undefined;
    const waitTypeFromBackend: FlowWaitType =
      nodeType === "wait"
        ? resolveWaitTimerType(nodeConfig as Record<string, unknown>)
        : normalizeFlowWaitType((nodeConfig as { timerType?: unknown }).timerType);

    const nodeData: FlowNodeData = {
      nodeType,
      name: nodeDef.nodeName ?? `节点${index + 1}`,
      status: nodeConfig.status ?? (nodeType === "start" ? "config" : "unconfig"),
      disabled: nodeConfig.disabled ?? false,
      // 新结构：基础配置描述写在 nodeDef.remark；兼容老结构 nodeConfig.description
      description:
        (typeof nodeConfig.description === "string" && nodeConfig.description.length > 0
          ? nodeConfig.description
          : undefined) ??
        (typeof (nodeDef as { remark?: string }).remark === "string"
          ? (nodeDef as { remark?: string }).remark
          : undefined),
      waitDuration: waitDurationFromBackend,
      waitUnit: waitUnitFromBackend,
      waitType: waitTypeFromBackend,
      waitEventCategory: nodeConfig.waitEventCategory,
      waitEventKey: nodeConfig.waitEventKey,
      conditionGroup: nodeConfig.conditionGroup,
      executeGroup: nodeConfig.executeGroup,
      customProps: nodeConfig.customProps,
      remark: nodeConfig.remark ?? (nodeDef as { remark?: string }).remark,
      ...nodeConfig,
    };

    /** nodeConfig 展开在后，会覆盖上文由 timerType 推导的 wait 字段，导致「等待方式」等无法按协议回显 */
    if (nodeType === "wait") {
      nodeData.waitType = waitTypeFromBackend;
      nodeData.timerType = waitTypeFromBackend;
      nodeData.waitDuration = waitDurationFromBackend;
      nodeData.waitUnit = waitUnitFromBackend;
    }

    // Trigger 节点：开始节点事件分组表达式在 nodeConfig.eventGroupExpr
    if (nodeData.nodeType === "start") {
      const reenterExpr = parseBackendEventGroupExpr(
        (nodeConfig as { eventGroupExpr?: unknown }).eventGroupExpr,
      );
      const parsedItems = parseReenterEventGroupExprToItems(reenterExpr);
      if (parsedItems.length > 0) {
        nodeData.conditionGroup = { items: parsedItems };
      }
    }

    // WAIT 节点按 timerType 回显：等待事件走 eventGroupExpr；按时长走 waitForTimeUnit/value
    if (nodeData.nodeType === "wait") {
      if (waitTypeFromBackend === "wait_for_event_in_window") {
        const waitReenterExpr = parseBackendEventGroupExpr(
          (nodeConfig as { eventGroupExpr?: unknown }).eventGroupExpr,
        );
        const waitParsedItems = waitReenterExpr
          ? parseReenterEventGroupExprToItems(waitReenterExpr)
          : [];
        nodeData.conditionGroup =
          waitParsedItems.length > 0 ? { items: waitParsedItems } : undefined;
        nodeData.waitDuration = undefined;
        nodeData.waitUnit = undefined;
      } else {
        nodeData.conditionGroup = undefined;
        nodeData.waitDuration =
          typeof waitDurationFromBackend === "number" && Number.isFinite(waitDurationFromBackend)
            ? waitDurationFromBackend
            : undefined;
        nodeData.waitUnit = waitUnitFromBackend;
      }
    }

    // 执行节点：从后端 actionType + actionAlarmDto/payload 回显为前端 executeGroup
    if (nodeData.nodeType === "execute") {
      const cfg = nodeConfig as Record<string, unknown>;
      const actionTypeRaw = nodeConfig.actionType as string | undefined;
      const rawPayload = getDingTalkFeedAlarmPayloadFromNodeConfig(cfg);
      const rawMaxExecutionCount = cfg.maxExecutionCount;
      const maxExecutionCount =
        typeof rawMaxExecutionCount === "number" &&
        Number.isFinite(rawMaxExecutionCount) &&
        rawMaxExecutionCount > 0
          ? Math.floor(rawMaxExecutionCount)
          : undefined;

      if (shouldHydrateDingTalkFeedAlarmFromNodeConfig(cfg, rawPayload)) {
        const nextGroup = flowExecuteGroupFromDingTalkBackendPayload(rawPayload!);
        if (nextGroup) {
          nodeData.executeGroup = {
            ...nextGroup,
            nodeConfig:
              maxExecutionCount !== undefined
                ? { ...(nextGroup.nodeConfig ?? {}), maxExecutionCount }
                : nextGroup.nodeConfig,
          };
        }
      } else {
        const payload = rawPayload as
          | { value?: unknown; valueType?: string; attributeKey?: string }
          | undefined;

        const hasBackendExecuteConfig =
          actionTypeRaw && payload && typeof payload.attributeKey === "string";

        if (!nodeData.executeGroup && hasBackendExecuteConfig) {
          const normalizedAction: FlowExecuteActionType = actionTypeRaw as FlowExecuteActionType;

          const normalizedMode =
            payload?.valueType &&
            typeof payload.valueType === "string" &&
            payload.valueType.toUpperCase() === "RULE"
              ? "RULE"
              : "FIXED";

          nodeData.executeGroup = {
            actionType: normalizedAction,
            items: [
              {
                id: `${payload?.attributeKey ?? "execute"}-0`,
                attributeKey: payload!.attributeKey ?? "",
                value: payload?.value as number | string | string[] | boolean | undefined,
                executeMode: normalizedMode,
              },
            ],
            ...(maxExecutionCount !== undefined
              ? {
                  nodeConfig: {
                    maxExecutionCount,
                  },
                }
              : {}),
          };
        }
      }
    }
    // conditionCheck 的条件组将在建边阶段从 edges[].conditionExpr 聚合

    // 计算节点位置（简单网格布局）
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = startX + col * horizontalGap;
    const y = startY + row * verticalGap;

    const node = graph.addNode({
      shape: preset.shape,
      x,
      y,
      label: nodeData.name,
      id: nodeDef.nodeCode, // 使用 nodeCode 作为节点 ID
      ...(preset.ports != null && { ports: preset.ports }),
      data: nodeData,
      ...(preset.attrs != null && {
        attrs: preset.attrs as Record<string, Record<string, string>>,
      }),
    }) as Node;

    applyNodeStatusStyle(node, nodeData);
    nodeMap.set(nodeDef.nodeCode, node);
  });

  // 第二步：创建边
  edges.forEach((edgeDef) => {
    const sourceNode = nodeMap.get(edgeDef.sourceNodeCode ?? "");
    const targetNode = nodeMap.get(edgeDef.targetNodeCode ?? "");

    if (!sourceNode || !targetNode) {
      return;
    }

    const srcData = (sourceNode.getData() ?? {}) as FlowNodeData;

    // 确保端口在创建边之前存在，否则 conditionCheck 分组连线可能无法正确渲染
    // 这里选择 fixed 的 vertical 端口布局，和 loadFlowFromBackend 最终 formatCanvasSilent 保持一致
    if (!sourceNode.getPorts().length) {
      sourceNode.setProp(
        "ports",
        srcData.nodeType === "start" ? onePortOutVertical : twoPortsVertical,
      );
    }
    if (!targetNode.getPorts().length) {
      const targetData = (targetNode.getData() ?? {}) as FlowNodeData;
      targetNode.setProp(
        "ports",
        targetData.nodeType === "start" ? onePortOutVertical : twoPortsVertical,
      );
    }

    // 触发器节点：从 edges.conditionExpr 还原触发条件到 conditionGroup
    if (srcData.nodeType === "start" && edgeDef.conditionExpr != null) {
      const expr = edgeDef.conditionExpr as unknown as BackendConditionExpr;
      const items = sanitizeStartTriggerEdgeConditionExprItems(flattenConditionExprToItems(expr));
      const ruleRemark = extractRemarkFromExpr(expr);
      const existingGroup = Array.isArray(srcData.conditionGroup?.items)
        ? (srcData.conditionGroup.items as unknown[])
        : [];
      // 多条出边如果都带 conditionExpr，则合并所有条件
      const mergedItems = [...existingGroup, ...items];
      sourceNode.setData({
        ...srcData,
        conditionGroup: mergedItems.length > 0 ? { items: mergedItems } : undefined,
        ...(ruleRemark ? { ruleRemark } : {}),
      });
    }

    // 条件检查节点的边：根据 conditionExpr 还原“条件组分支节点”的结构
    if (srcData.nodeType === "conditionCheck" && edgeDef.conditionExpr != null) {
      const expr = edgeDef.conditionExpr as unknown as BackendConditionExpr;
      const items = flattenConditionExprToItems(expr);
      const prevGroups = Array.isArray(srcData.conditionGroups) ? srcData.conditionGroups : [];

      // 为该边生成一个稳定的条件组 id，后续编辑时可复用
      const groupId = `${sourceNode.id}_edge_${edgeDef.edgeCode}`;
      const groupName =
        (typeof edgeDef.conditionName === "string" && edgeDef.conditionName.trim()
          ? edgeDef.conditionName.trim()
          : undefined) ??
        extractConditionNameFromExpr(expr) ??
        (edgeDef.conditionResult === 1
          ? "Yes"
          : edgeDef.conditionResult === 0
          ? "No"
          : "Group");

      const nextGroups = [
        ...prevGroups,
        { id: groupId, name: groupName, group: { items } },
      ];

      sourceNode.setData({
        ...srcData,
        conditionGroups: nextGroups,
      });

      // 创建条件组分支节点（与编辑时的结构保持一致：conditionCheck -> conditionGroupBranch -> 业务节点）
      const preset = FLOW_NODE_PRESETS.conditionGroupBranch!;
      const srcBox = sourceNode.getBBox();
      const branchX = srcBox.x + srcBox.width + 80;
      const branchY = srcBox.y + 40;

      const branchNode = graph.addNode({
        shape: preset.shape,
        x: branchX,
        y: branchY,
        label: groupName,
        // conditionGroupBranch 节点必须在创建内部边之前拥有 in/out 端口
        ports: twoPortsVertical,
        data: {
          ...preset.data,
          nodeType: "conditionGroupBranch",
          name: groupName,
          parentNodeId: sourceNode.id,
          conditionGroupId: groupId,
        } as FlowNodeData,
        ...(preset.attrs != null && {
          attrs: preset.attrs as Record<string, Record<string, string>>,
        }),
      }) as Node;

      const branchData = branchNode.getData() as FlowNodeData | undefined;
      if (branchData) applyNodeStatusStyle(branchNode, branchData);

      // 条件检查节点 -> 条件组分支节点（内部边，不指定 id：避免与后端 edgeCode 混用；导出 payload 时用分支出边 id）
      const internalEdge = graph.addEdge({
        source: { cell: sourceNode.id, port: "out" },
        target: { cell: branchNode.id, port: "in" },
        attrs: {
          line: {
            stroke: "#5F95FF",
            strokeWidth: 1,
            targetMarker: { name: "classic", size: 8 },
          },
        },
        router: { name: "manhattan" },
        connector: { name: "normal" },
        zIndex: 0,
      }) as Edge;
      internalEdge.setData({
        // 标记为条件组内部边，供属性应用时复用（避免重复创建）
        isConditionGroupBranchEdge: true,
        // 兼容旧的条件分支标记常量
        [CONDITION_BRANCH_EDGE_DATA_KEY]: true,
      });

      // 条件组分支节点 -> 实际业务子节点
      graph.addEdge({
        id: edgeDef.edgeCode,
        source: { cell: branchNode.id, port: "out" },
        target: { cell: targetNode.id, port: "in" },
        attrs: {
          line: {
            stroke: "#5F95FF",
            strokeWidth: 1,
            targetMarker: { name: "classic", size: 8 },
          },
        },
        router: { name: "manhattan" },
        connector: { name: "rounded", args: { radius: 8 } },
        zIndex: 0,
      });

      return;
    }

    // 普通节点之间的连接（无条件表达式）
    const edge = graph.addEdge({
      id: edgeDef.edgeCode,
      source: { cell: sourceNode.id, port: "out" },
      target: { cell: targetNode.id, port: "in" },
      attrs: {
        line: {
          stroke: "#5F95FF",
          strokeWidth: 1,
          targetMarker: { name: "classic", size: 8 },
        },
      },
      router: { name: "manhattan" },
      connector: { name: "rounded", args: { radius: 8 } },
      zIndex: 0,
    }) as Edge;

    // 如果是条件分支边（conditionResult 为 1 或 0），标记为不可删除
    if (edgeDef.conditionResult !== undefined) {
      edge.setData({ [CONDITION_BRANCH_EDGE_DATA_KEY]: true });
    }
  });

  // 加载完成后自动格式化画布布局（静默模式，不显示提示），默认使用横向布局
  formatCanvasSilent(graph, "vertical");
}

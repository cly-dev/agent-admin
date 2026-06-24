// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/services/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import type {
  CreateSkillDto,
  ReplaceSkillToolsDto,
  SkillController_findByAgentParams,
  SkillController_findByAppClientParams,
  UpdateSkillDto,
} from '@/types/skill';
import { http } from '@/utils/request';

/**
 * 分页查询 Agent 下的 Skill 列表
 * @description 每条记录含嵌套 agent、appClient。
 * @tags skill
 */
export function SkillController_findByAgent(
  agentId: number,
  appClientId: number,
  params?: SkillController_findByAgentParams,
) {
  return http.get<void>(
    `admin/agent/${agentId}/app-client/${appClientId}/skills`,
    params,
  );
}

/**
 * 为 Agent 创建 Skill
 * @description Skill 归属该 Agent；可选初始 SkillTool，toolId 须已出现在 AgentTool 中。响应含嵌套 agent、appClient。
 * @tags skill
 */
export function SkillController_create(
  agentId: number,
  appClientId: number,
  data: CreateSkillDto,
) {
  return http.post<void>(
    `admin/agent/${agentId}/app-client/${appClientId}/skills`,
    data,
  );
}

/**
 * 按 AppClient 分页查询 Skill（可选 agentId 筛选）
 * @description 每条记录含嵌套 agent、appClient。
 * @tags skill
 */
export function SkillController_findByAppClient(
  appClientId: number,
  params?: SkillController_findByAppClientParams,
) {
  return http.get<void>(`admin/skill/by-app-client/${appClientId}`, params);
}

/**
 * 按 ID 查询 Skill 详情
 * @tags skill
 */
export function SkillController_findOne(skillId: number) {
  return http.get<void>(`admin/skill/${skillId}`);
}

/**
 * 按 ID 更新 Skill（不含工具绑定）
 * @tags skill
 */
export function SkillController_update(skillId: number, data: UpdateSkillDto) {
  return http.patch<void>(`admin/skill/${skillId}`, data);
}

/**
 * 按 ID 删除 Skill（级联删除 SkillTool）
 * @tags skill
 */
export function SkillController_remove(skillId: number) {
  return http.delete<void>(`admin/skill/${skillId}`);
}

/**
 * 全量替换 Skill 关联工具
 * @description toolId 须属于该 Skill 所属 Agent 的 AgentTool。
 * @tags skill
 */
export function SkillController_replaceTools(
  skillId: number,
  data: ReplaceSkillToolsDto,
) {
  return http.put<void>(`admin/skill/${skillId}/tools`, data);
}

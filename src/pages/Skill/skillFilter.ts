import type { SkillControllerFindByAppClientParams } from '@/types/skill';

export type SkillFilterFormValues = {
  keyword?: string;
  id?: number;
  name?: string;
  capabilityKey?: string;
  agentId?: number;
  isActive?: '' | 'true' | 'false';
};

export type SkillFilterValues = Pick<
  SkillControllerFindByAppClientParams,
  'id' | 'name' | 'capabilityKey' | 'keyword' | 'agentId' | 'isActive'
>;

export function normalizeSkillFilter(
  values: SkillFilterFormValues,
): SkillFilterValues {
  const filters: SkillFilterValues = {};

  const keyword = values.keyword?.trim();
  if (keyword) {
    filters.keyword = keyword;
  }

  if (
    typeof values.id === 'number' &&
    Number.isFinite(values.id) &&
    values.id > 0
  ) {
    filters.id = values.id;
  }

  const name = values.name?.trim();
  if (name) {
    filters.name = name;
  }

  const capabilityKey = values.capabilityKey?.trim();
  if (capabilityKey) {
    filters.capabilityKey = capabilityKey;
  }

  if (
    typeof values.agentId === 'number' &&
    Number.isFinite(values.agentId) &&
    values.agentId > 0
  ) {
    filters.agentId = values.agentId;
  }

  if (values.isActive === 'true') {
    filters.isActive = true;
  } else if (values.isActive === 'false') {
    filters.isActive = false;
  }

  return filters;
}

export function countActiveSkillFilters(filters: SkillFilterValues): number {
  let count = 0;
  if (filters.keyword) count += 1;
  if (filters.id) count += 1;
  if (filters.name) count += 1;
  if (filters.capabilityKey) count += 1;
  if (filters.agentId) count += 1;
  if (filters.isActive !== undefined) count += 1;
  return count;
}

export type HostPage = {
  id: number;
  appClientId: number;
  appClientName?: string;
  scope: string;
  label: string;
  description?: string | null;
  routePattern?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  hostToolCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateHostPageDto = {
  appClientId: number;
  scope: string;
  label: string;
  description?: string;
  routePattern?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateHostPageDto = {
  scope?: string;
  label?: string;
  description?: string | null;
  routePattern?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type HostPageControllerFindByAppClientParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  scope?: string;
  isActive?: boolean;
};

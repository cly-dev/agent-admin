declare module 'swagger-typescript-api' {
  export interface GenerateApiOptions {
    name?: string;
    input?: string;
    output?: string;
    generateClient?: boolean;
    generateRouteTypes?: boolean;
    extractRequestParams?: boolean;
    extractRequestBody?: boolean;
    modular?: boolean;
    cleanOutput?: boolean;
    prettier?: Record<string, unknown>;
  }

  export function generateApi(options: GenerateApiOptions): Promise<void>;
}

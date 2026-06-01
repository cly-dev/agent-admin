// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Hand-maintained — OpenAPI stubs: script/archive/openapi-gen/services/
// Source: http://localhost:3030/docs-json

import { http } from "@/utils/request";

/**
 * @tags misc
 */
export function AppController_getHello() {
  return http.get<void>("admin");
}

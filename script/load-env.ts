import fs from 'fs';
import path from 'path';

/** 按优先级从低到高加载；后加载的文件覆盖先前的值。 */
const ENV_FILE_ORDER = (umiEnv?: string): string[] => {
  const files = ['.env'];
  if (umiEnv) {
    files.push(`.env.${umiEnv}`);
  }
  files.push('.env.local');
  if (umiEnv) {
    files.push(`.env.${umiEnv}.local`);
  }
  return files;
};

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const result: Record<string, string> = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

/** 在读取 .umirc.ts 配置前调用，把 dotenv 文件合并进 process.env。 */
export function loadEnv(cwd: string = process.cwd()): void {
  const umiEnv = process.env.UMI_ENV;

  for (const file of ENV_FILE_ORDER(umiEnv)) {
    const vars = parseEnvFile(path.join(cwd, file));
    for (const [key, value] of Object.entries(vars)) {
      process.env[key] = value;
    }
  }
}

/** 收集 UMI_APP_* 与 UMI_ENV，供 umi define 注入到浏览器 bundle。 */
export function buildUmiAppEnvDefine(): Record<string, string> {
  const define: Record<string, string> = {
    'process.env.UMI_ENV': process.env.UMI_ENV ?? '',
  };

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('UMI_APP_')) {
      define[`process.env.${key}`] = value ?? '';
    }
  }

  return define;
}

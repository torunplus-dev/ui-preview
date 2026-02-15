import type { ScreenSpec } from '@ui-preview/ui-spec';
import { validateScreenSpec } from '@ui-preview/ui-spec';
import YAML from 'yaml';

export async function loadSpecFromPublic(path: string): Promise<ScreenSpec> {
  // Specは public 配下から文字列として取得し、拡張子でJSON/YAMLを切り替える。
  const response = await fetch(path);
  const raw = await response.text();
  const parsed = path.endsWith('.yaml') || path.endsWith('.yml') ? YAML.parse(raw) : JSON.parse(raw);
  // 実行時バリデーションで「壊れたSpec」を早めに検知する。
  return validateScreenSpec(parsed);
}

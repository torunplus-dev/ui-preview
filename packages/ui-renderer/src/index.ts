import type { ScreenSpec } from '@ui-preview/ui-spec';
import { validateScreenSpec } from '@ui-preview/ui-spec';
import YAML from 'yaml';

export async function loadSpecFromPublic(path: string): Promise<ScreenSpec> {
  const response = await fetch(path);
  const raw = await response.text();
  const parsed = path.endsWith('.yaml') || path.endsWith('.yml') ? YAML.parse(raw) : JSON.parse(raw);
  return validateScreenSpec(parsed);
}

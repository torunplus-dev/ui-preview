import type { LogItem } from '@/types';

type Logger = (item: Omit<LogItem, 'id' | 'timestamp'>) => void;

let logger: Logger | null = null;

export function registerApiLogger(next: Logger) {
  // 外部(=Context)からログ関数を差し替え可能にする。
  logger = next;
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  // Next.jsでもこの関数はそのまま使えるが、
  // server/client で fetch のキャッシュ挙動が異なる点には注意。
  const method = init?.method || 'GET';
  logger?.({ type: 'api', message: `${method} ${url} request`, payload: init?.body });

  const controller = new AbortController();
  const timeoutMs = 6000;
  // fetch に明示的なタイムアウトはないため AbortController で実装。
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));

    // 成功/失敗を問わずレスポンスログを残してデバッグしやすくする。
    logger?.({
      type: 'api',
      message: `${method} ${url} response ${response.status}`,
      payload
    });

    if (!response.ok) {
      // API標準エラー形式があれば message を優先して表示。
      throw new Error(payload.message || `Request failed with status ${response.status}`);
    }
    return payload as T;
  } catch (error) {
    logger?.({ type: 'api', message: `${method} ${url} error`, payload: String(error) });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

import type { LogItem } from '@/types';

type Logger = (item: Omit<LogItem, 'id' | 'timestamp'>) => void;

let logger: Logger | null = null;

export function registerApiLogger(next: Logger) {
  logger = next;
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method || 'GET';
  logger?.({ type: 'api', message: `${method} ${url} request`, payload: init?.body });

  const controller = new AbortController();
  const timeoutMs = 6000;
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

    logger?.({
      type: 'api',
      message: `${method} ${url} response ${response.status}`,
      payload
    });

    if (!response.ok) {
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

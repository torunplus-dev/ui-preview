import React, { createContext, useContext, useMemo, useState } from 'react';
import type { LogItem, Role, ScenarioState } from '@/types';

// アプリ全体の初期シナリオ。
const defaultScenarios: ScenarioState = {
  GET_USERS: 'success',
  POST_USER: 'success',
  DELETE_USER: 'success'
};

type AppState = {
  role: Role;
  setRole: (role: Role) => void;
  scenarios: ScenarioState;
  setScenarios: React.Dispatch<React.SetStateAction<ScenarioState>>;
  logs: LogItem[];
  pushLog: (item: Omit<LogItem, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // ここで定義した state は Provider 配下ならどこからでも読める。
  const [role, setRole] = useState<Role>('admin');
  const [scenarios, setScenarios] = useState<ScenarioState>(defaultScenarios);
  const [logs, setLogs] = useState<LogItem[]>([]);

  const pushLog: AppState['pushLog'] = (item) => {
    // 新しいログを先頭に積む(降順表示)。
    setLogs((prev) => [
      {
        ...item,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);
  };

  // value オブジェクトは useMemo で参照を安定化。
  // Context は value の参照が変わると再レンダーが発生するため。
  const value = useMemo(
    () => ({
      role,
      setRole,
      scenarios,
      setScenarios,
      logs,
      pushLog,
      clearLogs: () => setLogs([])
    }),
    [role, scenarios, logs]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    // Provider外で使われたときに即座に気づけるよう例外を投げる。
    throw new Error('useAppState must be used within AppProvider');
  }
  return ctx;
}

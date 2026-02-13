import React, { createContext, useContext, useMemo, useState } from 'react';
import type { LogItem, Role, ScenarioState } from '@/types';

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
  const [role, setRole] = useState<Role>('admin');
  const [scenarios, setScenarios] = useState<ScenarioState>(defaultScenarios);
  const [logs, setLogs] = useState<LogItem[]>([]);

  const pushLog: AppState['pushLog'] = (item) => {
    setLogs((prev) => [
      {
        ...item,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);
  };

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
    throw new Error('useAppState must be used within AppProvider');
  }
  return ctx;
}

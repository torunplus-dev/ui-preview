import type { Role, ScreenSpec } from '@ui-preview/ui-spec';

export type { Role, ScreenSpec };

export type TreeNodeItem = {
  id: string;
  title: string;
  isLeaf?: boolean;
  screenSpecPath?: string;
};

export type MockMode = 'success' | 'badRequest' | 'forbidden' | 'serverError' | 'delay' | 'timeout';

export type ScenarioState = {
  GET_USERS: MockMode;
  POST_USER: MockMode;
  DELETE_USER: MockMode;
};

export type LogItem = {
  id: string;
  type: 'ui' | 'api';
  message: string;
  timestamp: string;
  payload?: unknown;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type UserScreenData = {
  users: User[];
};

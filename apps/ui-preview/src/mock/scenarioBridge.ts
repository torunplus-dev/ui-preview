import type { Role, ScenarioState } from '@/types';

let currentScenarios: ScenarioState = {
  GET_USERS: 'success',
  POST_USER: 'success',
  DELETE_USER: 'success'
};
let currentRole: Role = 'admin';

export function setScenarioState(next: ScenarioState) {
  currentScenarios = next;
}

export function getScenarioState() {
  return currentScenarios;
}

export function setMockRole(next: Role) {
  currentRole = next;
}

export function getMockRole() {
  return currentRole;
}

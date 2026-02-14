import { delay, http, HttpResponse } from 'msw';
import { getMockRole, getScenarioState } from './scenarioBridge';
import type { User } from '@/types';

type AuditItem = { id: string; actor: string; event: string; at: string };

let users: User[] = [
  { id: 'u-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
  { id: 'u-2', name: 'Bob Smith', email: 'bob@example.com', role: 'user' }
];

let audits: AuditItem[] = [
  { id: 'a-1', actor: 'system', event: 'seeded users', at: new Date().toISOString() },
  { id: 'a-2', actor: 'admin', event: 'opened preview', at: new Date().toISOString() }
];

function createScenarioResponse(mode: string, success: () => HttpResponse | Promise<HttpResponse>) {
  if (mode === 'timeout') {
    return new Promise<never>(() => {});
  }
  if (mode === 'delay') {
    return delay(1800).then(success);
  }
  if (mode === 'badRequest') {
    return HttpResponse.json({ message: 'Bad Request (400)' }, { status: 400 });
  }
  if (mode === 'forbidden') {
    return HttpResponse.json({ message: 'Forbidden (403)' }, { status: 403 });
  }
  if (mode === 'serverError') {
    return HttpResponse.json({ message: 'Server Error (500)' }, { status: 500 });
  }
  return success();
}

export const handlers = [
  http.get('/api/tree', async ({ request }) => {
    const parentId = new URL(request.url).searchParams.get('parentId');
    if (!parentId) {
      return HttpResponse.json([{ id: 'workspace-root', title: 'Workspace', isLeaf: false }]);
    }
    if (parentId === 'workspace-root') {
      return HttpResponse.json([
        { id: 'users-screen', title: 'Users', isLeaf: true, screenSpecPath: '/spec/user-list.screen.json' },
        { id: 'audits-screen', title: 'Audit Logs', isLeaf: true, screenSpecPath: '/spec/audit-log.screen.yaml' }
      ]);
    }
    return HttpResponse.json([]);
  }),

  http.get('/api/users', () => {
    const { GET_USERS } = getScenarioState();
    return createScenarioResponse(GET_USERS, () => HttpResponse.json({ items: users }));
  }),

  http.post('/api/users', async ({ request }) => {
    const { POST_USER } = getScenarioState();
    const role = getMockRole();
    return createScenarioResponse(POST_USER, async () => {
      if (role === 'guest') {
        return HttpResponse.json({ message: 'Guests cannot create users' }, { status: 403 });
      }
      const body = (await request.json()) as Partial<User>;
      const user: User = {
        id: `u-${Date.now()}`,
        name: body.name || 'Unnamed',
        email: body.email || 'unknown@example.com',
        role: (body.role as User['role']) || 'user'
      };
      users = [user, ...users];
      audits = [
        { id: `a-${Date.now()}`, actor: role, event: `created user ${user.name}`, at: new Date().toISOString() },
        ...audits
      ];
      return HttpResponse.json(user, { status: 201 });
    });
  }),

  http.delete('/api/users/:id', ({ params }) => {
    const { DELETE_USER } = getScenarioState();
    const role = getMockRole();
    return createScenarioResponse(DELETE_USER, () => {
      if (role !== 'admin') {
        return HttpResponse.json({ message: 'Only admins can delete' }, { status: 403 });
      }
      users = users.filter((u) => u.id !== params.id);
      audits = [
        { id: `a-${Date.now()}`, actor: role, event: `deleted user ${String(params.id)}`, at: new Date().toISOString() },
        ...audits
      ];
      return HttpResponse.json({ ok: true });
    });
  }),

  http.get('/api/audits', () => HttpResponse.json({ items: audits })),
  http.post('/api/audits', async ({ request }) => {
    const role = getMockRole();
    if (role !== 'admin') {
      return HttpResponse.json({ message: 'Only admins can create audits' }, { status: 403 });
    }
    const body = (await request.json()) as Partial<AuditItem>;
    const item: AuditItem = {
      id: `a-${Date.now()}`,
      actor: body.actor || 'unknown',
      event: body.event || 'custom event',
      at: new Date().toISOString()
    };
    audits = [item, ...audits];
    return HttpResponse.json(item, { status: 201 });
  }),
  http.delete('/api/audits/:id', ({ params }) => {
    const role = getMockRole();
    if (role !== 'admin') {
      return HttpResponse.json({ message: 'Only admins can delete audits' }, { status: 403 });
    }
    audits = audits.filter((a) => a.id !== params.id);
    return HttpResponse.json({ ok: true });
  })
];

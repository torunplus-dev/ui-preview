import { delay, http, HttpResponse } from 'msw';
import { getMockRole, getScenarioState } from './scenarioBridge';
import type { User } from '@/types';

// モックDBの代わりとなるインメモリ配列。
let users: User[] = [
  { id: 'u-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
  { id: 'u-2', name: 'Bob Smith', email: 'bob@example.com', role: 'user' }
];

function createScenarioResponse(
  mode: string,
  success: () => Response | Promise<Response>
) {
  // UIから選んだシナリオに応じて応答を差し替える。
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
  // ナビツリー用エンドポイント。
  http.get('/api/tree', async ({ request }) => {
    const parentId = new URL(request.url).searchParams.get('parentId');
    if (!parentId) {
      return HttpResponse.json([
        { id: 'users-root', title: 'User Management', isLeaf: false }
      ]);
    }
    if (parentId === 'users-root') {
      return HttpResponse.json([
        { id: 'users-screen', title: 'Users', isLeaf: true, screenSpecPath: '/spec/user-list.screen.json' }
      ]);
    }
    return HttpResponse.json([]);
  }),

  http.get('/api/users', () => {
    const { GET_USERS } = getScenarioState();
    return createScenarioResponse(GET_USERS, () => HttpResponse.json({ users }));
  }),

  http.post('/api/users', async ({ request }) => {
    const { POST_USER } = getScenarioState();
    const role = getMockRole();
    return createScenarioResponse(POST_USER, async () => {
      // 疑似認可: guest は作成不可。
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
      return HttpResponse.json({ ok: true });
    });
  })
];

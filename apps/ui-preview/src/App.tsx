import { Layout, Menu, Table, Tabs, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { loadSpecFromPublic } from '@ui-preview/ui-renderer';
import { NavTree } from '@/components/NavTree';
import { AppProvider, useAppState } from '@/contexts/AppContext';
import { AuthPanel } from '@/panels/AuthPanel';
import { LogPanel } from '@/panels/LogPanel';
import { ScenarioPanel } from '@/panels/ScenarioPanel';
import { setMockRole, setScenarioState } from '@/mock/scenarioBridge';
import { registerApiLogger } from '@/services/apiClient';
import { UserListScreen } from '@/screens/UserListScreen';
import type { ScreenSpec, TreeNodeItem } from '@/types';

const { Header, Sider, Content } = Layout;

const topMenuItems = [
  { key: 'preview', label: 'Preview' },
  { key: 'spec', label: 'Spec' },
  { key: 'mock', label: 'Mock' }
];

type OpenTab = { key: string; title: string; spec: ScreenSpec };

type EditLogRow = { key: string; time: string; level: 'INFO' | 'WARN' | 'ERROR'; message: string };
type EditRecordRow = { key: string; type: string; owner: string; updatedAt: string; status: '公開' | '下書き' | '保留' };
type EditSettingRow = { key: string; category: string; item: string; value: string; note?: string };


type LeftPaneMode = 'explorer' | 'search' | 'settings';

const leftModeItems: { key: LeftPaneMode; label: string; icon: string }[] = [
  { key: 'explorer', label: 'Explorer', icon: '📁' },
  { key: 'search', label: 'Search', icon: '🔎' },
  { key: 'settings', label: 'Settings', icon: '⚙️' }
];

const editLogRows: EditLogRow[] = [
  { key: 'l1', time: '10:14:02', level: 'INFO', message: 'ユーザー一覧を取得しました。' },
  { key: 'l2', time: '10:14:18', level: 'WARN', message: '設定ファイルに未使用フィールドがあります。' },
  { key: 'l3', time: '10:15:07', level: 'ERROR', message: '更新リクエストがタイムアウトしました。' }
];

const editRecordRows: EditRecordRow[] = [
  { key: 'r1', type: 'ログ', owner: 'Tanaka', updatedAt: '2026-02-19 10:02', status: '公開' },
  { key: 'r2', type: 'レコード', owner: 'Sato', updatedAt: '2026-02-19 09:54', status: '保留' },
  { key: 'r3', type: '設定', owner: 'Suzuki', updatedAt: '2026-02-19 09:40', status: '下書き' }
];

const editSettingRows: EditSettingRow[] = [
  { key: 's1', category: 'API', item: 'baseURL', value: 'https://api.example.local', note: '開発環境' },
  { key: 's2', category: '認証', item: 'token refresh', value: 'enabled' },
  { key: 's3', category: '表示', item: 'page size', value: '50' }
];

// 実際の画面本体。AppProvider で囲まれた内側で Context を使う。
// Next.js App Router へ移すなら、このファイル相当は基本 `use client` が必要
// (useState/useEffect/イベントハンドラを使っているため)。
function AppInner() {
  const MIN_SIDER_WIDTH = 220;
  const MAX_SIDER_WIDTH = 560;

  // tabs: 開いている画面の一覧
  // activeKey: 今表示しているタブID
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeKey, setActiveKey] = useState<string>();
  const [leftSiderWidth, setLeftSiderWidth] = useState(260);
  const [rightSiderWidth, setRightSiderWidth] = useState(360);
  const [resizingSide, setResizingSide] = useState<'left' | 'right' | null>(null);
  const [leftPaneMode, setLeftPaneMode] = useState<LeftPaneMode>('explorer');
  const { scenarios, role, pushLog } = useAppState();

  useEffect(() => {
    if (!resizingSide) return;

    const handlePointerMove = (event: PointerEvent) => {
      const maxWidth = Math.min(MAX_SIDER_WIDTH, window.innerWidth - MIN_SIDER_WIDTH);
      if (resizingSide === 'left') {
        const next = Math.min(Math.max(event.clientX, MIN_SIDER_WIDTH), maxWidth);
        setLeftSiderWidth(next);
      } else {
        const next = Math.min(Math.max(window.innerWidth - event.clientX, MIN_SIDER_WIDTH), maxWidth);
        setRightSiderWidth(next);
      }
    };

    const stopResize = () => {
      setResizingSide(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingSide]);

  // UI上で変えたシナリオ設定を MSW 側の参照状態へ反映。
  useEffect(() => {
    setScenarioState(scenarios);
  }, [scenarios]);

  // UI上で選んだロールを MSW 側へ反映。
  useEffect(() => {
    setMockRole(role);
  }, [role]);

  // APIクライアントにログ出力先を登録。
  // ContextのpushLogに集約して、LogPanelで一覧表示できるようにする。
  useEffect(() => {
    registerApiLogger(pushLog);
  }, [pushLog]);

  // ナビから画面ノードを選択したときにタブを開く。
  const openScreen = async (node: TreeNodeItem) => {
    if (!node.screenSpecPath) return;
    const exists = tabs.find((t) => t.key === node.id);
    if (exists) {
      setActiveKey(exists.key);
      return;
    }
    // spec(JSON/YAML)を読み込み、UI定義をデータとして扱う。
    // Next.js なら `fetch('/spec/...')` でも読めるが、Server Component で先読みして
    // props で渡す設計にすると初期表示を最適化しやすい。
    const spec = await loadSpecFromPublic(node.screenSpecPath);
    pushLog({ type: 'ui', message: `open screen ${spec.id}` });
    const next = [...tabs, { key: node.id, title: node.title, spec }];
    setTabs(next);
    setActiveKey(node.id);
  };

  // Tabs に渡す items をメモ化して、不要な再生成を減らす。
  const items = useMemo(
    () =>
      tabs.map((tab) => ({
        key: tab.key,
        label: tab.title,
        children: <UserListScreen spec={tab.spec} />
      })),
    [tabs]
  );

  const centerPaneItems = useMemo(
    () => [
      {
        key: 'logs',
        label: 'ログ',
        children: (
          <Table<EditLogRow>
            size="small"
            pagination={false}
            dataSource={editLogRows}
            columns={[
              { title: '時刻', dataIndex: 'time', key: 'time', width: 120 },
              {
                title: 'レベル',
                dataIndex: 'level',
                key: 'level',
                width: 110,
                render: (level: EditLogRow['level']) => {
                  const color = level === 'ERROR' ? 'red' : level === 'WARN' ? 'gold' : 'blue';
                  return <Tag color={color}>{level}</Tag>;
                }
              },
              { title: 'メッセージ', dataIndex: 'message', key: 'message' }
            ]}
          />
        )
      },
      {
        key: 'records',
        label: 'レコード',
        children: (
          <Table<EditRecordRow>
            size="small"
            pagination={false}
            dataSource={editRecordRows}
            columns={[
              { title: '種別', dataIndex: 'type', key: 'type', width: 120 },
              { title: '担当', dataIndex: 'owner', key: 'owner', width: 140 },
              { title: '更新日時', dataIndex: 'updatedAt', key: 'updatedAt', width: 190 },
              {
                title: '状態',
                dataIndex: 'status',
                key: 'status',
                width: 120,
                render: (status: EditRecordRow['status']) => (
                  <Tag color={status === '公開' ? 'green' : status === '保留' ? 'orange' : 'default'}>{status}</Tag>
                )
              }
            ]}
          />
        )
      },
      {
        key: 'settings',
        label: '設定一覧',
        children: (
          <Table<EditSettingRow>
            size="small"
            pagination={false}
            dataSource={editSettingRows}
            columns={[
              { title: 'カテゴリ', dataIndex: 'category', key: 'category', width: 120 },
              { title: '項目', dataIndex: 'item', key: 'item', width: 180 },
              { title: '値', dataIndex: 'value', key: 'value', width: 220 },
              { title: '備考', dataIndex: 'note', key: 'note' }
            ]}
          />
        )
      }
    ],
    []
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: '#fff' }}>
        <Typography.Text style={{ color: '#fff', fontSize: 18 }}>UI Preview (Spec + MSW)</Typography.Text>
      </Header>
      <Menu mode="horizontal" defaultSelectedKeys={["preview"]} items={topMenuItems} style={{ paddingInline: 12 }} />
      <Layout>
        <Sider width={leftSiderWidth} theme="light" style={{ borderRight: '1px solid #eee' }}>
          <div style={{ display: 'flex', height: '100%' }}>
            <div
              style={{
                width: 52,
                borderRight: '1px solid #eee',
                display: 'grid',
                alignContent: 'start',
                gap: 4,
                padding: '8px 6px'
              }}
            >
              {leftModeItems.map((item) => {
                const selected = leftPaneMode === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setLeftPaneMode(item.key)}
                    title={item.label}
                    style={{
                      height: 36,
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: selected ? '#e6f4ff' : 'transparent',
                      color: selected ? '#1677ff' : '#444',
                      fontSize: 18
                    }}
                  >
                    {item.icon}
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, padding: 12, overflow: 'auto' }}>
              {leftPaneMode === 'explorer' ? (
                <>
                  <Typography.Title level={5}>Navigation</Typography.Title>
                  <NavTree onOpenScreen={openScreen} />
                </>
              ) : (
                <>
                  <Typography.Title level={5}>{leftModeItems.find((item) => item.key === leftPaneMode)?.label}</Typography.Title>
                  <Typography.Text type="secondary">この機能は準備中です。</Typography.Text>
                </>
              )}
            </div>
          </div>
        </Sider>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation pane"
          onPointerDown={() => setResizingSide('left')}
          style={{ width: 8, cursor: 'col-resize', background: '#f5f5f5', borderRight: '1px solid #eee' }}
        />
        <Content style={{ padding: 16, display: 'grid', gap: 16 }}>
          <Tabs
            type="editable-card"
            hideAdd
            activeKey={activeKey}
            items={items}
            onChange={setActiveKey}
            onEdit={(targetKey, action) => {
              // editable-card の「x」でタブ削除。
              if (action === 'remove') {
                const next = tabs.filter((t) => t.key !== targetKey);
                setTabs(next);
                if (activeKey === targetKey) {
                  setActiveKey(next[0]?.key);
                }
              }
            }}
          />
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fff' }}>
            <div style={{ padding: '12px 12px 0 12px' }}>
              <Typography.Title level={5}>編集ペイン</Typography.Title>
            </div>
            <Tabs defaultActiveKey="logs" items={centerPaneItems} style={{ paddingInline: 12 }} />
          </div>
        </Content>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize settings pane"
          onPointerDown={() => setResizingSide('right')}
          style={{ width: 8, cursor: 'col-resize', background: '#f5f5f5', borderLeft: '1px solid #eee' }}
        />
        <Sider
          width={rightSiderWidth}
          theme="light"
          style={{ borderLeft: '1px solid #eee', padding: 12, overflow: 'auto' }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <AuthPanel />
            <ScenarioPanel />
            <LogPanel />
          </div>
        </Sider>
      </Layout>
    </Layout>
  );
}

// Context Provider を最上位で注入。
// Next.js なら `app/layout.tsx` で Provider を包む設計が近い。
export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

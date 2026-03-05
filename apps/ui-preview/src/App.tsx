import { Card, Layout, Menu, Table, Tabs, Tag, Typography } from 'antd';
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

const EDIT_PANE_TABLE_PAGE_SIZE = 6;
const EDIT_PANE_TABLE_SCROLL_HEIGHT = 240;

type OpenTab = { key: string; title: string; spec: ScreenSpec };

type LeftPaneMode = 'explorer' | 'search' | 'settings';
type InstanceTarget = 'instance-a' | 'instance-b' | 'instance-c';

const leftModeItems: { key: LeftPaneMode; label: string; icon: string }[] = [
  { key: 'explorer', label: 'Explorer', icon: '📁' },
  { key: 'search', label: 'Search', icon: '🔎' },
  { key: 'settings', label: 'Settings', icon: '⚙️' }
];

const instanceItems: { key: InstanceTarget; label: string; icon: string; endpoint: string }[] = [
  { key: 'instance-a', label: 'Instance A', icon: '🅰️', endpoint: 'preview-a.local' },
  { key: 'instance-b', label: 'Instance B', icon: '🅱️', endpoint: 'preview-b.local' },
  { key: 'instance-c', label: 'Instance C', icon: '🆂', endpoint: 'preview-c.local' }
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
  const [activeInstance, setActiveInstance] = useState<InstanceTarget>('instance-a');
  const { scenarios, role, logs, pushLog } = useAppState();

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

  const centerPaneRows = useMemo(
    () => [
      ...logs.slice(0, 6).map((log: { id: string; message: string; type: 'ui' | 'api'; timestamp: string }) => ({
        key: `log-${log.id}`,
        category: 'ログ',
        name: log.message,
        detail: `${log.type.toUpperCase()} / ${log.timestamp}`
      })),
      ...tabs.map((tab) => ({
        key: `record-${tab.key}`,
        category: 'レコード',
        name: tab.title,
        detail: tab.spec.id
      })),
      ...Object.entries(scenarios).map(([name, mode]) => ({
        key: `setting-${name}`,
        category: '設定',
        name,
        detail: mode
      }))
    ],
    [logs, scenarios, tabs]
  );

  const centerPaneColumns = [
    {
      title: '分類',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (value: string) => {
        const color = value === 'ログ' ? 'blue' : value === 'レコード' ? 'purple' : 'green';
        return <Tag color={color}>{value}</Tag>;
      }
    },
    {
      title: '項目',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '詳細',
      dataIndex: 'detail',
      key: 'detail'
    }
  ];

  const supplementalColumns = [
    {
      title: 'コントロール名',
      dataIndex: 'controlName',
      key: 'controlName'
    },
    {
      title: 'タイプ',
      dataIndex: 'type',
      key: 'type',
      width: 140
    },
    {
      title: '状態',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value: string) => <Tag color={value === '有効' ? 'green' : 'default'}>{value}</Tag>
    }
  ];

  const supplementalRows = [
    { key: 'ctrl-filter', controlName: 'フィルターパネル', type: 'フォーム', status: '有効' },
    { key: 'ctrl-export', controlName: 'CSVエクスポート', type: 'アクション', status: '有効' },
    { key: 'ctrl-bulk', controlName: '一括更新', type: 'バッチ', status: '準備中' }
  ];

  const handleSelectInstance = (instance: InstanceTarget) => {
    setActiveInstance(instance);
    const selected = instanceItems.find((item) => item.key === instance);
    if (selected) {
      pushLog({ type: 'ui', message: `switch instance ${selected.label} (${selected.endpoint})` });
    }
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header style={{ color: '#fff' }}>
        <Typography.Text style={{ color: '#fff', fontSize: 18 }}>UI Preview (Spec + MSW)</Typography.Text>
      </Header>
      <Menu mode="horizontal" defaultSelectedKeys={["preview"]} items={topMenuItems} style={{ paddingInline: 12 }} />
      <Layout style={{ minHeight: 0, overflow: 'hidden' }}>
        <Sider width={58} theme="light" style={{ borderRight: '1px solid #eee', padding: '8px 6px' }}>
          <div style={{ display: 'grid', alignContent: 'start', gap: 4 }}>
            {instanceItems.map((item) => {
              const selected = activeInstance === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelectInstance(item.key)}
                  title={`${item.label} (${item.endpoint})`}
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
        </Sider>
        <Layout style={{ minHeight: 0, overflow: 'hidden' }}>
          <Sider
            width={leftSiderWidth}
            theme="light"
            style={{ borderRight: '1px solid #eee', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
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
              <div style={{ flex: 1, padding: 12, overflow: 'auto', minHeight: 0 }}>
                {leftPaneMode === 'explorer' ? (
                  <>
                    <Typography.Title level={5}>Navigation</Typography.Title>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                      Target: {instanceItems.find((item) => item.key === activeInstance)?.endpoint}
                    </Typography.Text>
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
            style={{ width: 1, background: '#eee', position: 'relative' }}
          >
            <div
              onPointerDown={() => setResizingSide('left')}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: -3.5,
                width: 8,
                cursor: 'col-resize'
              }}
            />
          </div>
          <Content style={{ padding: 16, overflow: 'auto', minHeight: 0 }}>
            <Card
              size="small"
              title="編集ペイン一覧テーブル"
              style={{ marginBottom: 16 }}
              extra={<Typography.Text type="secondary">ログ / レコード / 設定</Typography.Text>}
            >
              <Table
                size="small"
                columns={centerPaneColumns}
                dataSource={centerPaneRows}
                pagination={{
                  pageSize: EDIT_PANE_TABLE_PAGE_SIZE,
                  hideOnSinglePage: false,
                  showSizeChanger: false,
                  disabled: centerPaneRows.length <= EDIT_PANE_TABLE_PAGE_SIZE
                }}
                scroll={{ y: EDIT_PANE_TABLE_SCROLL_HEIGHT }}
                locale={{ emptyText: '表示可能なデータがありません' }}
              />
            </Card>
            <Card
              size="small"
              title="補助テーブルコントロール"
              style={{ marginBottom: 16 }}
              extra={<Typography.Text type="secondary">編集ペイン一覧テーブルの下に表示</Typography.Text>}
            >
              <Table
                size="small"
                columns={supplementalColumns}
                dataSource={supplementalRows}
                pagination={false}
              />
            </Card>
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
          </Content>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize settings pane"
            style={{ width: 1, background: '#eee', position: 'relative' }}
          >
            <div
              onPointerDown={() => setResizingSide('right')}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: -3.5,
                width: 8,
                cursor: 'col-resize'
              }}
            />
          </div>
          <Sider
            width={rightSiderWidth}
            theme="light"
            style={{ borderLeft: '1px solid #eee', padding: 12, overflow: 'auto', minHeight: 0 }}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <AuthPanel />
              <ScenarioPanel />
              <LogPanel />
            </div>
          </Sider>
        </Layout>
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

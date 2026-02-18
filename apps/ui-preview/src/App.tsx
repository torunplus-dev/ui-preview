import { Layout, Tabs, Typography } from 'antd';
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

type OpenTab = { key: string; title: string; spec: ScreenSpec };

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: '#fff' }}>
        <Typography.Text style={{ color: '#fff', fontSize: 18 }}>UI Preview (Spec + MSW)</Typography.Text>
      </Header>
      <Layout>
        <Sider width={leftSiderWidth} theme="light" style={{ borderRight: '1px solid #eee', padding: 12 }}>
          <Typography.Title level={5}>Navigation</Typography.Title>
          <NavTree onOpenScreen={openScreen} />
        </Sider>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation pane"
          onPointerDown={() => setResizingSide('left')}
          style={{ width: 8, cursor: 'col-resize', background: '#f5f5f5', borderRight: '1px solid #eee' }}
        />
        <Content style={{ padding: 16 }}>
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

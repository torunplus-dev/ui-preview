import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/services/apiClient';
import type { TreeNodeItem } from '@/types';

type Props = {
  onOpenScreen: (node: TreeNodeItem) => void;
};

type NavTreeNode = DataNode & {
  screenSpecPath?: string;
  children?: NavTreeNode[];
};

// バックエンド(今回はMSW)の TreeNodeItem を antd Tree 用へ変換。
function toDataNodes(nodes: TreeNodeItem[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.title,
    isLeaf: node.isLeaf,
    screenSpecPath: node.screenSpecPath
  }));
}

export function NavTree({ onOpenScreen }: Props) {
  const [treeData, setTreeData] = useState<NavTreeNode[]>([]);

  useEffect(() => {
    // 初期表示時にルートノードだけ取得。
    apiFetch<TreeNodeItem[]>('/api/tree').then((nodes) => setTreeData(toDataNodes(nodes)));
  }, []);

  const onLoadData = async (node: NavTreeNode): Promise<void> => {
    // ノード展開時に子ノードを遅延ロード(lazy load)。
    const children = await apiFetch<TreeNodeItem[]>(`/api/tree?parentId=${node.key}`);
    node.children = toDataNodes(children);
    // 参照を変えて setState し、Tree に再描画を促す。
    setTreeData([...treeData]);
  };

  return (
    <Tree
      treeData={treeData}
      loadData={onLoadData}
      onSelect={(_, info) => {
        const n = info.node as NavTreeNode;
        // 葉ノード(screenSpecPathあり)だけ「画面を開く」操作に繋げる。
        if (n.isLeaf && n.screenSpecPath) {
          onOpenScreen({
            id: String(n.key),
            title: String(n.title),
            isLeaf: true,
            screenSpecPath: n.screenSpecPath
          });
        }
      }}
    />
  );
}

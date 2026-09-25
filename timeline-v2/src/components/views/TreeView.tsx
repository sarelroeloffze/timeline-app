'use client';

import { useState, useMemo } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';

interface TreeViewProps {
  onPersonClick?: (personId: string) => void;
}

interface TreeNode {
  person: any;
  children: TreeNode[];
  level: number;
  x: number;
  y: number;
}

export function TreeView({ onPersonClick }: TreeViewProps) {
  const { people, events } = useTimelineStore();
  const [zoom, setZoom] = useState(100);
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');

  // Build tree structure from people
  const tree = useMemo(() => {
    if (people.length === 0) return null;

    // Find root nodes (people without parents or with the earliest birth dates)
    const roots = people
      .filter((p) => {
        // For now, just use the first few people as roots
        // In a real implementation, this would check for parent relationships
        return true;
      })
      .sort((a, b) => {
        const aDate = a.birth
          ? typeof a.birth === 'number'
            ? a.birth
            : new Date(a.birth).getFullYear()
          : 9999;
        const bDate = b.birth
          ? typeof b.birth === 'number'
            ? b.birth
            : new Date(b.birth).getFullYear()
          : 9999;
        return aDate - bDate;
      })
      .slice(0, 5); // Limit to first 5 as roots for simplicity

    // Build tree nodes
    const buildNode = (person: any, level: number): TreeNode => {
      return {
        person,
        children: [], // Simplified - no actual parent-child relationships yet
        level,
        x: 0,
        y: 0,
      };
    };

    return roots.map((p) => buildNode(p, 0));
  }, [people]);

  // Layout tree nodes
  const layoutTree = (nodes: TreeNode[] | null): TreeNode[] => {
    if (!nodes) return [];

    const nodeWidth = 120;
    const nodeHeight = 80;
    const horizontalSpacing = 40;
    const verticalSpacing = 60;

    const positioned: TreeNode[] = [];

    nodes.forEach((node, idx) => {
      if (layout === 'vertical') {
        node.x = idx * (nodeWidth + horizontalSpacing);
        node.y = node.level * (nodeHeight + verticalSpacing);
      } else {
        node.x = node.level * (nodeWidth + horizontalSpacing);
        node.y = idx * (nodeHeight + verticalSpacing);
      }
      positioned.push(node);
    });

    return positioned;
  };

  const layoutedNodes = layoutTree(tree);

  if (people.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🌳</div>
          <h3 className="text-xl font-semibold text-white mb-2">No People Yet</h3>
          <p className="text-gray-400">Add some people to see them in tree view</p>
        </div>
      </div>
    );
  }

  return (
    <div id="tl-view-tree" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Tree View</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayout(layout === 'vertical' ? 'horizontal' : 'vertical')}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            {layout === 'vertical' ? '⇕ Vertical' : '⇔ Horizontal'}
          </button>
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            −
          </button>
          <span className="text-sm text-gray-400 w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setZoom(100)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-8">
        <div
          style={{
            zoom: `${zoom}%`,
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          <svg width="1200" height="800" className="mx-auto">
            {/* Render nodes */}
            {layoutedNodes.map((node, idx) => {
              const { person, x, y } = node;
              const eventCount = events.filter((e) => e.peopleIds?.includes(person.id)).length;

              return (
                <g key={person.id} transform={`translate(${x + 100}, ${y + 100})`}>
                  {/* Node card */}
                  <rect
                    x={0}
                    y={0}
                    width={120}
                    height={80}
                    rx={8}
                    fill="#1f2937"
                    stroke={person.color}
                    strokeWidth={2}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onPersonClick?.(person.id)}
                  />

                  {/* Avatar circle */}
                  <circle cx={60} cy={25} r={15} fill={person.color} />
                  <text
                    x={60}
                    y={30}
                    textAnchor="middle"
                    fill="white"
                    fontSize={12}
                    fontWeight="bold"
                  >
                    {person.name.charAt(0).toUpperCase()}
                  </text>

                  {/* Name */}
                  <text x={60} y={50} textAnchor="middle" fill="#d1d5db" fontSize={11}>
                    {person.name.length > 14
                      ? person.name.substring(0, 14) + '...'
                      : person.name}
                  </text>

                  {/* Birth date */}
                  {person.birth && (
                    <text x={60} y={65} textAnchor="middle" fill="#9ca3af" fontSize={9}>
                      {fmtDate(person.birth, 'bcad', person.birthCertainty)}
                    </text>
                  )}

                  {/* Event count badge */}
                  {eventCount > 0 && (
                    <>
                      <circle cx={105} cy={15} r={10} fill="#6366f1" />
                      <text x={105} y={19} textAnchor="middle" fill="white" fontSize={9}>
                        {eventCount}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

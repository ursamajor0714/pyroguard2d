// components/canvas/SensorNode.tsx
import React, { useState } from 'react';
import clsx from 'clsx';
import { SensorNode as SensorNodeType, SensorStatus, DoorState } from '../../types/sensor';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSensorStore } from '../../store/useSensorStore';
import { SensorIcon } from '../common/Icons';
import { FovOverlay } from './FovOverlay';
import styles from '../../styles/canvas.module.css';

interface SensorNodeProps {
  node: SensorNodeType;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const SensorNode: React.FC<SensorNodeProps> = ({ node, svgRef }) => {
  const { isLocked, setActiveCctvId } = useCanvasStore();
  const { updateNode, triggerAlarm, resolveAlarm } = useSensorStore();
  
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);

  // 1200x800 기준 실제 픽셀 절대 좌표 환산
  const nodeX = (node.x / 100) * 1200;
  const nodeY = (node.y / 100) * 800;

  // SVG Pointer Events 기반 실시간 노드 위치 드래그 (요청사항 2 반영 - 100% CRUD 드래그 보장)
  const handlePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    if (isLocked) return;
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch (err) {}
    setIsDraggingNode(true);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!isDraggingNode || isLocked || !svgRef.current) return;
    e.stopPropagation();
    
    const svgEl = svgRef.current;
    const containerG = (svgEl.querySelector('[data-canvas-container="true"]') || svgEl.querySelector('g')) as SVGGraphicsElement | null;
    
    if (containerG && svgEl.createSVGPoint) {
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = containerG.getScreenCTM()?.inverse();
      if (ctm) {
        const cursorPt = pt.matrixTransform(ctm);
        const xPercent = Math.max(0, Math.min(100, (cursorPt.x / 1200) * 100));
        const yPercent = Math.max(0, Math.min(100, (cursorPt.y / 800) * 100));
        updateNode(node.id, { x: xPercent, y: yPercent });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGGElement>) => {
    if (isDraggingNode) {
      setIsDraggingNode(false);
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // 더블 클릭 핸들러 (요청사항 1 반영 - CCTV는 더블 클릭 시 라이브 모달만 열고 경보를 절대 발생시키지 않음)
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'CCTV') {
      setActiveCctvId(node.id);
    } else {
      if (node.status === 'ALARM') {
        resolveAlarm(node.id, 'NORMAL');
      } else {
        triggerAlarm(node.id);
      }
    }
  };

  // 상태별 색상 매핑
  const getStatusColor = (status: SensorStatus) => {
    switch (status) {
      case 'NORMAL': return '#10b981';
      case 'MAINTENANCE': return '#f59e0b';
      case 'ALARM': return '#ef4444';
      case 'OFFLINE': return '#64748b';
    }
  };

  // 비상문 도어 상태 배지
  const getDoorStateBadge = (state?: DoorState) => {
    switch (state) {
      case 'LOCKED': return { label: '평시잠금' };
      case 'UNLOCKED': return { label: '화재해제' };
      case 'OPENED': return { label: '대피문열림' };
      case 'CLOSED': return { label: '도어닫힘' };
      default: return null;
    }
  };

  const doorBadge = getDoorStateBadge(node.doorState);

  return (
    <g
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transform={`translate(${nodeX}, ${nodeY})`}
      className={clsx(
        styles.sensorNodeWrapper,
        "select-none",
        {
          [styles.sensorNodeNormal]: node.status === 'NORMAL',
          [styles.sensorNodeMaintenance]: node.status === 'MAINTENANCE',
          [styles.sensorNodeAlarm]: node.status === 'ALARM',
          [styles.sensorNodeOffline]: node.status === 'OFFLINE',
          "cursor-grab active:cursor-grabbing": !isLocked,
          "opacity-60": isDraggingNode
        }
      )}
    >
      {/* 1. CCTV 시야(FOV) 부채꼴 및 조작 핸들 */}
      {node.type === 'CCTV' && node.fov && (
        <FovOverlay
          nodeId={node.id}
          fov={node.fov}
          status={node.status}
          isLocked={isLocked}
          svgRef={svgRef}
          nodeX={nodeX}
          nodeY={nodeY}
        />
      )}

      {/* 2. 경보 발생 시 외곽 빨간 파장 점멸 링 */}
      {node.status === 'ALARM' && (
        <>
          <circle cx="0" cy="0" className={styles.alarmPulseRing} />
          <circle cx="0" cy="0" className={styles.alarmPulseRing} style={{ animationDelay: '0.67s' }} />
          <circle cx="0" cy="0" className={styles.alarmPulseRing} style={{ animationDelay: '1.33s' }} />
        </>
      )}

      {/* 3. 노드 원형 배경 */}
      <circle
        cx="0"
        cy="0"
        r="18"
        fill="#0f172a"
        stroke={getStatusColor(node.status)}
        strokeWidth="2.5"
        className="transition-all duration-300"
      />

      {/* 4. 센서 이모지/아이콘 */}
      <g transform="translate(-10, -10)" className="pointer-events-none">
        {node.customEmoji ? (
          <text x="10" y="15" textAnchor="middle" fontSize="14">
            {node.customEmoji}
          </text>
        ) : (
          <SensorIcon 
            type={node.type} 
            size={20} 
            className="text-slate-100 transition-colors duration-300" 
          />
        )}
      </g>

      {/* 5. 수치 정보 배지 */}
      {node.type === 'WATER_PRESSURE' && node.value !== undefined && (
        <g transform="translate(18, -12)">
          <rect x="0" y="0" width="48" height="15" rx="4" fill="#020617" stroke="#10b981" strokeWidth="1" />
          <text x="24" y="11" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
            {node.value.toFixed(1)} Bar
          </text>
        </g>
      )}

      {node.type === 'ARC' && node.value !== undefined && node.value > 0 && (
        <g transform="translate(18, -12)">
          <rect x="0" y="0" width="38" height="15" rx="4" fill="#020617" stroke="#ef4444" strokeWidth="1" />
          <text x="19" y="11" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">
            {node.value} Arc
          </text>
        </g>
      )}

      {node.type === 'EMERGENCY_DOOR' && doorBadge && (
        <g transform="translate(18, -12)">
          <rect x="0" y="0" width="46" height="15" rx="4" fill="#020617" stroke={node.doorState === 'OPENED' ? '#ef4444' : '#64748b'} strokeWidth="1" />
          <text x="23" y="11" textAnchor="middle" fill={node.doorState === 'OPENED' ? '#ef4444' : '#e2e8f0'} fontSize="8" fontWeight="bold">
            {doorBadge.label}
          </text>
        </g>
      )}

      {/* 6. 호버 툴팁 */}
      {isHovered && (
        <g transform="translate(0, -32)" className="z-50 pointer-events-none">
          <path d="M -6 0 L 0 6 L 6 0 Z" fill="#0f172a" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
          <g transform="translate(-80, -42)">
            <rect
              width="160"
              height="42"
              rx="6"
              fill="#0f172a"
              stroke="rgba(148, 163, 184, 0.25)"
              strokeWidth="1"
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
            />
            <text x="10" y="16" fill="#f8fafc" fontSize="10" fontWeight="bold">
              {node.name || (node.type === 'EXTINGUISHER' ? '소화기' 
               : node.type === 'HYDRANT' ? '소화전'
               : node.type === 'WATER_PRESSURE' ? '배관 수압계'
               : node.type === 'ARC' ? '아크 감지 차단기'
               : node.type === 'LEAK' ? '누수 감지 테이프'
               : node.type === 'EMERGENCY_DOOR' ? '비상구 방화문'
               : '보안 CCTV 카메라')}
            </text>
            <text x="10" y="30" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              ID: {node.id.substring(0, 13)}...
            </text>
            <text x="150" y="16" textAnchor="end" fill={getStatusColor(node.status)} fontSize="9" fontWeight="bold">
              {node.status === 'NORMAL' ? '● 정상'
               : node.status === 'MAINTENANCE' ? '● 점검중'
               : node.status === 'ALARM' ? '● 경보발생'
               : '● 통신두절'}
            </text>
          </g>
        </g>
      )}
    </g>
  );
};

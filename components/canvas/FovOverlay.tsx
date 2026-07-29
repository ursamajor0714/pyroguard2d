// components/canvas/FovOverlay.tsx
import React, { useState } from 'react';
import clsx from 'clsx';
import { FovConfig, SensorStatus } from '../../types/sensor';
import { useSensorStore } from '../../store/useSensorStore';
import { getFovPath, polarToCartesian, calculateDistanceAndAngle, snapValue } from '../../lib/utils/canvasMath';
import styles from '../../styles/canvas.module.css';

interface FovOverlayProps {
  nodeId: string;
  fov: FovConfig;
  status: SensorStatus;
  isLocked: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  nodeX?: number;
  nodeY?: number;
}

const METERS_TO_PX = 4.5;

export const FovOverlay: React.FC<FovOverlayProps> = ({
  nodeId,
  fov,
  status,
  isLocked,
  svgRef,
  nodeX = 0,
  nodeY = 0
}) => {
  const { updateNode } = useSensorStore();
  const [activeHandle, setActiveHandle] = useState<'distance' | 'angle' | 'rotation' | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const pxDistance = fov.distance * METERS_TO_PX;

  // 부채꼴 패스 생성
  const fovPathD = getFovPath(0, 0, pxDistance, fov.angle, fov.rotation);

  // 조작용 핸들 좌표 연산
  const handleRotPt = polarToCartesian(0, 0, pxDistance + 15, fov.rotation);
  const handleDistPt = polarToCartesian(0, 0, pxDistance, fov.rotation);
  const handleAnglePt = polarToCartesian(0, 0, pxDistance, fov.rotation - fov.angle / 2);

  // Pointer Events 기반 FOV 핸들 드래그 (요청사항 3 반영)
  const handlePointerDown = (e: React.PointerEvent, type: 'distance' | 'angle' | 'rotation') => {
    if (isLocked) return;
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch (err) {}
    setActiveHandle(type);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || isLocked || !svgRef?.current) return;
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
        const dx = cursorPt.x - nodeX;
        const dy = cursorPt.y - nodeY;

        const { distance: dragPxDistance, angle: dragAngle } = calculateDistanceAndAngle(0, 0, dx, dy);
        const dragMeters = dragPxDistance / METERS_TO_PX;

        if (activeHandle === 'distance') {
          const newDist = snapValue(Math.max(3, Math.min(30, dragMeters)), 1);
          updateNode(nodeId, { fov: { ...fov, distance: newDist } });
        } else if (activeHandle === 'rotation') {
          const step = e.shiftKey ? 1 : 45;
          const newRot = snapValue(dragAngle, step) % 360;
          updateNode(nodeId, { fov: { ...fov, rotation: newRot } });
        } else if (activeHandle === 'angle') {
          let angleDiff = dragAngle - fov.rotation;
          if (angleDiff < -180) angleDiff += 360;
          if (angleDiff > 180) angleDiff -= 360;
          const calculatedFovAngle = Math.abs(angleDiff) * 2;
          const newAngle = snapValue(Math.max(30, Math.min(180, calculatedFovAngle)), 15);
          updateNode(nodeId, { fov: { ...fov, angle: newAngle } });
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      setActiveHandle(null);
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  return (
    <g 
      id={nodeId} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <path
        d={fovPathD}
        className={clsx(
          styles.fovArea,
          { [styles.fovAreaAlarm]: status === 'ALARM' }
        )}
      />

      {/* 점검 모드가 켜진 경우 3대 조작 핸들 표출 */}
      {!isLocked && (
        <g 
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* 회전 조작 핸들 */}
          <circle
            cx={handleRotPt.x}
            cy={handleRotPt.y}
            r="6"
            className={clsx(styles.fovHandle, { [styles.fovHandleActive]: activeHandle === 'rotation' })}
            onPointerDown={(e) => handlePointerDown(e, 'rotation')}
          >
            <title>마우스 드래그로 시야 방향 회전 제어 (45도 스냅)</title>
          </circle>
          <line 
            x1={handleDistPt.x} 
            y1={handleDistPt.y} 
            x2={handleRotPt.x} 
            y2={handleRotPt.y} 
            stroke="#3b82f6" 
            strokeWidth="1.5" 
            strokeDasharray="2 1" 
          />

          {/* 감시 거리 조작 핸들 */}
          <circle
            cx={handleDistPt.x}
            cy={handleDistPt.y}
            r="5.5"
            className={clsx(styles.fovHandle, { [styles.fovHandleActive]: activeHandle === 'distance' })}
            onPointerDown={(e) => handlePointerDown(e, 'distance')}
          >
            <title>마우스 드래그로 시야 거리 제어 (3m~30m)</title>
          </circle>

          {/* 화각 조작 핸들 */}
          <circle
            cx={handleAnglePt.x}
            cy={handleAnglePt.y}
            r="5.5"
            className={clsx(styles.fovHandle, { [styles.fovHandleActive]: activeHandle === 'angle' })}
            onPointerDown={(e) => handlePointerDown(e, 'angle')}
          >
            <title>마우스 드래그로 시야 화각 제어 (30도~180도)</title>
          </circle>
        </g>
      )}

      {(isHovered || activeHandle) && (
        <g transform={`translate(${handleRotPt.x + 10}, ${handleRotPt.y})`} className="pointer-events-none z-50">
          <rect width="130" height="42" rx="4" fill="#020617" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
          <text x="8" y="14" fill="#94a3b8" fontSize="8" fontWeight="bold">CCTV 시야각 매개변수</text>
          <text x="8" y="26" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
            시야: {fov.distance}m / 화각: {fov.angle}°
          </text>
          <text x="8" y="36" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
            회전: {fov.rotation}°
          </text>
        </g>
      )}
    </g>
  );
};

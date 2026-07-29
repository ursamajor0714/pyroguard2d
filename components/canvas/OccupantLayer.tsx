// components/canvas/OccupantLayer.tsx
import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useOccupantStore } from '../../store/useOccupantStore';
import { getFloorMeta } from '../../types/floor';

interface OccupantLayerProps {
  floorId: string;
}

export const OccupantLayer: React.FC<OccupantLayerProps> = ({ floorId }) => {
  const { isOtpApproved } = useCanvasStore();
  const { rescuedOccupantIds, clearedFloorIds, rescueOccupant } = useOccupantStore();

  // 119 OTP 승인을 받지 않은 상태에서는 자물쇠(🔒) 및 인명 정보 일체 노출 안함 (100% 미표시)
  if (!isOtpApproved) {
    return null;
  }

  const floorMeta = getFloorMeta(floorId as any);

  if (!floorMeta || !floorMeta.occupants || floorMeta.occupants.length === 0) {
    return null;
  }

  // 층 단위 전체 구조 클리어 되었으면 렌더링 안함
  if (clearedFloorIds.includes(floorId)) {
    return null;
  }

  // 이미 개별 구조 완료(클릭)된 인원 제외
  const activeOccupants = floorMeta.occupants.filter(
    occ => !rescuedOccupantIds.includes(occ.id)
  );

  return (
    <g id="occupants-layer" className="select-none z-30">
      {activeOccupants.map((occ) => {
        const occX = (occ.x / 100) * 1200;
        const occY = (occ.y / 100) * 800;

        return (
          <g 
            key={occ.id} 
            transform={`translate(${occX}, ${occY})`}
            onClick={(e) => {
              e.stopPropagation();
              rescueOccupant(occ.id);
            }}
            className="cursor-pointer group"
          >
            {/* 외곽 펄스 파장 원 (마우스 이벤트 간섭 차단) */}
            <circle 
              cx="0" 
              cy="0" 
              r="15" 
              fill="#3b82f6" 
              fillOpacity="0.2" 
              stroke="#60a5fa" 
              strokeWidth="1.5" 
              className="animate-ping pointer-events-none" 
            />

            {/* 마우스/터치 호버 시 대형 고정 히트 영역 백그라운드 원 */}
            <circle 
              cx="0" 
              cy="0" 
              r="22" 
              className="fill-blue-600/20 group-hover:fill-blue-500/50 stroke-blue-400/60 group-hover:stroke-blue-300 transition-colors duration-150"
              strokeWidth="2"
            />

            {/* 인원 심볼 배경 메인 원 */}
            <circle 
              cx="0" 
              cy="0" 
              r="15" 
              fill="#1e3a8a" 
              fillOpacity="0.95" 
              stroke="#93c5fd" 
              strokeWidth="2" 
            />
            
            {/* 👤 사람 이모지 */}
            <text x="0" y="5" textAnchor="middle" fontSize="16" fill="#ffffff" className="select-none pointer-events-none">
              👤
            </text>

            {/* 구역/방 이름 & 클릭 시 구조 가이드 배지 */}
            <g transform="translate(0, -22)" className="pointer-events-none">
              <rect x="-46" y="-12" width="92" height="18" rx="4" fill="#020617" stroke="#3b82f6" strokeWidth="1.5" opacity="0.95" />
              <text x="0" y="1" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="extrabold">
                {occ.roomName} 🧹구조
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

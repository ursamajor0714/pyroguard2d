// components/canvas/FloorCanvas.tsx
import React, { useRef } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSensorStore } from '../../store/useSensorStore';
import { useD3Zoom } from '../../hooks/useD3Zoom';
import { useSensorDrag } from '../../hooks/useSensorDrag';
import { useEmergencyTimer } from '../../hooks/useEmergencyTimer';
import { getFloorMeta, FLOOR_LIST, FloorId } from '../../types/floor';
import { SensorNode } from './SensorNode';
import { OccupantLayer } from './OccupantLayer';
import { Badge } from '../common/Badge';
import { RefreshCw, ZoomIn, ZoomOut, Layers, AlertCircle, Building2, Users, Siren, Smartphone } from 'lucide-react';

interface FloorCanvasProps {
  onOpenOtpModal?: () => void;
}

export const FloorCanvas: React.FC<FloorCanvasProps> = ({ onOpenOtpModal }) => {
  const { 
    selectedFloor, 
    setFloor, 
    zoomScale, 
    setZoomScale, 
    resetZoom,
    isLocked, 
    setViewMode 
  } = useCanvasStore();

  const { isOtpApproved } = useEmergencyTimer();
  const { nodes } = useSensorStore();
  const floorMeta = getFloorMeta(selectedFloor);
  const floorNodes = nodes.filter((n) => n.floorId === selectedFloor);

  const { svgRef, containerRef } = useD3Zoom();
  const { handleDragOver, handleDrop } = useSensorDrag();

  // 터치 및 마우스 스와이프 전용 ref 및 핸들러
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const checkFloorAlarm = (floorId: FloorId): boolean => {
    return nodes.some((n) => n.floorId === floorId && n.status === 'ALARM');
  };

  const handleZoomIn = () => setZoomScale(zoomScale + 0.2);
  const handleZoomOut = () => setZoomScale(zoomScale - 0.2);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#050811] select-none">
      {/* 1. 상단 도면 타이틀 및 줌 조작 툴바 */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/90 border-b border-slate-800/80 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('BUILDING')}
            className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="건물 전체 수직 조감도로 복귀"
          >
            <Building2 size={15} />
            <span>건물 조감도</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-100 tracking-wide">
              {floorMeta?.fullName || selectedFloor}
            </h2>
            <Badge status={isLocked ? 'LOCKED' : 'UNLOCKED'}>
              {isLocked ? '관제 모드' : '편집 모드'}
            </Badge>
          </div>
        </div>

        {/* 줌 컨트롤러 */}
        <div className="flex items-center gap-3">
          {/* 119 소방관 OTP / 모바일 시연 툴바 인라인 버튼 배치 */}
          <div className="flex items-center gap-1.5 mr-2">
            {isOtpApproved ? (
              <button
                onClick={() => setViewMode('BUILDING')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 rounded-lg transition text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                title="빌딩 전체 인원 현황 조망 화면으로 이동"
              >
                <Users size={13} />
                <span>인원 조망</span>
              </button>
            ) : (
              <button
                onClick={onOpenOtpModal}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white border border-red-400 rounded-lg animate-pulse transition text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Siren size={13} />
                <span>🚨 119 OTP 승인</span>
              </button>
            )}

            <a
              href="/mobile-demo"
              target="_blank"
              className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 rounded-lg transition text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Smartphone size={13} />
              <span>📱 모바일 시연</span>
            </a>
          </div>

          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-0.5 text-slate-400">
            <button 
              onClick={handleZoomOut}
              className="p-1.5 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
              title="축소"
            >
              <ZoomOut size={15} />
            </button>
            <span className="px-2 text-xs font-mono font-semibold select-none text-slate-200">
              {Math.round(zoomScale * 100)}%
            </span>
            <button 
              onClick={handleZoomIn}
              className="p-1.5 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
              title="확대"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          <button
            onClick={resetZoom}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition active:scale-95 flex items-center gap-1 text-xs cursor-pointer"
            title="도면 배율 초기화"
          >
            <RefreshCw size={13} />
            <span>100%</span>
          </button>
        </div>
      </div>

      {/* 2. 중앙 2D CAD SVG 도면 영역 (px-12 py-4 대형 여유 패딩 적용으로 최우측 짤림 완전 방지) */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden flex items-center justify-center px-12 py-4">
        {floorMeta ? (
          <svg
            ref={svgRef}
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full block max-w-full max-h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, svgRef.current)}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.04)" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="rgba(148, 163, 184, 0.08)" />
              </pattern>
            </defs>

            <rect width="1200" height="800" fill="url(#grid)" />

            <g
              ref={containerRef}
              data-canvas-container="true"
              transform={`translate(600, 400) scale(${zoomScale}) translate(-600, -400)`}
              className="transition-transform duration-100 ease-out"
            >
              <image
                href={floorMeta.svgPath}
                width="1200"
                height="800"
                className="select-none"
              />

              <rect
                width="1200"
                height="800"
                fill="none"
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="2"
                pointerEvents="none"
              />

              {floorNodes.map((node) => (
                <SensorNode
                  key={node.id}
                  node={node}
                  svgRef={svgRef}
                />
              ))}

              <OccupantLayer floorId={selectedFloor} />
            </g>
          </svg>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
            도면 파일을 찾을 수 없습니다.
          </div>
        )}
      </div>

      {/* 3. 하단 슬림 층 도킹 바 (모바일 터치 스와이프 & 마우스 드래그 스와이프 지원) */}
      <div className="w-full shrink-0 h-13 border-t border-slate-800/90 bg-[#030611] px-4 flex items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-1.5 shrink-0 text-slate-300 font-extrabold text-xs">
          <Layers size={16} className="text-blue-400" />
          <span className="hidden sm:inline">층 빠른 이동:</span>
        </div>

        {/* 터치 스와이프 & 마우스 드래그 스와이프 컨테이너 */}
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none touch-pan-x overscroll-x-contain cursor-grab active:cursor-grabbing select-none"
        >
          {FLOOR_LIST.map((floor) => {
            const isSelected = selectedFloor === floor.id;
            const isAlarm = checkFloorAlarm(floor.id);

            return (
              <button
                key={floor.id}
                onClick={() => setFloor(floor.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all duration-150 shrink-0 flex items-center justify-center gap-1.5 border min-w-[46px] cursor-pointer shadow-md active:scale-95 ${
                  isAlarm
                    ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 animate-pulse ring-2 ring-red-500/50'
                    : isSelected
                      ? 'bg-blue-600 text-white border-blue-400 ring-1 ring-blue-400/50 shadow-blue-500/30'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <span>{floor.name}</span>
                {isAlarm && (
                  <AlertCircle size={13} className="text-red-200 animate-bounce" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

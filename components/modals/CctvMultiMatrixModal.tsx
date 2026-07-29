// components/modals/CctvMultiMatrixModal.tsx
import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSensorStore } from '../../store/useSensorStore';
import { SensorNode } from '../../types/sensor';
import { Button } from '../common/Button';
import { 
  X, 
  Video, 
  Camera, 
  Grid, 
  Plus, 
  Trash2, 
  Maximize2, 
  Flame, 
  Tv, 
  Sliders,
  Check
} from 'lucide-react';

export const CctvMultiMatrixModal: React.FC = () => {
  const { isCctvMatrixModalOpen, setCctvMatrixModalOpen, setActiveCctvId } = useCanvasStore();
  const { nodes, addNode, deleteNode } = useSensorStore();

  const [gridSize, setGridSize] = useState<4 | 9 | 16>(4); // 2x2(4), 3x3(9), 4x4(16)
  const [thermalTiles, setThermalTiles] = useState<Record<string, boolean>>({});

  // 카메라 추가 폼
  const [isAddingCamera, setIsAddingCamera] = useState(false);
  const [newCamName, setNewCamName] = useState('');
  const [newCamFloor, setNewCamFloor] = useState('1F');

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCctvMatrixModalOpen) {
        setCctvMatrixModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCctvMatrixModalOpen, setCctvMatrixModalOpen]);

  if (!isCctvMatrixModalOpen) return null;

  // 빌딩 CCTV 노드 추출
  const cctvNodes = nodes.filter(n => n.type === 'CCTV');

  // 화면 그리드 개수에 맞게 타일 배열 슬라이싱
  const displayCctvs = cctvNodes.slice(0, gridSize);

  const toggleThermal = (id: string) => {
    setThermalTiles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCameraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `sensor-cctv-${Date.now()}`;
    addNode({
      id: newId,
      name: newCamName || `${newCamFloor} 신규 보안 CCTV`,
      type: 'CCTV',
      floorId: newCamFloor,
      x: 50,
      y: 50,
      status: 'NORMAL',
      fov: { distance: 18, angle: 95, rotation: 90 },
      updatedAt: new Date().toISOString()
    });

    setNewCamName('');
    setIsAddingCamera(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md select-none p-4"
      onClick={() => setCctvMatrixModalOpen(false)}
    >
      {/* 풀 스크린 비디오월 커맨드 모달 */}
      <div 
        className="w-[1240px] h-[92vh] glass-panel border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative bg-[#060a14]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 툴바 */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Tv size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 tracking-wide flex items-center gap-2">
                <span>CCTV 다채널 동시 시청 & 비디오 월 통합 관제 스크린</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-600 text-white font-mono font-bold">
                  LIVE MATRIX
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                건물 층별 보안 카메라 동시 실시간 모니터링, 열화상 모드, AI 인체 탐지 피드 및 카메라 CRUD 연동
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 그리드 분할 스위처 (2x2, 3x3, 4x4) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-400">
              <button
                onClick={() => setGridSize(4)}
                className={`px-2.5 py-1 rounded font-bold transition ${gridSize === 4 ? 'bg-blue-600 text-white' : 'hover:text-slate-200'}`}
              >
                2 x 2 (4채널)
              </button>
              <button
                onClick={() => setGridSize(9)}
                className={`px-2.5 py-1 rounded font-bold transition ${gridSize === 9 ? 'bg-blue-600 text-white' : 'hover:text-slate-200'}`}
              >
                3 x 3 (9채널)
              </button>
              <button
                onClick={() => setGridSize(16)}
                className={`px-2.5 py-1 rounded font-bold transition ${gridSize === 16 ? 'bg-blue-600 text-white' : 'hover:text-slate-200'}`}
              >
                4 x 4 (16채널)
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddingCamera(!isAddingCamera)}
              icon={<Plus size={14} />}
              className="text-xs py-1.5 font-bold"
            >
              + CCTV 카메라 추가
            </Button>

            <button
              onClick={() => setCctvMatrixModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 cursor-pointer"
              title="닫기 (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 신규 카메라 추가 팝업 바 */}
        {isAddingCamera && (
          <form onSubmit={handleAddCameraSubmit} className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-3 text-xs shrink-0">
            <span className="font-bold text-slate-200 shrink-0">신규 CCTV 추가:</span>
            <input
              type="text"
              value={newCamName}
              onChange={(e) => setNewCamName(e.target.value)}
              placeholder="예: 15F EV홀 CCTV #02"
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
            />
            <select
              value={newCamFloor}
              onChange={(e) => setNewCamFloor(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
            >
              <option value="17F">17F</option>
              <option value="12F">12F</option>
              <option value="6F">6F</option>
              <option value="1F">1F</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="B3">B3</option>
            </select>
            <Button type="submit" variant="success" size="sm" icon={<Check size={12} />}>등록</Button>
          </form>
        )}

        {/* 비디오 월 다채널 타일 그리드 스크린 */}
        <div className="flex-1 p-3 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-700">
          <div className={`grid gap-2.5 h-full ${
            gridSize === 4 ? 'grid-cols-2 grid-rows-2' : gridSize === 9 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-4 grid-rows-4'
          }`}>
            {displayCctvs.map((cctv) => {
              const isThermal = !!thermalTiles[cctv.id];

              return (
                <div 
                  key={cctv.id} 
                  className={`relative rounded-xl border border-slate-800 bg-[#080d1a] overflow-hidden flex flex-col justify-between p-2.5 transition group ${
                    isThermal ? 'hue-rotate-180 contrast-200 saturate-200' : ''
                  }`}
                >
                  {/* 상단 타일 레이블 정보 */}
                  <div className="flex items-center justify-between text-xs z-10">
                    <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                      <Video size={12} className="text-red-500 animate-pulse" />
                      <span className="font-extrabold text-slate-100 text-[11px] truncate">
                        {cctv.floorId} - {cctv.name || 'CCTV'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleThermal(cctv.id)}
                        className={`p-1 rounded text-[9px] font-bold transition border ${
                          isThermal ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                        title="열화상 카메라 전환"
                      >
                        <Camera size={11} />
                      </button>

                      <button
                        onClick={() => {
                          setCctvMatrixModalOpen(false);
                          setActiveCctvId(cctv.id);
                        }}
                        className="p-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded transition"
                        title="단일 카메라 단독 확대"
                      >
                        <Maximize2 size={11} />
                      </button>

                      <button
                        onClick={() => deleteNode(cctv.id)}
                        className="p-1 bg-slate-900 hover:bg-red-900 text-slate-500 hover:text-red-300 rounded transition"
                        title="카메라 삭제"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* 시뮬레이션 라이브 스트림 미디어 레이어 */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-30" />
                    
                    {/* AI 탐지 박스 시뮬레이션 */}
                    <div className="absolute top-[25%] left-[35%] w-20 h-28 border border-emerald-400/80 rounded animate-pulse bg-emerald-500/10 flex flex-col justify-between p-1">
                      <span className="text-[7px] font-mono text-emerald-300 bg-slate-950/80 px-1 rounded w-fit">PERSON 98%</span>
                    </div>

                    {cctv.status === 'ALARM' && (
                      <div className="absolute inset-0 bg-red-600/20 border-2 border-red-500 animate-ping flex items-center justify-center">
                        <Flame size={36} className="text-red-500 animate-bounce" />
                      </div>
                    )}
                  </div>

                  {/* 하단 풋터 비트레이트 오버레이 */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 z-10 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800/60 mt-auto">
                    <span className="text-emerald-400 font-bold">1920x1080 @ 60FPS</span>
                    <span>RTSP / H.265</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

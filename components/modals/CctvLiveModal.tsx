// components/modals/CctvLiveModal.tsx
import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSensorStore } from '../../store/useSensorStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Video, AlertTriangle, X, Settings, Camera, CheckCircle2, Wrench, RotateCw, Maximize2, Minimize2, Flame, ShieldAlert } from 'lucide-react';

interface CctvLiveModalProps {
  onOpenOtpModal: () => void;
}

export const CctvLiveModal: React.FC<CctvLiveModalProps> = ({ onOpenOtpModal }) => {
  const { activeCctvId, setActiveCctvId, setDismissedCctvId, setLocked } = useCanvasStore();
  const { nodes, resolveAlarm } = useSensorStore();
  
  const [streamingUrl, setStreamingUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cctv_streaming_url') || '';
    }
    return '';
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [tempUrl, setTempUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cctv_streaming_url') || '';
    }
    return '';
  });
  const [isThermalMode, setIsThermalMode] = useState<boolean>(false);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const activeNode = nodes.find(node => node.id === activeCctvId);

  const handleCloseModal = () => {
    if (activeCctvId) {
      setDismissedCctvId(activeCctvId);
    }
    setActiveCctvId(null);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLiveTimestamp(now.toISOString().replace('T', ' ').substring(0, 19));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeCctvId) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          handleCloseModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCctvId, isFullscreen, handleCloseModal]);

  if (!activeCctvId || !activeNode) return null;

  const handleRestoreNormal = () => {
    resolveAlarm(activeCctvId, 'NORMAL');
    nodes.forEach(node => {
      if (node.floorId === activeNode.floorId && node.status === 'ALARM') {
        resolveAlarm(node.id, 'NORMAL');
      }
    });
    handleCloseModal();
  };

  const handleFalseAlarm = () => {
    resolveAlarm(activeCctvId, 'NORMAL');
    handleCloseModal();
  };

  const handleSetMaintenance = () => {
    resolveAlarm(activeCctvId, 'MAINTENANCE');
    handleCloseModal();
  };

  const handleEmergencyDispatch = () => {
    handleCloseModal();
    onOpenOtpModal();
  };

  const saveStreamingUrl = () => {
    const cleanUrl = tempUrl.trim();
    localStorage.setItem('cctv_streaming_url', cleanUrl);
    setStreamingUrl(cleanUrl);
    setShowSettings(false);
  };

  const handleRotate = () => {
    setRotationAngle((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getTransformStyle = () => {
    if (rotationAngle === 90 || rotationAngle === 270) {
      return {
        transform: `rotate(${rotationAngle}deg) scale(1.35)`,
        transition: 'transform 0.3s ease',
      };
    }
    return {
      transform: `rotate(${rotationAngle}deg)`,
      transition: 'transform 0.3s ease',
    };
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none p-4"
      onClick={handleCloseModal}
    >
      <div 
        className={`${
          isFullscreen 
            ? 'fixed inset-0 w-full h-full rounded-none border-0' 
            : 'w-[840px] max-w-[95vw] rounded-2xl border border-slate-700/80'
        } glass-panel overflow-hidden shadow-2xl flex flex-col relative bg-[#090e1a] transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 모달 헤더 바 */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Video className="text-red-500 animate-pulse" size={20} />
            <span className="font-bold text-slate-100 text-sm tracking-wide">
              실시간 CCTV 라이브 피드 [{activeNode.name || `${activeNode.floorId} 층 카메라`}]
            </span>
            <Badge status={activeNode.status} pulse={activeNode.status === 'ALARM'} />
          </div>
          
          <div className="flex items-center gap-2">
            {/* 회전 컨트롤 버튼 */}
            <button
              onClick={handleRotate}
              className="p-1.5 rounded text-xs font-bold transition flex items-center gap-1 border bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
              title="화면 90도 회전 (세로/가로 조율)"
            >
              <RotateCw size={14} />
              <span>{rotationAngle}°</span>
            </button>

            {/* 유튜브 스타일 전체 화면 토글 버튼 */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded text-xs font-bold transition flex items-center gap-1 border bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
              title={isFullscreen ? "창 모드로 복귀" : "전체 화면 확대 (유튜브 스타일)"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullscreen ? '축소' : '전체화면'}</span>
            </button>

            {/* 열화상 카메라 모드 토글 */}
            <button
              onClick={() => setIsThermalMode(!isThermalMode)}
              className={`p-1.5 rounded text-xs font-bold transition flex items-center gap-1 border ${
                isThermalMode 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="열화상 카메라 모드 토글"
            >
              <Camera size={14} />
              <span>{isThermalMode ? '열화상 ON' : '일반 모드'}</span>
            </button>

            {/* CCTV 설정 버튼 */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition rounded hover:bg-slate-800"
              title="CCTV 연동 설정"
            >
              <Settings size={16} />
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseModal}
              className="p-1.5 text-slate-400 hover:text-red-400 transition rounded hover:bg-slate-800 cursor-pointer"
              title="닫기 (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 스트리밍 연동 설정바 */}
        {showSettings && (
          <div className="p-4 bg-slate-900 border-b border-slate-800 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-slate-200">CCTV 스트리밍 연동 설정 (외부 IP 카메라 또는 모바일 웹캠)</p>
            <p className="text-[10px] text-slate-400">
              `IP Webcam`, `DroidCam` 또는 RTSP/MJPEG 스트리밍 URL을 입력하십시오.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="http://IP주소:포트/video"
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <Button size="sm" onClick={saveStreamingUrl}>적용</Button>
            </div>
          </div>
        )}

        {/* CCTV 비디오 뷰어 컨테이너 (더블 클릭 시 유튜브 스타일 전체 화면 토글) */}
        <div 
          onDoubleClick={toggleFullscreen}
          className={`${
            isFullscreen ? 'flex-1 h-full' : 'aspect-video w-full'
          } bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-pointer select-none ${
            isThermalMode ? 'hue-rotate-180 contrast-200 saturate-200' : ''
          }`}
          title="더블클릭 시 전체 화면 / 창 모드 토글"
        >
          {streamingUrl ? (
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden"
              style={getTransformStyle()}
            >
              <iframe
                src={streamingUrl}
                title="CCTV Live Stream"
                className="w-full h-full border-0 object-cover"
                allow="camera; microphone; autoplay"
              />
            </div>
          ) : (
            <div className="relative w-full h-full bg-[#080d1a] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              <div className="absolute top-[30%] left-[40%] w-32 h-44 border-2 border-emerald-400/80 rounded-lg animate-pulse flex flex-col justify-between p-1.5 bg-emerald-500/10">
                <span className="text-[9px] font-mono font-bold text-emerald-300 bg-slate-950/80 px-1 rounded w-fit">
                  PERSON: 98.4%
                </span>
                <span className="text-[8px] font-mono text-emerald-400 text-right">FACE DETECTED</span>
              </div>

              {activeNode.status === 'ALARM' && (
                <div className="absolute top-[20%] right-[25%] w-28 h-28 border-2 border-red-500 rounded-full animate-ping flex items-center justify-center bg-red-500/20">
                  <Flame size={32} className="text-red-500 animate-bounce" />
                </div>
              )}

              <div className="z-10 text-center space-y-1">
                <Video size={40} className="text-blue-500 mx-auto mb-1 animate-pulse" />
                <h4 className="text-sm font-extrabold text-slate-200 tracking-wider">
                  [{activeNode.floorId}] {activeNode.name || 'AI CCTV'} 라이브 피드
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  RESOLUTION: 1920x1080 @ 60FPS | ENCODING: H.265 / RTSP
                </p>
              </div>
            </div>
          )}

          {/* 실시간 녹화 표시 레이블 */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-lg text-[10px] font-bold text-red-500 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>REC LIVE</span>
            <span className="text-slate-400 font-mono ml-2">{liveTimestamp}</span>
          </div>

          {/* 가이드 힌트 툴팁 */}
          <div className="absolute bottom-4 left-4 bg-slate-950/80 px-2.5 py-1 rounded-lg text-[10px] text-slate-400 border border-slate-800/80 backdrop-blur">
            💡 비디오 영역 더블클릭: 전체화면 토글 | [🔄 회전] 버튼: 90° 회전
          </div>

          <div className="absolute bottom-4 right-4 bg-slate-950/80 px-2.5 py-1 rounded-lg text-[9px] font-mono text-slate-300 border border-slate-800">
            CAM_ID: {activeNode.id.substring(0, 12).toUpperCase()}
          </div>
        </div>

        {/* 하단 4대 액션 버튼 */}
        <div className="p-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          <Button
            variant="success"
            onClick={handleRestoreNormal}
            className="flex-1 py-2 font-bold justify-center"
            icon={<CheckCircle2 size={13} />}
          >
            ✅ 정상 복구
          </Button>

          <Button
            variant="glass"
            onClick={handleFalseAlarm}
            className="flex-1 py-2 font-bold justify-center hover:border-amber-500/40 text-amber-300"
            icon={<AlertTriangle size={13} className="text-amber-400" />}
          >
            ⚠️ 오경보 처리
          </Button>

          <Button
            variant="warning"
            onClick={handleSetMaintenance}
            className="flex-1 py-2 font-bold justify-center text-slate-950"
            icon={<Wrench size={13} />}
          >
            🔧 점검 격하
          </Button>

          <Button
            variant="danger"
            onClick={handleEmergencyDispatch}
            className="flex-1 py-2 font-bold justify-center"
            icon={<ShieldAlert size={13} className="animate-pulse" />}
          >
            🚨 119 신고
          </Button>
        </div>
      </div>
    </div>
  );
};

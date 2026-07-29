// app/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloorSelector } from '../components/sidebar/FloorSelector';
import { FloorCanvas } from '../components/canvas/FloorCanvas';
import { SensorPalette } from '../components/sidebar/SensorPalette';
import { CctvLiveModal } from '../components/modals/CctvLiveModal';
import { EmergencyOtpModal } from '../components/modals/EmergencyOtpModal';
import { FireLogManageModal } from '../components/modals/FireLogManageModal';
import { SensorManageModal } from '../components/modals/SensorManageModal';
import { EvChargerManageModal } from '../components/modals/EvChargerManageModal';
import { CctvMultiMatrixModal } from '../components/modals/CctvMultiMatrixModal';
import { AlarmCenterToast } from '../components/common/AlarmCenterToast';
import { useCanvasStore } from '../store/useCanvasStore';
import { useSensorStore } from '../store/useSensorStore';
import { useOccupantStore } from '../store/useOccupantStore';
import { useEmergencyTimer } from '../hooks/useEmergencyTimer';
import { FLOOR_LIST, FloorId } from '../types/floor';
import { ShieldIcon, AlertIcon } from '../components/common/Icons';
import { 
  Users, 
  Volume2, 
  VolumeX, 
  Smartphone,
  ArrowRight,
  Flame,
  Siren,
  PowerOff,
  CheckCircle2,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const { 
    viewMode,
    setViewMode,
    selectedFloor, 
    setFloor 
  } = useCanvasStore();

  const { 
    nodes, 
    loadNodes, 
    activeAlarmCount 
  } = useSensorStore();

  const {
    clearedFloorIds,
    clearFloorOccupants,
    getFloorRemainingCount,
    getTotalBuildingRemainingCount,
    resetOccupants
  } = useOccupantStore();

  const { 
    isOtpApproved, 
    revoke119Session
  } = useEmergencyTimer();

  const [isOtpOpen, setIsOtpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const fetchSensors = async () => {
    try {
      const res = await fetch('/api/sensors');
      const json = await res.json();
      if (json.success && json.data) {
        loadNodes(json.data);
      }
    } catch {
      // 센서 동기화 실패 시 무시 (다음 폴링에서 재시도)
    }
  };

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 3000);
    return () => clearInterval(interval);
  }, []);

  const stopAlarmSound = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // 이미 중지된 경우 무시
      }
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  };

  useEffect(() => {
    const playAlarmSound = () => {
      if (isMuted || activeAlarmCount === 0) {
        stopAlarmSound();
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      if (!oscillatorRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        
        let isBeep = false;
        const intervalId = setInterval(() => {
          if (isMuted || activeAlarmCount === 0) {
            clearInterval(intervalId);
            return;
          }
          isBeep = !isBeep;
          gain.gain.setTargetAtTime(isBeep ? 0.25 : 0.0, ctx.currentTime, 0.05);
        }, 350);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
      }
    };

    playAlarmSound();

    return () => {
      stopAlarmSound();
    };
  }, [activeAlarmCount, isMuted]);

  const checkFloorAlarm = (floorId: FloorId): boolean => {
    return nodes.some((n) => n.floorId === floorId && n.status === 'ALARM');
  };

  const handleSelectFloorAndEnterCanvas = (floorId: FloorId) => {
    setFloor(floorId);
    setViewMode('CANVAS');
  };

  const totalRemainingCount = getTotalBuildingRemainingCount();

  return (
    <div className="w-full h-full flex bg-[#060913] overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {/* 모드 1: 2.5D 건물 수직 방재 조감도 */}
        {viewMode === 'BUILDING' ? (
          <motion.div
            key="building-overview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex flex-col p-6 overflow-hidden bg-gradient-to-b from-[#060913] via-[#091022] to-[#040710]"
          >
            {/* 상단 대시보드 헤더 */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <ShieldIcon size={28} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-extrabold text-white tracking-wider">PyroGuard 2D</h1>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 border border-blue-500/40 text-blue-300">
                      스마트 빌딩 관제 센터
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    지상 17층 / 지하 3층 / 외부 (총 21개 관제 구역) 수직 방재 조감도 — 층 클릭 시 2D 평면 도면으로 진입합니다.
                  </p>
                </div>
              </div>

              {/* 우측 관제 지표 & 119 OTP 승인 및 모바일 시연 세로 동급 버튼 */}
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-xl border transition duration-200 shadow-xl cursor-pointer ${
                      activeAlarmCount > 0 && !isMuted
                        ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 animate-bounce'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                    title={isMuted ? "경보 부저 음소거 해제" : "경보 부저 음소거"}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  <div className={`glass-panel px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                    isOtpApproved ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300' : 'border-slate-800 text-slate-400'
                  }`}>
                    <Users size={16} className={isOtpApproved ? "text-emerald-400 animate-bounce" : "text-slate-500"} />
                    <span>총 잔류 인원:</span>
                    <span className="font-extrabold font-mono text-white text-sm">
                      {isOtpApproved ? `${totalRemainingCount}명` : '🔒 승인필요'}
                    </span>
                  </div>
                </div>

                {/* 119 OTP 버튼과 동일한 크기로 바로 아래 세로 배치된 모바일 시연 버튼 컨테이너 */}
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                  {isOtpApproved ? (
                    <button
                      onClick={() => {
                        revoke119Session();
                        resetOccupants();
                        setViewMode('BUILDING');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-red-400 shadow-lg shadow-red-500/30 transition cursor-pointer w-full"
                    >
                      <PowerOff size={16} />
                      <span>🚨 119 상황 종료</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsOtpOpen(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-red-400 shadow-lg shadow-red-500/30 animate-pulse transition cursor-pointer w-full"
                    >
                      <Siren size={16} />
                      <span>🚨 119 소방관 OTP 승인</span>
                    </button>
                  )}

                  <a
                    href="/mobile-demo"
                    target="_blank"
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 shadow-lg transition cursor-pointer w-full"
                  >
                    <Smartphone size={16} />
                    <span>📱 모바일 시연 컨트롤러</span>
                  </a>
                </div>
              </div>
            </div>

            {/* 21개 관제 구역/층 카드 그리드 */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pb-6">
                {FLOOR_LIST.map((floor) => {
                  const isAlarm = checkFloorAlarm(floor.id);
                  const isSelected = selectedFloor === floor.id;
                  const floorSensorCount = nodes.filter(n => n.floorId === floor.id).length;
                  const alarmNodes = nodes.filter(n => n.floorId === floor.id && n.status === 'ALARM');
                  const remainingCount = getFloorRemainingCount(floor.id);
                  const isCleared = clearedFloorIds.includes(floor.id);

                  return (
                    <motion.div
                      key={floor.id}
                      onClick={() => handleSelectFloorAndEnterCanvas(floor.id)}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none shadow-xl ${
                        isAlarm
                          ? 'bg-gradient-to-br from-red-950/80 via-red-900/40 to-slate-950 border-red-500 ring-2 ring-red-500/50'
                          : isSelected
                            ? 'bg-gradient-to-br from-blue-950/80 via-slate-900 to-slate-950 border-blue-500 ring-1 ring-blue-400/40'
                            : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border font-mono ${
                            isAlarm
                              ? 'bg-red-600 text-white border-red-400 animate-bounce'
                              : isSelected
                                ? 'bg-blue-600 text-white border-blue-400'
                                : 'bg-slate-800 text-slate-200 border-slate-700'
                          }`}>
                            {floor.id === 'OUTSIDE' ? '외부' : floor.id}
                          </span>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-100">{floor.name}</h3>
                            <span className="text-[10px] text-slate-400 truncate block max-w-[140px]">
                              {floor.description}
                            </span>
                          </div>
                        </div>

                        {isAlarm && (
                          <div className="px-2 py-1 rounded-lg bg-red-600 text-white text-[10px] font-black flex items-center gap-1 border border-red-400 animate-pulse">
                            <AlertIcon size={12} />
                            <span>경보 발생</span>
                          </div>
                        )}
                      </div>

                      {isAlarm && alarmNodes.length > 0 && (
                        <div className="mb-2 p-1.5 rounded-lg bg-red-950/80 border border-red-500/50 text-[10px] text-red-200 font-extrabold flex flex-col gap-1 shadow-inner">
                          {alarmNodes.map(an => (
                            <div key={an.id} className="flex items-center gap-1.5 text-red-300">
                              {an.type === 'ARC' ? <Zap size={12} className="text-amber-400 shrink-0" /> : <Flame size={12} className="text-red-400 shrink-0" />}
                              <span className="truncate">{an.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="py-2 px-3 bg-slate-950/80 rounded-xl border border-slate-800/80 my-2 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                          <Users size={13} className={isOtpApproved ? "text-emerald-400" : "text-slate-500"} />
                          잔류 인원:
                        </span>

                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-extrabold text-xs ${
                            isCleared ? 'text-blue-400' : isOtpApproved ? 'text-emerald-300' : 'text-slate-500'
                          }`}>
                            {isCleared ? '✅ 0명 (구조 완료)' : isOtpApproved ? `👤 ${remainingCount}명` : '🔒 승인 필요'}
                          </span>

                          {isOtpApproved && !isCleared && remainingCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearFloorOccupants(floor.id);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-lg shadow-blue-600/30 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                              title="해당 층 잔류 인원 전체를 구조 완료(0명) 상태로 클리어합니다."
                            >
                              <CheckCircle2 size={13} />
                              <span>🧹 층 구조 완료</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-semibold">
                          소방 센서: <strong className="text-slate-200 font-mono">{floorSensorCount}개</strong>
                        </span>

                        <div className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:translate-x-1 transition">
                          <span>2D 도면 진입</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          /* 모드 2: 2D CAD 평면 도면 관제 모드 (도면 영역과 겹침 없는 인라인 툴바 구조) */
          <motion.div
            key="canvas-mode"
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex bg-[#060913] overflow-hidden relative"
          >
            <FloorSelector />

            <div className="flex-1 h-full flex flex-col relative">
              <FloorCanvas onOpenOtpModal={() => setIsOtpOpen(true)} />
            </div>

            <SensorPalette />
          </motion.div>
        )}
      </AnimatePresence>

      <CctvLiveModal 
        onOpenOtpModal={() => setIsOtpOpen(true)} 
      />

      <EmergencyOtpModal 
        isOpen={isOtpOpen} 
        onClose={() => setIsOtpOpen(false)} 
      />

      <FireLogManageModal />
      <SensorManageModal />
      <AlarmCenterToast />
      <CctvMultiMatrixModal />
      <EvChargerManageModal />
    </div>
  );
}

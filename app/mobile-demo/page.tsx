// app/mobile-demo/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Droplet, 
  Gauge, 
  Zap, 
  Waves, 
  LogOut, 
  Video, 
  Smartphone, 
  RotateCcw,
  Radio,
  Building2,
  Car
} from 'lucide-react';
import { FLOOR_LIST } from '../../types/floor';

export default function MobileDemoPage() {
  const [sensorsList, setSensorsList] = useState<any[]>([]);
  const [cctvUrl, setCctvUrl] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('연결 대기');
  const [selectedFilterFloor, setSelectedFilterFloor] = useState<string>('ALL');

  // 대시보드 배치 센서 데이터 동기화
  const fetchSensors = async () => {
    try {
      const res = await fetch('/api/sensors');
      const json = await res.json();
      if (json.success) {
        setSensorsList(json.data);
        setConnectionStatus('서버 연동 완료');
      }
    } catch (err) {
      setConnectionStatus('서버 연결 실패');
    }
  };

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 5000);
    
    const savedUrl = localStorage.getItem('cctv_streaming_url') || '';
    setCctvUrl(savedUrl);

    return () => clearInterval(interval);
  }, []);

  // 터치식 실시간 센서 경보(ALARM / NORMAL) 상태 신호 패킷 송신
  const handleTriggerAlarm = async (sensorId: string, sensorType: string) => {
    try {
      const sensor = sensorsList.find(s => s.id === sensorId);
      if (!sensor) return;

      const isCurrentAlarm = sensor.status === 'ALARM';
      const nextStatus = isCurrentAlarm ? 'NORMAL' : 'ALARM';
      
      const nextVal = sensorType === 'WATER_PRESSURE' 
        ? (nextStatus === 'ALARM' ? 1.2 : 3.2) 
        : sensor.value;

      const res = await fetch('/api/sensors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sensorId,
          status: nextStatus,
          value: nextVal,
          ...(sensorType === 'EMERGENCY_DOOR' ? { doorState: nextStatus === 'ALARM' ? 'OPENED' : 'CLOSED' } : {})
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchSensors();
      }
    } catch (err) {
      alert("센서 패킷 전송 실패");
    }
  };

  // 요청사항 3: 지하주차장 층별 (B1, B2, B3) 연기 감지기 작동 특화 트리거
  const triggerBasementSmokeAlarm = async (floorId: string, sensorName: string) => {
    try {
      const smokeSensorId = `sensor-smoke-${floorId.toLowerCase()}`;
      const existing = sensorsList.find(s => s.id === smokeSensorId || (s.floorId === floorId && s.type === 'ARC'));

      const targetId = existing ? existing.id : smokeSensorId;

      if (!existing) {
        await fetch('/api/sensors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: smokeSensorId,
            name: sensorName,
            type: 'ARC',
            floorId: floorId,
            x: 50,
            y: 45,
            status: 'NORMAL',
            updatedAt: new Date().toISOString()
          })
        });
      }

      const res = await fetch('/api/sensors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId,
          status: 'ALARM',
          value: 99
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`${sensorName} 경보 신호 송출 완료! 웹 대시보드 캔버스에 즉시 반영됩니다.`);
        fetchSensors();
      }
    } catch (err) {
      alert("연기 감지 패킷 전송 에러");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'EXTINGUISHER': return <Flame size={15} />;
      case 'HYDRANT': return <Droplet size={15} />;
      case 'WATER_PRESSURE': return <Gauge size={15} />;
      case 'ARC': return <Zap size={15} />;
      case 'LEAK': return <Waves size={15} />;
      case 'EMERGENCY_DOOR': return <LogOut size={15} />;
      default: return <Video size={15} />;
    }
  };

  const filteredSensors = sensorsList.filter(s => {
    if (selectedFilterFloor === 'ALL') return true;
    return s.floorId === selectedFilterFloor;
  });

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col p-4 font-sans select-none pb-12">
      {/* 상단 헤더 바 */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <Smartphone className="text-blue-500 animate-pulse" size={20} />
          <div>
            <h1 className="text-sm font-extrabold tracking-wide">PyroGuard 2D</h1>
            <span className="text-[9px] text-slate-400">모바일 시연 송신기</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus.includes('성공') || connectionStatus.includes('완료') ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span>{connectionStatus}</span>
        </div>
      </div>

      {/* 1. CCTV 연동 안내 */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 mb-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <Video className="text-blue-400" size={15} />
          <h2 className="text-xs font-bold text-slate-200">1. 모바일 카메라 CCTV 연동 설정</h2>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          동일한 와이파이(Local LAN)망 하에서 스마트폰 `IP Webcam` 앱 주소(예: <span className="font-mono text-blue-400">http://192.168.0.x:8080/video</span>)를 웹 대시보드 CCTV 설정에 입력하십시오.
        </p>
      </div>

      {/* 2. 지하주차장 층별 연기감지기 작동 특화 컨트롤러 (요청사항 3 반영) */}
      <div className="bg-slate-900/60 border border-red-500/30 rounded-xl p-3.5 mb-4 space-y-2.5 bg-red-950/10">
        <div className="flex items-center gap-2 text-xs font-bold text-red-400">
          <Car size={16} />
          <span>2. 지하주차장 층별 (B1, B2, B3) 연기감지기 작동 시연</span>
        </div>
        <p className="text-[10px] text-slate-400">
          터치 시 각 지하주차장 층의 연기감지기에 비상 경보 신호가 즉시 전송됩니다.
        </p>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            onClick={() => triggerBasementSmokeAlarm('B1', 'B1 주차장 연기감지기')}
            className="py-2.5 bg-red-600/30 hover:bg-red-600 text-red-200 font-bold rounded-lg border border-red-500/40 text-[10px] flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer"
          >
            <Flame size={14} className="text-red-400" />
            <span>B1 주차장 연기 작동</span>
          </button>

          <button
            onClick={() => triggerBasementSmokeAlarm('B2', 'B2 전기차 충전구역 연기감지기')}
            className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-lg border border-red-400 text-[10px] flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer animate-pulse"
          >
            <Flame size={14} />
            <span>B2 전기차 연기 작동</span>
          </button>

          <button
            onClick={() => triggerBasementSmokeAlarm('B3', 'B3 기계실 연기감지기')}
            className="py-2.5 bg-red-600/30 hover:bg-red-600 text-red-200 font-bold rounded-lg border border-red-500/40 text-[10px] flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer"
          >
            <Flame size={14} className="text-red-400" />
            <span>B3 기계실 연기 작동</span>
          </button>
        </div>
      </div>

      {/* 3. 층별 및 배치된 센서별 경보 발생 터치 송신기 (요청사항 2 반영) */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Radio className="text-emerald-400" size={15} />
            <h2 className="text-xs font-bold text-slate-200">3. 층별 & 배치 센서별 경보 발생 송신기</h2>
          </div>
          <button 
            onClick={fetchSensors}
            className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-slate-200"
            title="새로고침"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* 층별 필터 세그먼트 */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3 text-[10px] font-bold scrollbar-thin scrollbar-thumb-slate-800">
          <button
            onClick={() => setSelectedFilterFloor('ALL')}
            className={`px-2.5 py-1 rounded shrink-0 transition ${selectedFilterFloor === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
          >
            전체 층 ({sensorsList.length})
          </button>
          {FLOOR_LIST.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilterFloor(f.id)}
              className={`px-2.5 py-1 rounded shrink-0 transition ${selectedFilterFloor === f.id ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* 층별/센서별 개별 경보 발생 버튼 리스트 */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px] pr-1">
          {filteredSensors.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
              해당 층에 배치된 센서가 없습니다.
            </div>
          ) : (
            filteredSensors.map((sensor) => (
              <div 
                key={sensor.id}
                onClick={() => handleTriggerAlarm(sensor.id, sensor.type)}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition cursor-pointer active:scale-98 ${
                  sensor.status === 'ALARM'
                    ? 'bg-red-950/40 border-red-500 text-red-100'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded ${sensor.status === 'ALARM' ? 'bg-red-600/20 text-red-400' : 'bg-slate-900 text-slate-400'}`}>
                    {getIcon(sensor.type)}
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      {sensor.name || (sensor.type === 'EXTINGUISHER' ? '소화기' 
                       : sensor.type === 'HYDRANT' ? '소화전 도어'
                       : sensor.type === 'WATER_PRESSURE' ? '배관 수압계'
                       : sensor.type === 'ARC' ? '아크 감지기'
                       : sensor.type === 'LEAK' ? '누수 감지 테이프'
                       : sensor.type === 'EMERGENCY_DOOR' ? '비상구 방화문'
                       : 'CCTV 카메라')}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      층: {sensor.floorId} | ID: {sensor.id.substring(0, 12)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-[9px] font-extrabold border ${
                    sensor.status === 'ALARM' 
                      ? 'bg-red-600 text-white border-red-400 animate-pulse' 
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {sensor.status === 'ALARM' ? '🔥 경보 송출 중' : '터치하여 경보'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// components/sidebar/FloorSelector.tsx
import React, { useState } from 'react';
import clsx from 'clsx';
import { FLOOR_LIST, FloorId } from '../../types/floor';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSensorStore } from '../../store/useSensorStore';
import { useFireLogStore } from '../../store/useFireLogStore';
import { SensorType, SensorStatus, DoorState } from '../../types/sensor';
import { ShieldIcon, SensorIcon } from '../common/Icons';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  Building2, 
  Settings, 
  Video, 
  Car, 
  DoorClosed, 
  ClipboardList, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Power,
  Clock,
  FileSpreadsheet,
  Layers,
  Zap,
  Tv
} from 'lucide-react';

export type LeftMenuTab = 'SENSOR_MGMT' | 'CCTV' | 'FLOOR_STATUS' | 'PARKING' | 'EMERGENCY_DOOR' | 'FIRE_LOG';

interface FloorSelectorProps {
}

export const FloorSelector: React.FC<FloorSelectorProps> = () => {
  const { 
    selectedFloor, 
    setFloor, 
    setViewMode,
    setActiveCctvId,
    setFireLogModalOpen,
    setSensorManageModalOpen,
    setEvChargerModalOpen,
    setCctvMatrixModalOpen
  } = useCanvasStore();

  const { 
    nodes, 
    deleteNode,
    triggerAlarm,
    resolveAlarm,
    updateDoorState,
    updateNode
  } = useSensorStore();

  const { logs } = useFireLogStore();

  const [activeTab, setActiveTab] = useState<LeftMenuTab>('SENSOR_MGMT');
  
  // Requirement 4: 층별 상태 아코디언 펼침 상태 (층 ID 배열)
  const [expandedFloors, setExpandedFloors] = useState<string[]>([selectedFloor]);

  // 비상문 설치 층 (요청사항 6: 비상문 센서 부착 층만 선택적 표출)
  const doorNodes = nodes.filter(n => n.type === 'EMERGENCY_DOOR');
  
  // CCTV 노드
  const cctvNodes = nodes.filter(n => n.type === 'CCTV');
  const currentFloorNodes = nodes.filter(n => n.floorId === selectedFloor);

  // 특정 층 경보 체적 검사
  const getFloorAlarmState = (floorId: FloorId): 'NORMAL' | 'WARNING' | 'DANGER' | 'ALARM' => {
    const floorSensors = nodes.filter(n => n.floorId === floorId);
    if (floorSensors.some(n => n.status === 'ALARM')) return 'ALARM';
    if (floorSensors.some(n => n.status === 'OFFLINE')) return 'DANGER';
    if (floorSensors.some(n => n.status === 'MAINTENANCE')) return 'WARNING';
    return 'NORMAL';
  };

  // 아코디언 토글
  const toggleFloorExpand = (floorId: string) => {
    setExpandedFloors(prev => 
      prev.includes(floorId) ? prev.filter(id => id !== floorId) : [...prev, floorId]
    );
  };

  return (
    <div className="w-[270px] md:w-[280px] h-full flex flex-col glass-panel border-r border-slate-800/80 p-3 select-none overflow-hidden shrink-0 box-border z-20">
      {/* 1. 브랜드 타이틀 & 건물 조감도 복귀 */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldIcon className="text-blue-500 animate-pulse" size={20} />
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 tracking-wide">PyroGuard 2D</h2>
            <span className="text-[9px] text-slate-400">통합 방재 메뉴</span>
          </div>
        </div>

        <button
          onClick={() => setViewMode('BUILDING')}
          className="px-2 py-1 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 hover:bg-blue-900/80 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
          title="전체 건물 조감도 보기"
        >
          <Building2 size={13} />
          <span>조감도</span>
        </button>
      </div>

      {/* 2. 세분화된 카테고리 탭 (요청사항 1, 2, 4, 5, 6, 7 반영) */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950/90 border border-slate-800/80 p-1 rounded-xl my-2.5 shrink-0 text-[10px] font-bold">
        <button
          onClick={() => setActiveTab('SENSOR_MGMT')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
            activeTab === 'SENSOR_MGMT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings size={12} />
          <span>센서 관리</span>
        </button>

        <button
          onClick={() => setActiveTab('CCTV')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
            activeTab === 'CCTV' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Video size={12} />
          <span>CCTV 감시</span>
        </button>

        <button
          onClick={() => setActiveTab('FLOOR_STATUS')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
            activeTab === 'FLOOR_STATUS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={12} />
          <span>층별 상태</span>
        </button>

        <button
          onClick={() => setActiveTab('PARKING')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
            activeTab === 'PARKING' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car size={12} />
          <span>주차 현황</span>
        </button>

        <button
          onClick={() => setActiveTab('EMERGENCY_DOOR')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
            activeTab === 'EMERGENCY_DOOR' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DoorClosed size={12} />
          <span>비상문</span>
        </button>

        <button
          onClick={() => setActiveTab('FIRE_LOG')}
          className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
            activeTab === 'FIRE_LOG' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList size={12} />
          <span>점검 이력</span>
        </button>
      </div>

      {/* 3. 탭별 상세 관제 콘텐츠 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 space-y-3">
        
        {/* ========================================================================= */}
        {/* [서브메뉴 1] 센서 관리 및 추가 (요청사항 1 반영 - 새로운 센서 등록 CRUD 모달) */}
        {/* ========================================================================= */}
        {activeTab === 'SENSOR_MGMT' && (
          <div className="space-y-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSensorManageModalOpen(true)}
              className="w-full justify-center py-2 text-xs font-bold border border-blue-400/30"
              icon={<Plus size={14} />}
            >
              + 새로운 센서/노드 관리 & 등록 (CRUD)
            </Button>

            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
              <span>{selectedFloor} 층 배치 센서</span>
              <span className="font-bold text-blue-400">{currentFloorNodes.length}개 노드</span>
            </div>

            {currentFloorNodes.length > 0 ? (
              <div className="space-y-2">
                {currentFloorNodes.map((node) => (
                  <div 
                    key={node.id} 
                    onDoubleClick={() => setSensorManageModalOpen(true)}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs hover:border-blue-500/40 cursor-pointer transition"
                    title="더블클릭 시 센서별 정밀 관리 페이지로 진입합니다."
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg border ${
                        node.status === 'ALARM' ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                        {node.customEmoji ? <span className="text-xs">{node.customEmoji}</span> : <SensorIcon type={node.type} size={14} />}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-200 text-[11px] truncate">
                          {node.name || (node.type === 'EXTINGUISHER' ? '소화기' : node.type === 'HYDRANT' ? '소화전' : node.type === 'WATER_PRESSURE' ? '수압계' : node.type === 'ARC' ? '아크차단기' : node.type === 'LEAK' ? '누수테이프' : node.type === 'EMERGENCY_DOOR' ? '비상문' : node.type === 'CCTV' ? 'CCTV' : '커스텀 센서')}
                        </h5>
                        <span className="text-[9px] text-slate-400 font-mono block truncate">
                          ({node.x.toFixed(0)}%, {node.y.toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        node.status === 'ALARM' ? 'bg-red-600/30 text-red-300 border border-red-500' : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {node.status === 'ALARM' ? '비상' : '정상'}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="p-1 text-slate-500 hover:text-red-400 rounded transition" title="센서 삭제">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-[11px]">
                현재 층에 센서가 없습니다.<br />위의 [새로운 센서 등록] 버튼 또는 우측 팔레트를 이용하십시오.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* [서브메뉴 2] CCTV 감시 전용 탭 (동시 시청 비디오 월 & 카메라 CRUD)           */}
        {/* ========================================================================= */}
        {activeTab === 'CCTV' && (
          <div className="space-y-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCctvMatrixModalOpen(true)}
              className="w-full justify-center py-2 text-xs font-bold border border-blue-400/40 bg-blue-600/30 text-blue-200"
              icon={<Tv size={14} />}
            >
              🖥️ CCTV 동시 시청 & 다채널 비디오월
            </Button>

            <Button
              variant="glass"
              size="sm"
              onClick={() => setSensorManageModalOpen(true)}
              className="w-full justify-center py-1.5 text-xs font-semibold"
              icon={<Plus size={13} />}
            >
              ⚙️ CCTV 카메라 등록 및 CRUD 관리
            </Button>

            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 pt-1">
              <span>건물 층별 CCTV 카메라 목록</span>
              <span className="font-bold text-blue-400">{cctvNodes.length}대 동작 중</span>
            </div>

            {cctvNodes.length > 0 ? (
              cctvNodes.map(cctv => (
                <div key={cctv.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Video size={15} className="text-blue-400" />
                      <span className="font-bold text-slate-200">{cctv.floorId} 카메라 ({cctv.id.substring(7, 13)})</span>
                    </div>
                    <Badge status={cctv.status} />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>시야거리: {cctv.fov?.distance || 12}m / 화각: {cctv.fov?.angle || 95}°</span>
                    <button
                      onClick={() => setActiveCctvId(cctv.id)}
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink size={10} />
                      <span>라이브 피드</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-slate-500 text-center py-6">배치된 CCTV 카메가가 없습니다.</div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* [서브메뉴 3] 층별 상태 (요청사항 4 반영 - 아코디언 펼침 & 층별 센서 상태)  */}
        {/* ========================================================================= */}
        {activeTab === 'FLOOR_STATUS' && (
          <div className="space-y-2">
            <div className="text-[10px] text-slate-400 px-1 mb-1">
              층을 클릭하면 설치 센서 목록 및 상태(양호/경고/위험/비상)가 펼쳐집니다.
            </div>

            {FLOOR_LIST.map((floor) => {
              const isExpanded = expandedFloors.includes(floor.id);
              const isCurrentSelected = selectedFloor === floor.id;
              const floorSensors = nodes.filter(n => n.floorId === floor.id);
              const alarmState = getFloorAlarmState(floor.id);

              return (
                <div key={floor.id} className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                  {/* 아코디언 층 헤더 */}
                  <div
                    onClick={() => {
                      toggleFloorExpand(floor.id);
                      setFloor(floor.id);
                    }}
                    className={clsx(
                      "p-2.5 flex items-center justify-between text-xs cursor-pointer select-none transition",
                      {
                        "bg-red-600/20 text-white font-bold": alarmState === 'ALARM',
                        "bg-blue-600/20 text-white font-bold": isCurrentSelected && alarmState !== 'ALARM',
                        "hover:bg-slate-800/60 text-slate-300": !isCurrentSelected && alarmState !== 'ALARM'
                      }
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold font-mono text-xs">{floor.id}</span>
                      <span className="font-bold text-[11px]">{floor.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 상태 배지: 양호(Green), 경고(Yellow), 위험(Orange), 비상(Red) */}
                      {alarmState === 'ALARM' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-600 text-white animate-pulse">비상</span>
                      ) : alarmState === 'DANGER' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-600/30 text-orange-300 border border-orange-500/40">위험</span>
                      ) : alarmState === 'WARNING' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">경고</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">양호</span>
                      )}

                      <span className="text-[10px] text-slate-400 font-mono">{floorSensors.length}개</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* 아코디언 펼침 세부 센서 목록 */}
                  {isExpanded && (
                    <div className="p-2 bg-slate-950/80 border-t border-slate-800/60 space-y-1.5 text-[11px]">
                      {floorSensors.length > 0 ? (
                        floorSensors.map(sensor => (
                          <div key={sensor.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-slate-900 border border-slate-850">
                            <div className="flex items-center gap-2">
                              <SensorIcon type={sensor.type} size={12} className="text-slate-400" />
                              <span className="text-slate-200 font-medium">{sensor.name || sensor.type}</span>
                            </div>
                            <span className={`text-[9px] font-mono font-bold ${
                              sensor.status === 'ALARM' ? 'text-red-400 animate-pulse' : sensor.status === 'MAINTENANCE' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {sensor.status === 'ALARM' ? '비상 경보' : sensor.status === 'MAINTENANCE' ? '점검중' : '양호'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-slate-500 text-center py-2">배치된 센서 없음</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* [서브메뉴 4] 주차 현황 (요청사항 5 반영 - 각 층별 주차 대수 표출)           */}
        {/* ========================================================================= */}
        {activeTab === 'PARKING' && (
          <div className="space-y-3">
            <div className="text-[10px] text-slate-400 px-1">
              지하주차장 실시간 주차 대수 및 B2 전기차 충전구역 연기감지 현황
            </div>

            {/* B1 주차 현황 카드 */}
            <div 
              onClick={() => setFloor('B1')}
              className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                selectedFloor === 'B1' ? 'border-blue-500 bg-blue-950/30' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Car size={14} className="text-blue-400" />
                  B1 지하 1층 주차장
                </span>
                <span className="text-emerald-400 font-extrabold font-mono">142 / 160 대</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '88.7%' }} />
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                <span>점유율 88.7% (잔여 18대)</span>
                <span className="text-blue-400 font-bold">B1 층 관제 선택</span>
              </div>
            </div>

            {/* B2 전기차 충전구역 주차 현황 카드 */}
            <div 
              className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                selectedFloor === 'B2' ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/40' : 'border-blue-500/40 bg-blue-950/20 hover:bg-blue-900/30'
              }`}
            >
              <div 
                onClick={() => setFloor('B2')}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Car size={14} className="text-emerald-400" />
                  B2 주차장 & 전기차 충전 구역
                </span>
                <span className="text-blue-400 font-extrabold font-mono">118 / 150 대</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78.7%' }} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-300 pt-1">
                <span>⚡ 전기차 급속 충전: <strong className="text-emerald-400 font-mono">12 / 15대</strong></span>
                <span className="text-emerald-400 font-bold">감지기 RS-485 정상</span>
              </div>
              <Button 
                variant="success" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setFloor('B2');
                  setEvChargerModalOpen(true);
                }} 
                className="w-full justify-center text-xs py-1.5 mt-1 font-bold border border-emerald-500/40" 
                icon={<Zap size={12} />}
              >
                ⚡ 충전기 관리
              </Button>
            </div>

            {/* B3 기계실/주차 현황 카드 */}
            <div 
              onClick={() => setFloor('B3')}
              className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                selectedFloor === 'B3' ? 'border-blue-500 bg-blue-950/30' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Car size={14} className="text-slate-400" />
                  B3 지하 3층 기계실/주차장
                </span>
                <span className="text-emerald-400 font-extrabold font-mono">85 / 120 대</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-slate-600 h-full rounded-full" style={{ width: '70.8%' }} />
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                <span>점유율 70.8% (잔여 35대)</span>
                <span className="text-blue-400 font-bold">B3 층 관제 선택</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* [서브메뉴 5] 비상문 센서 현황 (요청사항 6 - 센서 부착 층만 표출, 시간조정/수동개폐) */}
        {/* ========================================================================= */}
        {activeTab === 'EMERGENCY_DOOR' && (
          <div className="space-y-3">
            <div className="text-[10px] text-slate-400 px-1">
              비상구 센서 부착 층만 선택 표출 — 전원 ON/OFF, 센서 상태, 도어클로저 시간 조율 및 수동 개폐
            </div>

            {doorNodes.length > 0 ? (
              doorNodes.map(door => (
                <div key={door.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-100">{door.floorId} 비상구 방화문</span>
                    
                    <div className="flex items-center gap-1.5">
                      {/* 센서 전원 커넥션 ON / OFF */}
                      <button
                        onClick={() => updateNode(door.id, { powerStatus: door.powerStatus === 'OFF' ? 'ON' : 'OFF' })}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 border transition ${
                          door.powerStatus === 'OFF' ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                        }`}
                      >
                        <Power size={10} />
                        {door.powerStatus === 'OFF' ? 'OFF' : 'ON'}
                      </button>

                      {/* 센서 상태 양호 / 점검필요 */}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        door.status === 'NORMAL' ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' : 'bg-red-600/20 text-red-300 border-red-500/40'
                      }`}>
                        {door.status === 'NORMAL' ? '상태양호' : '점검필요'}
                      </span>
                    </div>
                  </div>

                  {/* 4단계 문 상태 및 수동 개폐 조작 */}
                  <div className="grid grid-cols-4 gap-1">
                    {(['LOCKED', 'UNLOCKED', 'OPENED', 'CLOSED'] as DoorState[]).map(state => (
                      <button
                        key={state}
                        onClick={() => updateDoorState(door.id, state)}
                        className={`py-1 text-[9px] font-bold rounded border transition ${
                          door.doorState === state ? 'bg-blue-600 text-white border-blue-400 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        {state === 'LOCKED' ? '잠금' : state === 'UNLOCKED' ? '해제' : state === 'OPENED' ? '열림' : '닫힘'}
                      </button>
                    ))}
                  </div>

                  {/* 도어클로저 닫힘 시간 조정 (슬라이더 / 버튼) */}
                  <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock size={11} className="text-blue-400" />
                      도어클로저 닫힘 시간:
                    </span>
                    <div className="flex items-center gap-1 font-mono">
                      {[5, 10, 30, 60].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => updateNode(door.id, { autoCloseDelay: sec })}
                          className={`px-1.5 py-0.5 rounded border transition ${
                            (door.autoCloseDelay || 10) === sec 
                              ? 'bg-blue-600/40 text-blue-300 border-blue-400 font-bold' 
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          {sec}초
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-slate-500 text-center py-6">비상문 센서가 배치되지 않았습니다.</div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* [서브메뉴 6] 소방점검 이력 (요청사항 7 반영 - 정밀 관리페이지 모달 이동 버튼) */}
        {/* ========================================================================= */}
        {activeTab === 'FIRE_LOG' && (
          <div className="space-y-3">
            <Button
              variant="warning"
              size="sm"
              onClick={() => setFireLogModalOpen(true)}
              className="w-full justify-center py-2 text-xs font-bold border border-amber-400/30"
              icon={<FileSpreadsheet size={14} />}
            >
              📋 소방점검 이력 정밀 관리페이지 이동 (CRUD)
            </Button>

            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
              <span>최근 소방점검 이벤트 (총 {logs.length}건)</span>
              <span className="text-emerald-400 font-bold">365일 관제 중</span>
            </div>

            <div className="space-y-2">
              {logs.slice(0, 5).map(log => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-[11px]">{log.floorId} - {log.category}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                      log.result === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {log.result}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{log.content}</p>
                  <span className="text-[9px] text-slate-500 font-mono block text-right">{log.date} | {log.inspector}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 4. 하단 상태 정보 */}
      <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-[9px] text-slate-400 flex items-center justify-between shrink-0">
        <span>선택 층: <strong className="text-blue-400">{selectedFloor}</strong></span>
        <span>총 센서: <strong className="text-slate-200">{nodes.length}개</strong></span>
      </div>
    </div>
  );
};

// components/sidebar/SensorPalette.tsx
import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSensorStore } from '../../store/useSensorStore';
import { useSensorDrag } from '../../hooks/useSensorDrag';
import { SensorType } from '../../types/sensor';
import { SensorIcon, LockIcon, UnlockIcon, SettingsIcon } from '../common/Icons';
import { Button } from '../common/Button';
import { Plus } from 'lucide-react';

interface PaletteItem {
  type: SensorType;
  name: string;
  desc: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'EXTINGUISHER',
    name: '소화기 센서',
    desc: '10년 무선 마그네틱 핀 이탈 감지',
  },
  {
    type: 'HYDRANT',
    name: '소화전 도어 센서',
    desc: '도어 개폐 상태 실시간 감지',
  },
  {
    type: 'WATER_PRESSURE',
    name: '배관 수압 센서',
    desc: '디지털 배관 수압(Bar) 실시간 계측',
  },
  {
    type: 'ARC',
    name: '아크(Arc) 차단 센서',
    desc: 'EPS실 스파크/차단기 아크 감지',
  },
  {
    type: 'LEAK',
    name: '선형 누수 센서',
    desc: '누수 감지 테이프 수분 반응 감지',
  },
  {
    type: 'EMERGENCY_DOOR',
    name: '비상구 도어 센서',
    desc: '방화문 개폐 및 자동개폐기 상태 연동',
  },
  {
    type: 'CCTV',
    name: 'AI CCTV 카메라',
    desc: 'CCTV FOV 제어 및 AI 정면 인물 캡처',
  },
  {
    type: 'CUSTOM',
    name: '커스텀 신규 센서',
    desc: '사용자 지정 신규 센서 및 이모지 노드',
  }
];

export const SensorPalette: React.FC = () => {
  const { isLocked, setLocked, setSensorManageModalOpen } = useCanvasStore();
  const { nodes } = useSensorStore();
  const { handleDragStart } = useSensorDrag();

  // 등록된 커스텀 센서 노드 추출
  const customNodes = nodes.filter(n => n.type === 'CUSTOM' || n.customEmoji);

  return (
    <div className="w-[260px] md:w-[270px] h-full flex flex-col glass-panel border-l border-slate-800/80 p-3 select-none overflow-y-auto shrink-0 box-border z-20">
      {/* 타이틀 및 점검/이동 모드 잠금 제어부 */}
      <div className="mb-4 pb-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-slate-400" size={20} />
            <h2 className="text-base font-bold text-slate-100">센서 장치 팔레트</h2>
          </div>
        </div>

        {/* 신규 커스텀 센서 등록 모달 오픈 버튼 (요청사항 4 반영) */}
        <Button
          variant="primary"
          size="sm"
          className="w-full justify-center text-xs py-2 font-bold border border-blue-500/30"
          onClick={() => setSensorManageModalOpen(true)}
          icon={<Plus size={14} />}
        >
          + 신규 센서/노드 등록 (CRUD)
        </Button>

        {/* 점검 모드 스위치 버튼 */}
        <Button
          variant={isLocked ? "glass" : "warning"}
          className="w-full justify-center transition-all duration-300 py-2 text-xs font-bold"
          onClick={() => setLocked(!isLocked)}
          icon={isLocked ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
        >
          {isLocked ? "센서 배치 잠금 상태" : "점검 모드 (배치 가능)"}
        </Button>
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          {isLocked 
            ? "센서 배치 및 이동이 잠겨있습니다. [점검 모드]를 클릭해 드래그를 활성화하십시오." 
            : "팔레트에서 센서를 드래그하여 도면 위에 놓고 위치를 조정하십시오."}
        </p>
      </div>

      {/* 등록된 신규 커스텀 센서가 있을 경우 상단 표출 */}
      {customNodes.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-xs font-bold text-emerald-400 flex items-center justify-between">
            <span>등록된 커스텀 센서 목록</span>
            <span className="text-[10px] font-mono font-normal text-slate-400">({customNodes.length}개)</span>
          </h3>

          <div className="space-y-1.5">
            {customNodes.map(cNode => (
              <div
                key={cNode.id}
                draggable={!isLocked}
                onDragStart={(e) => handleDragStart(e, cNode.type)}
                className={`flex items-center gap-2.5 p-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-xs transition ${
                  isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-emerald-900/40 cursor-grab active:cursor-grabbing'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-900/50 border border-emerald-500/40 flex items-center justify-center text-sm">
                  {cNode.customEmoji || '🔥'}
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-slate-200 text-[11px] truncate">{cNode.name || '커스텀 센서'}</h5>
                  <span className="text-[9px] text-slate-400 font-mono block truncate">층: {cNode.floorId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8대 기본 소방 센서 드래그 장치 리스트 */}
      <div className="flex-1 space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-400 mb-1">드래그 가능한 표준 소방 노드</h3>
        {PALETTE_ITEMS.map((item) => (
          <div
            key={item.type}
            draggable={!isLocked}
            onDragStart={(e) => handleDragStart(e, item.type)}
            className={`flex items-center gap-3 p-2.5 rounded-lg border border-slate-800/60 bg-slate-900/40 transition-all duration-200 ${
              isLocked 
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-slate-800/50 hover:border-slate-700/80 cursor-grab active:cursor-grabbing hover:translate-x-1'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              isLocked 
                ? 'bg-slate-800 text-slate-500' 
                : item.type === 'CCTV' 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                  : item.type === 'CUSTOM'
                    ? 'bg-amber-600/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              <SensorIcon type={item.type} size={18} />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed">
        <span>새로운 센서 종류 및 노드는 [신규 센서/노드 등록] 버튼을 눌러 모달에서 관리할 수 있습니다.</span>
      </div>
    </div>
  );
};

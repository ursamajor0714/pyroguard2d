// components/modals/EvChargerManageModal.tsx
import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useEvChargerStore, ChargerStatus } from '../../store/useEvChargerStore';
import { Button } from '../common/Button';
import { 
  X, 
  Zap, 
  Plus, 
  Trash2, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Flame,
  Activity,
  Archive
} from 'lucide-react';

export const EvChargerManageModal: React.FC = () => {
  const { isEvChargerModalOpen, setEvChargerModalOpen } = useCanvasStore();
  const { chargers, addCharger, updateChargerStatus, deleteCharger } = useEvChargerStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // 신규 충전기 설치 폼 상태
  const [formName, setFormName] = useState('');
  const [formPowerKw, setFormPowerKw] = useState(100);
  const [formType, setFormType] = useState<'FAST' | 'SLOW'>('FAST');
  const [formLocation, setFormLocation] = useState('B2-Zone A');

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEvChargerModalOpen) {
        setEvChargerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEvChargerModalOpen, setEvChargerModalOpen]);

  if (!isEvChargerModalOpen) return null;

  const handleSubmitNewCharger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('충전기 명칭을 입력하십시오.');
      return;
    }

    addCharger({
      name: formName,
      type: formType,
      powerKw: Number(formPowerKw),
      status: 'STANDBY',
      tempC: 25.0,
      location: formLocation
    });

    setFormName('');
    setFormPowerKw(100);
    setFormLocation('B2-Zone A');
  };

  const filteredChargers = chargers.filter(c => {
    const matchSearch = c.name.includes(searchTerm) || c.id.includes(searchTerm) || c.location.includes(searchTerm);
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const chargingCount = chargers.filter(c => c.status === 'CHARGING').length;
  const standbyCount = chargers.filter(c => c.status === 'STANDBY').length;
  const maintenanceCount = chargers.filter(c => c.status === 'MAINTENANCE').length;
  const discardedCount = chargers.filter(c => c.status === 'DISCARDED').length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none p-4"
      onClick={() => setEvChargerModalOpen(false)}
    >
      <div 
        className="w-[980px] max-h-[90vh] glass-panel border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative bg-[#090e1a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 tracking-wide">
                B2 지하 2층 전기차 충전 구역 종합 관리 센터
              </h2>
              <p className="text-[10px] text-slate-400">
                실시간 충전기 작동 상태 표출, 점검 처리, 폐기/철거 및 신규 충전기 증설 관리 (CRUD)
              </p>
            </div>
          </div>

          <button
            onClick={() => setEvChargerModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 cursor-pointer"
            title="닫기 (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {/* 1. 종합 상태 요약 대시보드 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="glass-panel p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs">
              <span className="text-[10px] text-emerald-400 font-bold block">급속 충전 중</span>
              <span className="text-xl font-extrabold text-emerald-300 font-mono">{chargingCount}대</span>
              <span className="text-[9px] text-slate-400 block mt-1">평균 모듈 온도 38.2°C</span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-blue-500/30 bg-blue-950/20 text-xs">
              <span className="text-[10px] text-blue-400 font-bold block">충전 대기 중</span>
              <span className="text-xl font-extrabold text-blue-300 font-mono">{standbyCount}대</span>
              <span className="text-[9px] text-slate-400 block mt-1">즉시 충전 가능</span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs">
              <span className="text-[10px] text-amber-400 font-bold block">점검 처리 중</span>
              <span className="text-xl font-extrabold text-amber-300 font-mono">{maintenanceCount}대</span>
              <span className="text-[9px] text-slate-400 block mt-1">점검 및 정비 진행</span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-700 bg-slate-900/60 text-xs">
              <span className="text-[10px] text-slate-400 font-bold block">폐기 / 철거 완료</span>
              <span className="text-xl font-extrabold text-slate-400 font-mono">{discardedCount}대</span>
              <span className="text-[9px] text-slate-500 block mt-1">노후 기기 철거</span>
            </div>
          </div>

          {/* 2. 신규 충전기 증설/설치 폼 */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Plus size={14} className="text-emerald-400" />
              <span>신규 전기차 충전기 증설 및 등록</span>
            </h3>

            <form onSubmit={handleSubmitNewCharger} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">충전기 명칭</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: B2-G구역 초급속 200kW #16"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">충전 방식</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as 'FAST' | 'SLOW')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="FAST">급속 충전기</option>
                  <option value="SLOW">완속 충전기</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">용량 (kW)</label>
                <input
                  type="number"
                  value={formPowerKw}
                  onChange={(e) => setFormPowerKw(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="success"
                  className="w-full justify-center text-xs py-2 font-bold"
                  icon={<Plus size={14} />}
                >
                  충전기 신규 설치 등록
                </Button>
              </div>
            </form>
          </div>

          {/* 3. 검색 및 필터 바 */}
          <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search size={14} className="text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="충전기 ID, 명칭, 구역 검색..."
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[10px]">상태 필터:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs"
              >
                <option value="ALL">전체 ({chargers.length}대)</option>
                <option value="CHARGING">충전 중</option>
                <option value="STANDBY">대기 중</option>
                <option value="MAINTENANCE">점검 중</option>
                <option value="DISCARDED">폐기/철거</option>
              </select>
            </div>
          </div>

          {/* 4. 충전기 상세 관리 리스트 */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-3 py-3">충전기 명칭</th>
                  <th className="px-3 py-3">구역</th>
                  <th className="px-3 py-3 text-center">용량 / 방식</th>
                  <th className="px-3 py-3 text-center">작동 상태</th>
                  <th className="px-4 py-3 text-right">점검 / 폐기 / 삭제 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {filteredChargers.map(charger => (
                  <tr key={charger.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-xs">
                      {charger.id}
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-100">
                      {charger.name}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-400">
                      {charger.location}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-blue-400">
                      {charger.powerKw}kW ({charger.type === 'FAST' ? '급속' : '완속'})
                    </td>
                    <td className="px-3 py-3 text-center">
                      {charger.status === 'CHARGING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                          <Zap size={10} />
                          충전 중 ({charger.tempC}°C)
                        </span>
                      ) : charger.status === 'STANDBY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <CheckCircle2 size={10} />
                          대기 중
                        </span>
                      ) : charger.status === 'MAINTENANCE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Wrench size={10} />
                          점검 처리
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/40 text-slate-400 border border-slate-600">
                          <Archive size={10} />
                          폐기/철거
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {charger.status !== 'MAINTENANCE' && (
                          <button
                            onClick={() => updateChargerStatus(charger.id, 'MAINTENANCE')}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="점검 처리로 전환"
                          >
                            <Wrench size={10} />
                            <span>점검 처리</span>
                          </button>
                        )}

                        {charger.status !== 'DISCARDED' && (
                          <button
                            onClick={() => updateChargerStatus(charger.id, 'DISCARDED')}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="폐기 및 철거 처리"
                          >
                            <Archive size={10} />
                            <span>폐기/철거</span>
                          </button>
                        )}

                        {(charger.status === 'MAINTENANCE' || charger.status === 'DISCARDED') && (
                          <button
                            onClick={() => updateChargerStatus(charger.id, 'STANDBY')}
                            className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="정상 가동 복구"
                          >
                            <CheckCircle2 size={10} />
                            <span>정상 복구</span>
                          </button>
                        )}

                        <button
                          onClick={() => deleteCharger(charger.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition rounded"
                          title="항목 삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

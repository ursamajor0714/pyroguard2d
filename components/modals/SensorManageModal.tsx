// components/modals/SensorManageModal.tsx
import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSensorStore } from '../../store/useSensorStore';
import { SensorType, SensorStatus, SensorNode } from '../../types/sensor';
import { FLOOR_LIST, FloorId } from '../../types/floor';
import { Button } from '../common/Button';
import { SensorIcon } from '../common/Icons';
import { X, Plus, Search, Trash2, Edit, Settings } from 'lucide-react';

export const SensorManageModal: React.FC = () => {
  const { isSensorManageModalOpen, setSensorManageModalOpen, selectedFloor } = useCanvasStore();
  const { nodes, addNode, updateNode, deleteNode } = useSensorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloor, setFilterFloor] = useState<string>('ALL');

  // 등록 / 수정 폼 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<SensorType>('EXTINGUISHER');
  const [formFloor, setFormFloor] = useState<FloorId>(selectedFloor);
  const [formX, setFormX] = useState<number>(50);
  const [formY, setFormY] = useState<number>(50);
  const [formStatus, setFormStatus] = useState<SensorStatus>('NORMAL');
  const [formEmoji, setFormEmoji] = useState('🧯');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSensorManageModalOpen) {
        setSensorManageModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSensorManageModalOpen, setSensorManageModalOpen]);

  if (!isSensorManageModalOpen) return null;

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName('');
    setFormType('EXTINGUISHER');
    setFormFloor(selectedFloor);
    setFormX(50);
    setFormY(50);
    setFormStatus('NORMAL');
    setFormEmoji('🧯');
  };

  const handleStartEdit = (node: SensorNode) => {
    setIsEditing(true);
    setEditingId(node.id);
    setFormName(node.name || '');
    setFormType(node.type);
    setFormFloor(node.floorId as FloorId);
    setFormX(node.x);
    setFormY(node.y);
    setFormStatus(node.status);
    setFormEmoji(node.customEmoji || '🔥');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && editingId) {
      updateNode(editingId, {
        name: formName,
        type: formType,
        floorId: formFloor,
        x: Number(formX),
        y: Number(formY),
        status: formStatus,
        customEmoji: formEmoji
      });
    } else {
      const newId = `sensor-custom-${crypto.randomUUID()}`;
      addNode({
        id: newId,
        name: formName || '신규 등록 소방 센서',
        type: formType,
        floorId: formFloor,
        x: Number(formX),
        y: Number(formY),
        status: formStatus,
        customEmoji: formEmoji,
        updatedAt: new Date().toISOString()
      });
    }

    resetForm();
  };

  const filteredNodes = nodes.filter(node => {
    const matchSearch = 
      (node.name && node.name.includes(searchTerm)) || 
      node.id.includes(searchTerm) || 
      node.type.includes(searchTerm);

    const matchFloor = filterFloor === 'ALL' || node.floorId === filterFloor;
    return matchSearch && matchFloor;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none p-4"
      onClick={() => setSensorManageModalOpen(false)}
    >
      <div 
        className="w-[960px] max-h-[90vh] glass-panel border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative bg-[#090e1a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 tracking-wide">
                소방 센서 관리 & 새로운 센서 등록 (CRUD)
              </h2>
              <p className="text-[10px] text-slate-400">
                기존 센서 노드 및 새로운 타입/이모지 커스텀 센서를 도면에 직접 등록, 수정, 삭제 관리합니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSensorManageModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 cursor-pointer"
            title="닫기 (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {/* 등록 및 수정 폼 */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                {isEditing ? <Edit size={14} className="text-amber-400" /> : <Plus size={14} className="text-blue-400" />}
                <span>{isEditing ? '센서 노드 정보 수정' : '새로운 센서 노드 신규 등록'}</span>
              </h3>
              {isEditing && (
                <button type="button" onClick={resetForm} className="text-[10px] text-slate-400 hover:text-slate-200 underline">
                  수정 취소
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">센서 명칭</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: 1F 특수 소화기 A"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">센서 종류</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as SensorType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="EXTINGUISHER">소화기 센서</option>
                  <option value="HYDRANT">소화전 도어 센서</option>
                  <option value="WATER_PRESSURE">배관 수압 센서</option>
                  <option value="ARC">아크 차단 센서</option>
                  <option value="LEAK">선형 누수 센서</option>
                  <option value="EMERGENCY_DOOR">비상구 도어 센서</option>
                  <option value="CCTV">AI CCTV 카메라</option>
                  <option value="CUSTOM">신규 커스텀 센서</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">설치 층</label>
                <select
                  value={formFloor}
                  onChange={(e) => setFormFloor(e.target.value as FloorId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {FLOOR_LIST.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.fullName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">초기 상태</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as SensorStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="NORMAL">NORMAL (정상)</option>
                  <option value="MAINTENANCE">MAINTENANCE (점검중)</option>
                  <option value="ALARM">ALARM (경보)</option>
                  <option value="OFFLINE">OFFLINE (통신장애)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">X 좌표 (%): {formX}%</label>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={formX}
                  onChange={(e) => setFormX(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">Y 좌표 (%): {formY}%</label>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={formY}
                  onChange={(e) => setFormY(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">커스텀 이모지</label>
                <input
                  type="text"
                  value={formEmoji}
                  onChange={(e) => setFormEmoji(e.target.value)}
                  placeholder="예: 🧯 🚨 📹 🚪 ⚡"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  variant={isEditing ? "warning" : "primary"}
                  className="w-full justify-center text-xs py-2 font-bold"
                  icon={isEditing ? <Edit size={14} /> : <Plus size={14} />}
                >
                  {isEditing ? '센서 수정 저장' : '센서 신규 배치'}
                </Button>
              </div>
            </form>
          </div>

          {/* 노드 데이터 목록 */}
          <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search size={14} className="text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="센서 이름, ID, 종류 검색..."
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[10px]">층 필터:</span>
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs"
              >
                <option value="ALL">전체 층 ({nodes.length}개)</option>
                {FLOOR_LIST.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 노드 카드 테이블 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredNodes.map(node => (
              <div key={node.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">
                    {node.customEmoji || <SensorIcon type={node.type} size={16} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{node.name || `${node.type} 노드`}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      층: {node.floorId} | 좌표: ({node.x.toFixed(0)}%, {node.y.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    node.status === 'ALARM' ? 'bg-red-600 text-white' : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {node.status}
                  </span>
                  <button onClick={() => handleStartEdit(node)} className="p-1 text-slate-400 hover:text-amber-300 transition">
                    <Edit size={13} />
                  </button>
                  <button onClick={() => deleteNode(node.id)} className="p-1 text-slate-400 hover:text-red-400 transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

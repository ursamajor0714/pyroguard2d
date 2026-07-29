// components/modals/FireLogManageModal.tsx
import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useFireLogStore } from '../../store/useFireLogStore';
import { FireLogEntry, InspectionResult } from '../../types/fireLog';
import { FLOOR_LIST } from '../../types/floor';
import { Button } from '../common/Button';
import { 
  X, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Trash2, 
  Edit, 
  FileText,
  Calendar,
  User,
  Filter
} from 'lucide-react';

export const FireLogManageModal: React.FC = () => {
  const { isFireLogModalOpen, setFireLogModalOpen } = useCanvasStore();
  const { logs, addLog, updateLog, deleteLog } = useFireLogStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloor, setFilterFloor] = useState('ALL');
  const [filterResult, setFilterResult] = useState('ALL');

  // 등록/수정 폼 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formFloor, setFormFloor] = useState('1F');
  const [formCategory, setFormCategory] = useState('경보설비/CCTV');
  const [formContent, setFormContent] = useState('');
  const [formInspector, setFormInspector] = useState('');
  const [formResult, setFormResult] = useState<InspectionResult>('PASS');
  const [formNotes, setFormNotes] = useState('');

  // ESC 키 눌렀을 때 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFireLogModalOpen) {
        setFireLogModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFireLogModalOpen, setFireLogModalOpen]);

  if (!isFireLogModalOpen) return null;

  // 폼 초기화
  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormFloor('1F');
    setFormCategory('경보설비/CCTV');
    setFormContent('');
    setFormInspector('');
    setFormResult('PASS');
    setFormNotes('');
  };

  // 수정 버튼 클릭 시
  const handleStartEdit = (entry: FireLogEntry) => {
    setIsEditing(true);
    setEditingId(entry.id);
    setFormDate(entry.date);
    setFormFloor(entry.floorId);
    setFormCategory(entry.category);
    setFormContent(entry.content);
    setFormInspector(entry.inspector);
    setFormResult(entry.result);
    setFormNotes(entry.notes || '');
  };

  // 폼 제출 (추가 또는 수정)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim() || !formInspector.trim()) {
      alert('점검 내용과 담당자 성함을 작성해 주십시오.');
      return;
    }

    if (isEditing && editingId) {
      updateLog(editingId, {
        date: formDate,
        floorId: formFloor,
        category: formCategory,
        content: formContent,
        inspector: formInspector,
        result: formResult,
        notes: formNotes
      });
    } else {
      addLog({
        date: formDate,
        floorId: formFloor,
        category: formCategory,
        content: formContent,
        inspector: formInspector,
        result: formResult,
        notes: formNotes
      });
    }

    resetForm();
  };

  // 필터링된 로그 목록
  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      log.content.includes(searchTerm) || 
      log.inspector.includes(searchTerm) || 
      log.category.includes(searchTerm);
    
    const matchFloor = filterFloor === 'ALL' || log.floorId === filterFloor;
    const matchResult = filterResult === 'ALL' || log.result === filterResult;

    return matchSearch && matchFloor && matchResult;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none p-4"
      onClick={() => setFireLogModalOpen(false)}
    >
      {/* 모달 본체 */}
      <div 
        className="w-[980px] max-h-[90vh] glass-panel border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative bg-[#090e1a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 tracking-wide">
                소방점검 이력 정밀 관리 센터 (365일 관제 CRUD)
              </h2>
              <p className="text-[10px] text-slate-400">
                소방시설법 제22조 자체점검 공백 보완 — 실시간 이력 신규 등록, 수정 및 삭제 관리
              </p>
            </div>
          </div>

          <button
            onClick={() => setFireLogModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 cursor-pointer"
            title="닫기 (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* 폼 및 필터 바 */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {/* 1. 신규 등록 / 수정 작성 폼 카드 */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                {isEditing ? <Edit size={14} className="text-amber-400" /> : <Plus size={14} className="text-blue-400" />}
                <span>{isEditing ? '점검 이력 항목 수정' : '신규 점검 이력 작성'}</span>
              </h3>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                >
                  수정 취소
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">점검 일자</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">점검 층</label>
                <select
                  value={formFloor}
                  onChange={(e) => setFormFloor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {FLOOR_LIST.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.fullName})</option>
                  ))}
                  <option value="전체">건물 전체</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">점검 분야</label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="예: 비상문/알람밸브"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">점검 담당자</label>
                <input
                  type="text"
                  value={formInspector}
                  onChange={(e) => setFormInspector(e.target.value)}
                  placeholder="담당자 이름"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">점검 상세 내용</label>
                <input
                  type="text"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="점검 내용 및 계측 수치 기록"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold mb-1 block">점검 결과</label>
                <select
                  value={formResult}
                  onChange={(e) => setFormResult(e.target.value as InspectionResult)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="PASS">PASS (합격 / 양호)</option>
                  <option value="WARNING">WARNING (보완 필요)</option>
                  <option value="FAIL">FAIL (불합격 / 즉시 조치)</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  variant={isEditing ? "warning" : "primary"}
                  className="w-full justify-center text-xs py-2 font-bold"
                  icon={isEditing ? <Edit size={14} /> : <Plus size={14} />}
                >
                  {isEditing ? '이력 수정 저장' : '새 이력 등록'}
                </Button>
              </div>
            </form>
          </div>

          {/* 2. 검색 및 서치 필터 바 */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search size={14} className="text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="점검 내용, 담당자, 분야 검색..."
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[10px]">결과 필터:</span>
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs"
              >
                <option value="ALL">전체 결과</option>
                <option value="PASS">합격 (PASS)</option>
                <option value="WARNING">보완필요 (WARNING)</option>
                <option value="FAIL">불합격 (FAIL)</option>
              </select>
            </div>
          </div>

          {/* 3. 소방점검 이력 데이터 테이블 */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">일자</th>
                  <th className="px-3 py-3">층</th>
                  <th className="px-3 py-3">분야</th>
                  <th className="px-4 py-3">점검 내용</th>
                  <th className="px-3 py-3">담당자</th>
                  <th className="px-3 py-3 text-center">결과</th>
                  <th className="px-3 py-3 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-slate-400 text-[11px] shrink-0">
                        {log.date}
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-200">
                        {log.floorId}
                      </td>
                      <td className="px-3 py-3 text-blue-400 font-semibold">
                        {log.category}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-slate-100">{log.content}</span>
                        {log.notes && <span className="text-[10px] text-slate-500 block mt-0.5">{log.notes}</span>}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {log.inspector}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {log.result === 'PASS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 size={10} />
                            PASS
                          </span>
                        ) : log.result === 'WARNING' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <AlertTriangle size={10} />
                            보완필요
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                            <XCircle size={10} />
                            FAIL
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(log)}
                            className="p-1 text-slate-400 hover:text-amber-300 transition rounded"
                            title="이력 수정"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => deleteLog(log.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition rounded"
                            title="이력 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                      검색 조건에 맞는 소방 점검 이력이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

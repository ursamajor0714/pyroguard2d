// types/fireLog.ts

export type InspectionResult = 'PASS' | 'WARNING' | 'FAIL';

export interface FireLogEntry {
  id: string;
  date: string;          // 점검 일자 (YYYY-MM-DD)
  floorId: string;       // 점검 층 ID (B3 ~ 17F, ROOF, 건물전체)
  inspector: string;     // 점검 담당자
  category: string;      // 점검 분야 (소화기계통, 비상구자동개폐기, 전기아크/EPS, 배관수압)
  content: string;       // 점검 항목 및 정밀 측정 내용
  result: InspectionResult; // 점검 결과 (PASS: 합격/양호, WARNING: 보완필요, FAIL: 불합격/불량)
  notes?: string;        // 후속 조치 및 조치 사항 메모
  createdAt: string;     // 생성 일시
}

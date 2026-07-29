// hooks/useSensorDrag.ts
import { DragEvent } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { useSensorStore } from '../store/useSensorStore';
import { SensorType, SensorNode } from '../types/sensor';

export const useSensorDrag = () => {
  const { 
    selectedFloor, 
    isLocked 
  } = useCanvasStore();
  
  const { 
    addNode, 
    updateNode, 
    deleteNode 
  } = useSensorStore();

  // 1. Staging Dock에서 센서 아이콘 드래그 시작 시
  const handleDragStart = (e: DragEvent<HTMLDivElement>, type: SensorType) => {
    e.dataTransfer.setData('sensorType', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 2. 도면 캔버스 위에 마우스 오버 시 drop을 허용하도록 처리
  const handleDragOver = (e: DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 3. Staging Dock에서 도면으로 신규 드롭 시 좌표 연산 및 노드 추가
  const handleDrop = (e: DragEvent<SVGSVGElement>, svgRef: SVGSVGElement | null) => {
    e.preventDefault();
    if (!svgRef) return;
    
    // 점검 모드(잠금 해제)가 아닐 경우 배치 차단
    if (isLocked) {
      alert("점검 모드(좌측 상단 '센서 잠금 해제')를 활성화해야 센서를 배치할 수 있습니다.");
      return;
    }

    const type = e.dataTransfer.getData('sensorType') as SensorType;
    if (!type) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    // SVG CTM 행렬 변환을 통한 도면 내 1200x800 좌표계 100% 정확환산
    const containerG = (svgRef.querySelector('[data-canvas-container="true"]') || svgRef.querySelector('g')) as SVGGraphicsElement | null;
    let xPercent = 50;
    let yPercent = 50;

    if (containerG && svgRef.createSVGPoint) {
      const pt = svgRef.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = containerG.getScreenCTM()?.inverse();
      if (ctm) {
        const cursorPt = pt.matrixTransform(ctm);
        xPercent = (cursorPt.x / 1200) * 100;
        yPercent = (cursorPt.y / 800) * 100;
      }
    }

    // 도면 외곽 영역 이탈 체크
    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) {
      alert("도면 바깥 영역에는 센서를 배치할 수 없습니다.");
      return;
    }

    const newNodeId = `sensor-${crypto.randomUUID()}`;
    const newNode: SensorNode = {
      id: newNodeId,
      type,
      floorId: selectedFloor,
      x: xPercent,
      y: yPercent,
      status: 'NORMAL',
      updatedAt: new Date().toISOString(),
      // 타입별 기본 세팅
      ...(type === 'CCTV' ? { fov: { distance: 12, angle: 95, rotation: 90 } } : {}),
      ...(type === 'EMERGENCY_DOOR' ? { doorState: 'LOCKED' } : {}),
      ...(type === 'WATER_PRESSURE' ? { value: 3.2 } : {}), // 기본 3.2 Bar
      ...(type === 'ARC' ? { value: 0 } : {}),             // 기본 아크 검출 0회
    };

    addNode(newNode);
  };

  // 4. 이미 도면에 배치된 노드를 드래그하여 이동 또는 도면 외곽 드롭 시 수거(삭제)
  const handleNodeDragEnd = (
    id: string,
    clientX: number,
    clientY: number,
    svgRef: SVGSVGElement | null
  ) => {
    if (!svgRef || isLocked) return;

    const containerG = (svgRef.querySelector('[data-canvas-container="true"]') || svgRef.querySelector('g')) as SVGGraphicsElement | null;
    let xPercent = 50;
    let yPercent = 50;

    if (containerG && svgRef.createSVGPoint) {
      const pt = svgRef.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = containerG.getScreenCTM()?.inverse();
      if (ctm) {
        const cursorPt = pt.matrixTransform(ctm);
        xPercent = (cursorPt.x / 1200) * 100;
        yPercent = (cursorPt.y / 800) * 100;
      }
    }

    // 도면 바깥으로 노드가 던져질 시 Staging Dock으로 자동 수거(삭제 처리)
    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) {
      deleteNode(id);
      return;
    }

    updateNode(id, {
      x: xPercent,
      y: yPercent
    });
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleNodeDragEnd
  };
};

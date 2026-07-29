// lib/utils/canvasMath.ts

/**
 * 도(degree) 단위를 라디안(radian) 단위로 변환합니다.
 */
export const degToRad = (deg: number): number => {
  return (deg * Math.PI) / 180;
};

/**
 * 라디안(radian) 단위를 도(degree) 단위로 변환합니다.
 */
export const radToDeg = (rad: number): number => {
  return (rad * 180) / Math.PI;
};

/**
 * 중심 좌표(cx, cy)와 각도, 거리를 기반으로 직교 좌표(x, y)를 구합니다.
 * @param cx 중심 X
 * @param cy 중심 Y
 * @param distance 거리
 * @param angleInDegrees 각도 (degree, 0도는 3시 방향, 시계방향 회전)
 */
export const polarToCartesian = (
  cx: number,
  cy: number,
  distance: number,
  angleInDegrees: number
): { x: number; y: number } => {
  const rad = degToRad(angleInDegrees);
  return {
    x: cx + distance * Math.cos(rad),
    y: cy + distance * Math.sin(rad),
  };
};

/**
 * CCTV FOV의 반투명 부채꼴을 그리기 위한 SVG Path 데이터 스트링을 생성합니다.
 * @param cx 센서 중심 X (상대 % 혹은 px)
 * @param cy 센서 중심 Y (상대 % 혹은 px)
 * @param distance 시야 거리
 * @param angle 화각 (30deg ~ 180deg)
 * @param rotation 회전 중심 방위각 (0deg ~ 360deg)
 */
export const getFovPath = (
  cx: number,
  cy: number,
  distance: number,
  angle: number,
  rotation: number
): string => {
  // 시작 각도와 끝 각도 계산 (기존 0도는 3시 방향이 기준)
  // rotation이 정면 방향이므로, rotation - angle/2 가 시작각, rotation + angle/2 가 끝각
  const startAngle = rotation - angle / 2;
  const endAngle = rotation + angle / 2;

  // 시작점과 끝점 좌표 구하기
  const startPt = polarToCartesian(cx, cy, distance, startAngle);
  const endPt = polarToCartesian(cx, cy, distance, endAngle);

  // 화각이 180도보다 크면 largeArcFlag를 1로 지정 (우리는 30~180 범위이므로 기본 0)
  const largeArcFlag = angle > 180 ? 1 : 0;

  // SVG Path 정의
  // M: 시작점으로 이동 (중심점 cx, cy)
  // L: 호의 시작점(startPt)까지 직선 그리기
  // A: 반지름 distance인 호(Arc)를 endPt까지 그리기
  // Z: 중심점(cx, cy)으로 되돌아가 닫기
  return `M ${cx} ${cy} L ${startPt.x} ${startPt.y} A ${distance} ${distance} 0 ${largeArcFlag} 1 ${endPt.x} ${endPt.y} Z`;
};

/**
 * 두 점 사이의 픽셀 거리 및 11시 방향 기준(또는 3시 방향 기준) 각도를 계산합니다.
 * 드래그 앤 드롭 핸들 이동에 유용합니다.
 */
export const calculateDistanceAndAngle = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { distance: number; angle: number } => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Math.atan2는 라디안 값을 -PI ~ PI로 반환함
  let angle = radToDeg(Math.atan2(dy, dx));
  
  // 0 ~ 360도 범위로 보정
  if (angle < 0) {
    angle += 360;
  }
  
  return { distance, angle };
};

/**
 * 입력값을 특정 단위로 Snap 처리합니다.
 * @param val 입력값
 * @param step Snap 단계 (예: 15도 단위, 45도 단위 등)
 */
export const snapValue = (val: number, step: number): number => {
  return Math.round(val / step) * step;
};

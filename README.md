# PyroGuard 2D

2D CAD 도면 위에서 빌딩 소방 설비를 실시간 관제하는 방재 시스템입니다.
지상 17층 / 지하 3층, 164개 소방 노드를 한 화면에서 감시하고 119 출동 시 인명 위치를 연동합니다.

🎥 [CCTV 라이브 피드 시연 영상](CCTV%20%EC%8B%9C%EC%97%B0%20%EC%98%81%EC%83%81.mp4)

![기술 스택](pyroguard2d_tech_stack.png)

## 스택

Next.js 16 (App Router) · React 19 · TypeScript 5 · Zustand · D3-Zoom · hls.js · Tailwind CSS 4 · Framer Motion

프론트와 REST API를 한 저장소에서 운영했고, 외부 DB 없이 인메모리 저장소로 동작합니다.

## 주요 기능

| 기능 | 구현 방법 |
|---|---|
| 2D 도면 관제 | 1200×800 SVG 좌표계, `getScreenCTM()` 역변환으로 센서 노드 드래그 배치 |
| 2.5D 건물 조감도 | CSS `perspective` + `rotate`로 21개 구역 경보 상태 조망 |
| CCTV 시야각(FOV) | 삼각함수 기반 부채꼴 렌더링, 거리·화각·회전 스냅 조작 |
| 라이브 비디오월 | hls.js / iframe 기반 2×2~4×4 다채널, 채널별 90° 단위 회전 보정 |
| 119 인명 관제 | 평시 위치 마스킹, 6자리 OTP 승인 후에만 해독 · 종료 시 즉시 재마스킹 |
| EV 충전기 / 점검 이력 | B2 충전기 15대 상태 관리, 소방점검 이력 다중 필터 |

## 구조

```
app/api/      REST API — sensors(CRUD) · floors(상태 집계) · emergency(OTP)
components/   canvas · modals · sidebar · common
store/        Zustand 5개 — canvas · sensor · occupant · evCharger · fireLog
lib/          캔버스 좌표 계산 유틸
```

![DB 구조](db_architecture.png)
![ERD](erd_diagram.png)

## 실행

```bash
npm install
npm run dev
```

http://localhost:3000 · 모바일 데모 `/mobile-demo` · 데모 OTP `119119`

## 문서

[기획서](%EA%B8%B0%ED%9A%8D%EC%84%9C.txt) · [아키텍처 구조](%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98%20%EA%B5%AC%EC%A1%B0.txt) · [API 기능 정의서](API_%EA%B8%B0%EB%8A%A5_%EC%A0%95%EC%9D%98%EC%84%9C.txt) · [전체 기능 리뷰](%EC%A0%84%EC%B2%B4%20%EA%B5%AC%EC%A1%B0%20%EB%B0%8F%20%EA%B8%B0%EB%8A%A5%20%EB%A6%AC%EB%B7%B0%20-%20%ED%95%9C%EA%B8%80%EC%9A%94%EC%95%BD%EB%B3%B8.txt)

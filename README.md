# LogiSquare — 스마트 창고 관제 시스템

관리자와 현장 작업자가 함께 쓰는 창고 운영 대시보드입니다. 입고 배치, 재고 현황, 출고, 작업자 호출, 안전 위반 모니터링, 근태 관리를 한 화면에서 처리합니다.

**안전 관리(SafetyPage) 화면을 제외한 전체 기능이 실제 백엔드(`https://logisquare.p-e.kr`)와 연동되어 있습니다.** 이 문서는 어떤 화면이 어떤 API를 쓰는지, 그리고 실제 연동 과정에서 알게 된 특이사항/제약을 팀원이 빠르게 파악할 수 있도록 정리한 것입니다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 빌드 도구 | Vite 5 |
| 프레임워크 | React 19 + TypeScript |
| 라우팅 | React Router 7 (`BrowserRouter`) |
| 스타일 | Tailwind CSS 4 (`@import "tailwindcss"`, CSS 기반 설정) |
| 상태 관리 | React Context API (전역 store 라이브러리 없음) |
| API 타입 | `openapi-typescript`로 백엔드 Swagger에서 자동 생성 (`src/api/schema.d.ts`) |

```bash
npm install
npm run dev                # http://localhost:5173 (vite.config.ts 프록시로 /api → https://logisquare.p-e.kr)
npm run build               # tsc -b && vite build
npm run generate-api-types   # 백엔드 최신 Swagger로 src/api/schema.d.ts 재생성
```

**로그인**은 실제 백엔드 계정으로만 인증됩니다 (로컬 데모/하드코딩 계정 없음). 계정은 백엔드 팀원에게 문의하세요.

> 로그인 세션은 `sessionStorage`에 저장됩니다. **새로고침(F5)해도 로그인이 유지**되고, 탭/브라우저를 닫으면 사라집니다.

배포: main 브랜치에 push하면 GitHub Actions가 자동 빌드 후 서버에 배포합니다 (`.github/workflows/deploy.yml`). 백엔드 API 스펙이 바뀌면 `.github/workflows/sync-api-types.yml`이 감지해서 타입 동기화 PR을 자동으로 올립니다.

---

## 1. 폴더 구조

```
src/
├─ App.tsx                 # 라우트 정의 + 전역 Provider 조립
├─ main.tsx                 # BrowserRouter로 App 마운트
├─ types.ts                 # 도메인 타입 (User, InventorySlot, InventoryItemRecord 등)
├─ index.css                 # Tailwind import
│
├─ api/
│  └─ schema.d.ts             # 백엔드 OpenAPI 스펙에서 자동 생성된 타입 (직접 수정 금지)
│
├─ context/
│  ├─ AuthContext.tsx         # 로그인 세션 (sessionStorage 영속화), 역할(admin/worker)
│  ├─ SafetyContext.tsx       # 안전 위반 로그 — 아직 mock (관련 API 없음)
│  └─ ToastContext.tsx        # 화면 우하단 토스트 알림
│
├─ data/
│  └─ mockData.ts             # GRADE_COLOR, SafetyContext용 mock 위반 이력만 남음
│
├─ components/
│  ├─ Layout.tsx               # 좌측 사이드바(모바일은 햄버거) + 역할별 메뉴
│  ├─ RequireAuth.tsx           # 로그인 가드
│  ├─ WarehouseMap.tsx           # 창고 그리드 지도 — 실제 슬롯 데이터를 prop으로 받음
│  ├─ StatCard.tsx                # 홈 화면 숫자 카드(클릭 시 요약 토글)
│  └─ ConfirmDialog.tsx            # 예/아니오 확인창
│
├─ pages/
│  ├─ LoginPage.tsx                 # 이미 로그인 상태면 /home으로 리다이렉트
│  ├─ HomePage.tsx                   # 대시보드 숫자 4개 + 상세 목록
│  ├─ SafetyPage.tsx                  # mock 데이터 기반 (미연동)
│  ├─ AttendancePage.tsx               # 근태 통계 — 실제 API
│  ├─ CallApprovalPage.tsx              # 작업자: 호출 대기→승인/거절→처리완료
│  └─ logistics/
│     ├─ LogisticsPage.tsx              # 탭 컨테이너 (역할별 탭 분기)
│     ├─ InboundPage.tsx                 # 관리자 전용: 입고 등록 + 작업자 호출
│     ├─ PlacementStatusPage.tsx          # 공통: 배치 지도 + 검색 + 재고 목록 + 출고 지시
│     └─ OutboundPage.tsx                  # 작업자 전용: 출고 등록 + 작업자 호출
│
└─ utils/
   └─ sound.ts                # 안전 위반 발생 시 경고음 (Web Audio API)
```

`InventoryContext`, `CallContext`는 실제 API 연동 후 삭제되어 더 이상 존재하지 않습니다.

---

## 2. 실제 백엔드 API 연동 현황

| API | 메서드 | 사용 화면 |
|---|---|---|
| `/api/auth/login` | POST | 로그인 |
| `/api/dashboard/summary` | GET | 홈 (숫자 4개 + 상세 목록) |
| `/api/attendance/workers/stats?period=` | GET | 근태 관리 |
| `/api/inbound/recommend` | POST | 입고 및 배치 — 추천과 동시에 실제 Item/WorkTask 생성(커밋)까지 한 번에 처리됨. 별도 "저장" 단계 없음 |
| `/api/tasks/{taskId}/inbound-call` | POST | 입고 작업자 호출 — **가용 작업자 전체**를 부름 (응답이 배열) |
| `/api/tasks/{taskId}/outbound-call` | POST | 출고 작업자 호출 — Wi-Fi RSSI 기준 **가장 가까운 작업자 1명**만 부름 (응답이 단일 객체) |
| `/api/outbound` | POST | 출고 등록 — `{ inventoryId, quantity }`로 출고 작업(taskId) 생성 |
| `/api/task-assignments/{assignmentId}/accept`, `/reject` | PATCH | 호출 승인/거절 |
| `/api/tasks/{taskId}/complete` | PATCH | 처리완료 — task 타입에 따라 재고를 **자동으로 가감**함 (입고=추가, 출고=차감) |
| `/api/tasks/my-calls?workerId=` | GET | 호출 승인 페이지, 홈(작업자 "대기 중인 호출" 카드) |
| `/api/inventories/layout`, `/search?itemName=` | GET | 배치 현황(지도+검색+목록), 출고 품목 선택 |
| `/api/dev/wifi-signals/dummy` | POST | **UI에서 호출 안 함** — 개발용 Wi-Fi 더미 신호 주입 (아래 3번 참고) |

---

## 3. 알아두면 좋은 특이사항 / 제약

- **로그인 응답에 `workerId`가 없음.** `User.id`(로그인 계정 PK)와 `Worker.id`(근태·호출 API가 쓰는 PK)가 서로 다른 값이라, `AttendancePage`/`CallApprovalPage`/홈 화면에서는 `/api/attendance/workers/stats`로 전체 작업자를 조회한 뒤 **이름으로 매칭**해서 본인의 `workerId`를 찾아냅니다. 동명이인이 있으면 깨질 수 있는 임시방편입니다.

- **출고 호출은 Wi-Fi 더미 신호가 필요합니다.** `outbound-call`은 Redis에 저장된 Wi-Fi RSSI 신호로 "가장 가까운 작업자"를 계산하는데, 이 신호는 `POST /api/dev/wifi-signals/dummy`로 사람이 직접 넣어야 하고 **최대 TTL이 1시간**(서버 측 제한)이라 주기적으로 재주입해야 합니다. 신호가 없으면 `outbound-call`이 400과 함께 `"No worker Wi-Fi RSSI found for AP-xx"`를 반환하는데, 프론트는 이걸 뭉뚱그려 "현재 가용한 작업자가 없습니다"로 보여줍니다 — 실제로는 작업자가 없는 게 아니라 신호가 만료된 것일 수 있습니다. (반대로 `inbound-call`은 Wi-Fi 신호 없이도 동작합니다 — 가용 작업자 전체를 그냥 부르는 로직이라서요.)

- **대시보드 상세 목록은 최대 5개까지만 내려옵니다.** `/api/dashboard/summary`의 카운트(예: `pendingInboundCount`)는 전체 개수를 정확히 세지만, 상세 배열(`pendingInbounds` 등)은 백엔드에서 `findTop5By...`로 제한되어 있어 최대 5개만 옵니다. 숫자와 목록 길이가 다르면 홈 화면에 "외 N건 더보기" 안내를 표시합니다 (`HomePage.tsx`의 `MoreNote`). 실제로 더 불러오는 기능은 아니고 안내 텍스트일 뿐입니다 — 페이지네이션 API가 생기면 교체 필요.

- **출고 중복 요청 주의.** 같은 재고에 대해 출고 작업을 두 번 만들면(버튼 두 번 클릭 등), 하나가 먼저 완료되면서 재고를 다 가져가 버려 나머지 하나는 영원히 완료할 수 없는 상태(`"Not enough inventory at source location"`)로 남습니다. 취소 API가 없어서 DB에서 직접 지워야 합니다. `PlacementStatusPage`/`OutboundPage`는 같은 재고에 대해 **세션 내 중복 요청을 막는 가드**가 있지만, 새로고침하거나 다른 탭/관리자가 동시에 요청하면 여전히 발생할 수 있습니다.

- **`POST /api/inbound/recommend`는 "미리보기"가 아니라 즉시 커밋입니다.** 호출하는 순간 실제 `Item`/`WorkTask`가 DB에 생성됩니다. 기존 mock 버전엔 있었던 "확인 → 저장" 2단계가 없고, `InboundPage`는 "입고 등록" 버튼 하나로 통합되어 있습니다.

- **`PATCH /api/tasks/{taskId}/complete`가 재고 반영의 유일한 지점입니다.** 입고는 target 위치에 재고를 더하고, 출고는 source 위치에서 재고를 뺍니다. 호출(call)이나 승인(accept)만으로는 재고가 바뀌지 않습니다.

- **재고/창고 데이터를 CRUD하는 화면은 여전히 mock인 부분이 있습니다.** 안전 관리(`SafetyPage`)는 관련 백엔드 API가 아직 없어 `mockData.ts`의 위반 이력을 그대로 씁니다.

---

## 4. 라우팅 & 접근 제어

```
/                    로그인 (로그인 상태면 /home으로 자동 리다이렉트)
/home                양쪽 공통
/safety              양쪽 공통 (mock)
/attendance          양쪽 공통 (내용은 역할별로 분기)
/calls               작업자 전용 화면이지만 라우트 가드는 없음 — 관리자는 사이드바에 메뉴 자체가 없음
/logistics
  ├─ (index)          역할에 따라 inbound 또는 status로 리다이렉트
  ├─ inbound           관리자만 (RequireAdmin 가드, 아니면 /logistics/status로 튕김)
  ├─ status            양쪽 공통 — 배치 지도 + 검색 + 전체 재고 목록
  └─ outbound           작업자만 (RequireWorker 가드)
```

- `RequireAuth`: 로그인 안 했으면 `/`로 이동.
- `RequireAdmin` / `RequireWorker`: `<Outlet/>`을 감싸 특정 역할만 자식 라우트에 들어가게 함. UX 편의를 위한 클라이언트 가드일 뿐, 서버 인가 로직을 대체하지 않습니다.
- `Layout.tsx`가 사이드바 메뉴 자체도 역할별로 다르게 렌더링합니다 (`ADMIN_MENU` / `WORKER_MENU` 배열).

---

## 5. 화면별 동작 요약

### 로그인
- 실제 백엔드 계정으로 인증. 성공 시 `role`에 따라 `/home`으로 이동, 이후 사이드바·콘텐츠가 달라짐.
- 이미 로그인된 상태로 `/`에 들어오면 `/home`으로 바로 리다이렉트.

### 메인 홈
- 카드 4개(진행 중 작업 수 / 가용 작업자 수 / 안전 위반 건수 / 관리자는 입고 대기·작업자는 대기 중인 호출)를 클릭하면 아래에 상세 목록이 토글됩니다.
- 안전 위반 건수만 아직 mock(`SafetyContext`) 기반이고, 나머지는 전부 `/api/dashboard/summary` 실제 데이터.

### 물류 관리 (`/logistics`)
- **입고 및 배치** (관리자 전용): 품목명+수량 입력 → "입고 등록"(`/api/inbound/recommend`, 즉시 커밋) → "작업자 호출"(`/api/tasks/{id}/inbound-call`, 가용 작업자 전체 호출).
- **배치 현황** (공통): `/api/inventories/layout`(기본) 또는 `/search?itemName=`(검색 중)로 창고 그리드 + 재고 목록을 그림. 관리자는 검색된 품목 전량에 대해 "작업자 호출 (출고 지시)" 가능 (`/api/outbound` → `/api/tasks/{id}/outbound-call`).
- **출고** (작업자 전용): 재고 목록에서 품목 선택 → 수량 입력 → "출고 처리"(`/api/outbound`로 작업 생성) → "작업자 호출"(`/api/tasks/{id}/outbound-call`).

### 안전 관리 (미연동, mock)
- "현재 발생 중인 위반" 카드 + 5초짜리 실시간 알림 팝업(소리 포함), 유형별 테이블 2개.
- "새 위반 시뮬레이션" 버튼은 실제 카메라/센서가 없는 데모 환경에서 기능을 시연하기 위한 버튼입니다.

### 근태 관리
- 관리자: 전체 작업자 근태 통계, 지표 헤더 클릭 시 하단 막대그래프 전환.
- 작업자: 본인 행만 노출 (이름 매칭, 위 3번 참고), 그래프 섹션은 숨겨짐.
- 기간 필터(일/주/월/년)는 `/api/attendance/workers/stats?period=`에 그대로 전달되어 백엔드가 실제 기간별로 집계.

### 호출 승인 (작업자 전용)
- 대기(`CALLED`) → 진행중(`ACCEPTED`) → 처리완료(`COMPLETED`) 3단계 카드 리스트, `/api/tasks/my-calls?workerId=`로 조회.
- 각 호출에 입고/출고 배지 표시. 대기 중인 호출에는 승인/거절 버튼이 함께 있습니다.

---

## 6. 남은 작업

- 안전 관리 API 연동 (백엔드에 아직 없음)
- 대시보드 상세 목록 Top5 제한 → 실제 페이지네이션 API로 교체
- 출고 중복 요청을 서버 쪽에서도 막을 수 있는 검증(또는 취소 API) 추가
- 로그인 응답에 `workerId` 포함 (현재 이름 매칭으로 우회 중)
- 실제 Wi-Fi 신호 수집 로직으로 더미 API 대체

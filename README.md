# LogiSquare — 스마트 창고 관제 시스템

관리자와 현장 작업자가 함께 쓰는 창고 운영 대시보드입니다. 입고 배치, 재고 현황, 출고, 작업자 호출, 안전 위반 모니터링, 근태 관리를 한 화면에서 처리합니다.

이 문서는 로그인을 제외한 나머지 기능이 실제 백엔드 없이 **프런트엔드 State만으로 동작하는 프로토타입/데모**의 구조를 팀원이 빠르게 파악할 수 있도록 정리한 것입니다. 로그인만 실제 백엔드(`POST /api/auth/login`)와 연동되어 있고, 근태/재고/호출/안전 데이터는 아직 mock입니다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 빌드 도구 | Vite 5 |
| 프레임워크 | React 19 + TypeScript |
| 라우팅 | React Router 7 (`BrowserRouter`) |
| 스타일 | Tailwind CSS 4 (`@import "tailwindcss"`, CSS 기반 설정) |
| 상태 관리 | React Context API (전역 store 라이브러리 없음) |
| 데이터 | `src/data/mockData.ts`의 인메모리 mock 데이터 (백엔드/DB 없음) |

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
```

**로그인**은 실제 백엔드 계정으로 인증합니다 (`관리자`/`작업자` 계정은 백엔드 팀원에게 문의). 로컬 데모용 하드코딩 계정은 더 이상 없습니다.

> ⚠️ 로그인 세션은 `localStorage`에 저장하지 않습니다. 새로고침하면 로그아웃 상태로 초기화됩니다(의도된 동작 — 데모 단순화를 위함).

---

## 1. 폴더 구조

```
src/
├─ App.tsx                 # 라우트 정의 + 전역 Provider 조립
├─ main.tsx                 # BrowserRouter로 App 마운트
├─ types.ts                 # 도메인 타입 전체 (단일 진실 공급원)
├─ index.css                 # Tailwind import
│
├─ context/                  # 전역 상태 (기능별로 분리된 Context)
│  ├─ AuthContext.tsx         # 로그인 세션, 역할(admin/worker)
│  ├─ InventoryContext.tsx    # 창고 슬롯 + 재고 아이템 (입고/출고 로직)
│  ├─ CallContext.tsx         # 작업자 호출 요청 (입고/출고 지시)
│  ├─ SafetyContext.tsx       # 안전 위반 로그 + 실시간 알림
│  └─ ToastContext.tsx        # 화면 우하단 토스트 알림
│
├─ data/
│  └─ mockData.ts             # 창고 그리드, 초기 재고, 작업자 목록 등 시드 데이터
│
├─ components/                # 여러 페이지에서 재사용되는 UI
│  ├─ Layout.tsx               # 좌측 고정 사이드바 + 역할별 메뉴
│  ├─ RequireAuth.tsx           # 로그인 가드
│  ├─ WarehouseMap.tsx           # 창고 그리드 지도 (등급 색상 렌더링)
│  ├─ StatCard.tsx                # 홈 화면 숫자 카드(클릭 시 요약 토글)
│  └─ ConfirmDialog.tsx            # 예/아니오 확인창
│
├─ pages/
│  ├─ LoginPage.tsx
│  ├─ HomePage.tsx                 # 4개 카드 + 클릭 시 하단 요약 패널
│  ├─ SafetyPage.tsx                # 실시간 위반 알림 + 유형별 로그 테이블
│  ├─ AttendancePage.tsx             # 관리자: 전체 근태 / 작업자: 본인 근태만
│  ├─ CallApprovalPage.tsx            # 작업자 전용: 호출 대기→승인→처리완료
│  └─ logistics/
│     ├─ LogisticsPage.tsx            # 탭 컨테이너 (역할별 탭 분기)
│     ├─ InboundPage.tsx               # 관리자 전용: 입고 및 배치
│     ├─ PlacementStatusPage.tsx        # 공통: 배치 현황 지도 + 전체 재고 목록
│     └─ OutboundPage.tsx                # 작업자 전용: 출고 처리
│
└─ utils/
   └─ sound.ts                # 안전 위반 발생 시 경고음 (Web Audio API)
```

---

## 2. 전역 상태 구조 (Context 5개)

이 앱은 Redux/Zustand 없이 **Context + `useState`** 조합만으로 상태를 관리합니다. `App.tsx`에서 아래처럼 중첩해서 감싸며, 순서는 의존성이 없어 임의로 바꿔도 무방합니다.

```tsx
<AuthProvider>
  <ToastProvider>
    <InventoryProvider>
      <CallProvider>
        <SafetyProvider>
          <Routes>...</Routes>
        </SafetyProvider>
      </CallProvider>
    </InventoryProvider>
  </ToastProvider>
</AuthProvider>
```

각 Provider는 `use◯◯()` 커스텀 훅을 export하며, Provider 밖에서 호출하면 에러를 던지도록 되어 있습니다 (`useContext` null 체크).

### AuthContext
- `CREDENTIALS` 배열에 하드코딩된 계정 2개로 로그인 검증 (`login(id, password)`).
- `User`에 `role`과(작업자인 경우) `workerId`를 담아 이후 모든 화면에서 "지금 보고 있는 사람이 관리자인지 작업자인지, 어느 작업자인지"를 판단하는 기준이 됩니다.

### InventoryContext — 창고의 핵심 상태
- `slots: Slot[]` — 창고 그리드 전체 칸 (4행 × 8열 = 32칸). 각 슬롯은 `row`, `col`, `grade`(A/B/C), `itemId`(비어있으면 `null`)를 가짐.
- `items: InventoryItem[]` — 실제 재고 품목 (이름, 수량, 등급, 어느 슬롯에 있는지).
- 등급은 **출입구가 왼쪽에 있다는 전제**로 열(column) 기준 결정됩니다 (`mockData.ts`의 `gradeForCol`): 0~1열=A(고회전), 2~5열=B(중회전), 6~7열=C(저회전).
- `previewPlacement(qty)` — 수량으로 등급을 추천하고(`gradeForQty`: 150개↑=A, 50~149=B, 그 외=C) 해당 등급 구역의 빈 슬롯을 하나 찾아 미리 보여줌 (아직 저장 X).
- `placeItem(name, qty)` — 실제로 새 아이템을 만들고 빈 슬롯에 배치 (입고 확정).
- `shipOut(itemId, qty)` — 재고를 차감. 요청 수량이 남은 재고보다 많으면 실패, 전량 출고되면 아이템 삭제 + 슬롯을 다시 빈 칸으로 되돌림 (출고 확정).

### CallContext — 관리자 → 작업자 지시
- `CallRequest`는 `taskType: '입고' | '출고'`와 `status: '대기' | '승인' | '완료'`를 가짐.
- `sendCall(itemName, location, taskType)` — 현재 `가용` 상태인 작업자 중 첫 번째를 자동 배정(가장 가까운 작업자를 부른다는 컨셉의 단순화 버전). 가용 작업자가 없으면 `null` 반환.
- `acceptCall(id)` / `completeCall(id)` — 작업자가 호출 승인 화면에서 상태를 전이시킴.
- **주의**: 호출 완료(`completeCall`)는 `CallRequest.status`만 바꿀 뿐, `InventoryContext`의 실제 재고/슬롯에는 아무 영향을 주지 않습니다. 즉 "물건을 실제로 옮겼다"는 물류상의 사실은 관리자가 입고 화면에서 저장하거나(입고), 작업자가 출고 화면에서 처리(출고)해야 반영됩니다. 호출은 어디까지나 "지시/알림" 레이어입니다.

### SafetyContext
- `logs: ViolationLog[]` — 위반 이력. `active: true`인 항목이 "현재 진행 중"인 위반.
- `triggerViolation()` — 데모용 버튼으로 임의의 구역·유형 위반을 생성하고, `liveAlerts`(5초 후 자동 소멸)에 추가 + `playAlertBeep()`으로 경고음 재생.

### ToastContext
- `showToast(message, tone)` — 화면 전역에서 호출 가능한 우하단 토스트. `tone: 'success' | 'alert'`로 색상만 다름.

---

## 3. 라우팅 & 접근 제어

`App.tsx`의 라우트 트리를 역할별로 요약하면:

```
/                    로그인 (비로그인 전용)
/home                양쪽 공통
/safety              양쪽 공통
/attendance          양쪽 공통 (내용은 역할별로 분기)
/calls               작업자 전용 화면이지만 라우트 가드는 없음 — 관리자는 사이드바에 메뉴 자체가 없음
/logistics
  ├─ (index)          역할에 따라 inbound 또는 status로 리다이렉트
  ├─ inbound           관리자만 (RequireAdmin 가드, 아니면 /logistics/status로 튕김)
  ├─ status            양쪽 공통 — 배치 지도 + 전체 재고 목록
  └─ outbound           작업자만 (RequireWorker 가드)
```

- `RequireAuth`: 로그인 안 했으면 `/`로 이동.
- `RequireAdmin` / `RequireWorker`: 각 로직 파일 상단에 정의된 작은 컴포넌트로, `<Outlet/>`을 감싸 특정 역할만 자식 라우트에 들어가게 함. **주의**: 이건 UX 편의를 위한 가드일 뿐이며, 세션이 새로고침 시 사라지는 구조라 실제 "보안"은 아닙니다 (프로토타입이므로 서버 인가 로직이 없습니다).
- `Layout.tsx`가 사이드바 메뉴 자체도 역할별로 다르게 렌더링합니다 (`ADMIN_MENU` / `WORKER_MENU` 배열).

---

## 4. 화면별 동작 설명

### 로그인
- 빈 칸이면 버튼 비활성화, 잘못된 계정이면 인라인 에러 메시지.
- 성공 시 `role`에 따라 같은 `/home`으로 가지만 이후 사이드바·컨텐츠가 달라짐.

### 메인 홈
- 카드 4개(진행 중 작업 수 / 가용 작업자 수 / 안전 위반 건수 / 입고 대기 or 대기 중인 호출)는 **클릭해도 페이지 이동 없이** 같은 화면 아래에 요약 목록이 토글됩니다 (`openCard` state).
- 각 숫자는 `InventoryContext`/`CallContext`/`SafetyContext`/mockData를 조합해 실시간으로 계산됩니다 (별도 API 호출 없음).

### 물류 관리 (`/logistics`)
- **입고 및 배치** (관리자 전용): 품목명+수량 입력 → `previewPlacement`로 추천 등급/위치 확인 → 저장(`placeItem`) → 저장 직후 "작업자 호출 (입고 지시)" 버튼으로 `taskType: '입고'` 호출을 보낼 수 있음.
- **배치 현황** (공통): 창고 그리드를 등급 색상으로 시각화. 우측 검색창으로 품목을 찾으면 지도에서 해당 칸이 하이라이트. 하단에는 **전체 재고 목록 테이블**(품목/수량/등급/위치)이 있어 검색 없이도 뭐가 어디 있는지 한눈에 확인 가능 — 행을 클릭하면 검색창에 자동 입력되어 지도 하이라이트로 이어짐. 관리자만 "작업자 호출 (출고 지시)" 버튼이 보임(`taskType: '출고'`).
- **출고** (작업자 전용): 왼쪽 테이블에서 품목을 클릭해 선택 → 현재 재고/위치 확인 → 출고 수량 입력(재고 초과 불가) → 처리. 전량 출고되면 해당 슬롯이 빈 칸으로 즉시 반영됩니다.

### 안전 관리
- 상단 "현재 발생 중인 위반" 카드 + 우상단에 5초짜리 실시간 알림 팝업(소리 포함).
- 하단은 **위반 유형별로 분리된 두 개의 테이블**(보호장비 미착용 / 위험구역 침입), 각각 구역 검색 가능.
- "새 위반 시뮬레이션" 버튼은 실제 카메라/센서가 없는 데모 환경에서 기능을 시연하기 위한 버튼입니다.

### 근태 관리
- 관리자: 전체 작업자 목록, 지표(호출 수락/처리 작업/안전 위반) 헤더를 클릭하면 그 지표로 정렬 + 하단 막대그래프 전환. 정렬은 항상 이름 가나다순이 기본이며, 지표 클릭은 "정렬"이 아니라 "그래프에 표시할 지표 선택"입니다.
- 작업자: 본인 행(`workers.find(w => w.id === user.workerId)`)만 노출되고, 그래프 섹션 자체가 숨겨집니다.
- 기간 필터(일/주/월/년)는 실제 히스토리 데이터가 없으므로 `PERIOD_MULTIPLIER`로 base 수치에 배수를 곱해 시뮬레이션합니다.

### 호출 승인 (작업자 전용)
- 대기(`대기`) → 승인(`승인`) → 처리완료(`완료`) 3단계 카드 리스트.
- 각 호출에 `입고`/`출고` 배지가 표시되어 어떤 종류의 작업 지시인지 구분됩니다.

---

## 5. 데이터 흐름 요약 (예: "관리자가 새 품목을 입고하고 작업자에게 배치를 지시")

```
InboundPage (관리자)
  └─ previewPlacement(qty)         # InventoryContext: 등급/추천 슬롯 계산만, 상태 변경 없음
  └─ placeItem(name, qty)          # InventoryContext: items/slots state 갱신 (실제 입고 확정)
  └─ sendCall(name, location, '입고')  # CallContext: 새 CallRequest(status: 대기) 생성
        └─ ToastContext.showToast(...)   # "OOO 작업자에게 입고 호출을 전송했습니다"

CallApprovalPage (작업자)
  └─ acceptCall(id)   # status: 대기 → 승인
  └─ completeCall(id) # status: 승인 → 완료 (재고 데이터에는 영향 없음, 호출 자체의 완료 표시일 뿐)
```

같은 패턴이 "배치 현황에서 품목 검색 → 출고 지시 호출"(`taskType: '출고'`)에도 적용됩니다.

---

## 6. 이 프로토타입에서 의도적으로 생략된 것들

팀원이 헷갈리지 않도록 명시합니다.

- **로그인 제외 백엔드/DB 없음**: 로그인(`/api/auth/login`)만 실제 백엔드와 연동되어 있고, 그 외 데이터는 전부 `mockData.ts` 시드 값 + 브라우저 메모리 state. 새로고침하면 로그인 세션을 포함해 전부 초기화됩니다.
- **세션 미저장**: 로그인 상태를 `localStorage`/쿠키에 저장하지 않습니다. 라우트 가드(`RequireAdmin` 등)는 UX용이며 실제 인가/보안 계층이 아닙니다.
- **호출과 재고 비연동**: 위 4번 문단 참고 — `completeCall`은 재고를 건드리지 않습니다. 실제 서비스로 발전시킨다면 "출고 지시 호출을 처리완료하면 자동으로 `shipOut`을 호출한다" 같은 연결을 고려할 수 있습니다.
- **위치 기반 "가장 가까운 작업자" 로직 단순화**: 실제 거리 계산이 아니라 `가용` 상태인 작업자 중 배열의 첫 번째를 선택합니다.

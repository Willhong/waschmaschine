# Waschmaschine

공용 세탁기 예약 관리 시스템입니다. 여러 사용자가 실시간으로 세탁기 사용 일정을 확인하고 예약할 수 있습니다.

## 주요 기능

- **주간 일정 보기**: 일주일 단위로 세탁기 예약 현황을 한눈에 확인
- **실시간 동기화**: SSE(Server-Sent Events)를 통해 여러 브라우저 간 예약 정보 실시간 동기화
- **사용자 프로필**: 이름과 고유 색상으로 자신의 예약을 쉽게 식별
- **커스텀 색상 선택**: 9가지 프리셋 색상 + 커스텀 색상 선택 지원
- **액세스 로그**: 사용자 활동 기록 및 통계 조회 기능
- **반응형 디자인**: 데스크톱과 모바일 환경 모두 최적화
- **Docker 지원**: 컨테이너 환경에서 손쉬운 배포

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **런타임**: Bun
- **UI**: React 19 + Tailwind CSS 4
- **컴포넌트**: shadcn/ui (Base UI 기반)
- **데이터베이스**: SQLite (bun:sqlite)
- **실시간 통신**: Server-Sent Events (SSE)

## 시작하기

### 요구 사항

- [Bun](https://bun.sh/) v1.0 이상

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/waschmaschine.git
cd waschmaschine

# 의존성 설치
bun install
```

### 개발 서버 실행

```bash
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

### 프로덕션 빌드

```bash
bun run build
bun start
```

## 프로젝트 구조

```
waschmaschine/
├── app/
│   ├── api/
│   │   ├── access-logs/     # 액세스 로그 API
│   │   │   └── route.ts     # GET 로그 조회/통계
│   │   ├── profiles/        # 프로필 API
│   │   │   ├── route.ts     # GET/PUT 프로필
│   │   │   └── stream/      # SSE 스트림
│   │   └── reservations/    # 예약 API
│   │       ├── route.ts     # GET/POST/DELETE 예약
│   │       └── stream/      # SSE 스트림
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트
│   ├── user-profile-dialog.tsx
│   └── washing-machine-schedule.tsx
├── lib/
│   ├── access-logs.ts      # 액세스 로그 CRUD
│   ├── db.ts               # SQLite 데이터베이스 설정
│   ├── profiles.ts         # 프로필 CRUD
│   ├── reservations.ts     # 예약 CRUD
│   ├── user-profile.ts     # 클라이언트 프로필 관리
│   └── utils.ts
├── data/
│   └── waschmaschine.db    # SQLite 데이터베이스 파일
└── Dockerfile              # Docker 빌드 설정
```

## API 엔드포인트

### 예약 (Reservations)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/reservations` | 전체 예약 목록 조회 |
| POST | `/api/reservations` | 새 예약 생성 |
| DELETE | `/api/reservations` | 예약 삭제 |
| GET | `/api/reservations/stream` | 실시간 예약 변경 스트림 |

### 프로필 (Profiles)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/profiles` | 전체 프로필 조회 |
| PUT | `/api/profiles` | 프로필 생성/수정 |
| GET | `/api/profiles/stream` | 실시간 프로필 변경 스트림 |

### 액세스 로그 (Access Logs)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/access-logs` | 액세스 로그 조회 (페이지네이션, 필터 지원) |
| GET | `/api/access-logs?summary=true` | 오늘의 접속 통계 요약 |

## 사용법

1. 처음 접속 시 프로필 설정 화면이 표시됩니다
2. 이름과 원하는 색상을 선택하여 프로필을 생성합니다
3. 주간 일정에서 원하는 시간대를 클릭하여 예약합니다
4. 자신의 예약은 클릭하여 취소할 수 있습니다

## Docker 배포

Docker를 사용하여 애플리케이션을 컨테이너로 배포할 수 있습니다.

### 이미지 빌드

```bash
docker build -t waschmaschine .
```

### 컨테이너 실행

```bash
docker run -d -p 3000:3000 -v waschmaschine-data:/app/data waschmaschine
```

데이터베이스 파일을 유지하려면 `-v` 옵션으로 볼륨을 마운트하세요.

## 라이선스

MIT

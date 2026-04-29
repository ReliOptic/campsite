# Active Camp 화면 카피 (Korean / English)

> 대상 시안: `design-brief.md` §6.7 F-2 Active Camp
> 사용 목적: 디자이너가 화면 시안 작업 시 즉시 적용 가능한 실 카피 자료
> 원칙: Lorem ipsum 금지, 직접적 어휘, 거짓 완료 표현 회피, family-look-spec 어휘 엄수
> 작성일: 2026-04-29

본 문서의 모든 카피는 실제 제품에 등장 가능한 운영 어휘이다. 한국어·영어는 단순 번역이 아닌 동일 의미의 자연 표현으로 작성되었다.

---

## 1. 시나리오 가정

화면이 가정하는 작업 상황은 다음과 같다. 디자이너는 본 시나리오를 시안의 시각 위계 검증에 활용한다.

| 항목 | 값 |
|---|---|
| 프로젝트 | Stripe 결제 모듈 출시 준비 |
| 미션 | 결제 흐름 보안 검토 및 v1.2 출시 |
| 참여자 수 | 4 (모닥불 2 + 등불 1 + 연기 1) |
| 미해결 메시지 | 1건 (Claude → 사용자) |
| 마지막 진입 | 17분 전 |

---

## 2. Top Status Bar

| 영역 | 한국어 | English |
|---|---|---|
| 프로젝트 라벨 | `payments-v1` | `payments-v1` |
| 미션 라벨 | `미션 · 결제 흐름 보안 검토 + v1.2 출시` | `Mission · Secure checkout audit + v1.2 release` |
| 동기화 신선도 | `방금 전 동기화` | `synced just now` |
| 활성 인원 | `활동 중 2` | `2 working now` |
| 차단 수 | `차단 1` | `1 blocked` |
| 검토 대기 | `검토 대기 1` | `1 to review` |

타이포 가이드: 프로젝트 라벨은 monospace 계열(Space Grotesk small + uppercase). 미션 라벨은 Space Grotesk display-sm 또는 Inter title-md.

---

## 3. Left Terminal Rail

| 영역 | 한국어 | English |
|---|---|---|
| 섹션 헤더 | `LOCAL` | `LOCAL` |
| 상태 | `상태 · building` | `status · building` |
| 브랜치 | `브랜치 · feat/checkout-audit` | `branch · feat/checkout-audit` |
| 최근 진입 | `최근 진입 · 17분 전` | `last seen · 17m ago` |
| 호스트 | `기기 · MacBook Air` | `device · MacBook Air` |
| 어댑터 | `어댑터 · claude, codex, gemini` | `adapters · claude, codex, gemini` |
| 신선도 | `신선도 · 양호` | `freshness · healthy` |
| 잠금 | `잠금 없음` | `no lock held` |

섹션 헤더는 Space Grotesk label-sm + 대문자 + letter-spacing 0.05rem.

---

## 4. Center Camp Scene — Mission Card

미션 화로 위에 부유하는 카드 또는 스크린 좌중앙 카드.

### 4.1 미션 카드 본문

| 영역 | 한국어 | English |
|---|---|---|
| 미션 제목 | `결제 흐름 보안 검토 + v1.2 출시` | `Secure checkout audit + v1.2 release` |
| 미션 요약 | `Stripe 결제 흐름의 PCI-DSS 준수 여부를 점검하고, 출시 차단 항목을 모두 해소한다.` | `Audit the Stripe checkout flow for PCI-DSS compliance and clear every release-blocking item.` |
| 미션 단계 | `단계 · 검토` | `phase · reviewing` |
| 시작 시각 | `시작 · 4월 27일 14:02` | `started · Apr 27, 14:02` |
| 미션 상태 | `모닥불 (modakbul) · 활발하게 진행 중` | `modakbul · in active progress` |

### 4.2 미션 카드 푸터

| 영역 | 한국어 | English |
|---|---|---|
| 다음 행동 | `다음 행동 · Stripe 환경 변수 복구 후 통합 테스트 재실행` | `next move · restore Stripe env, then rerun integration tests` |
| 메타 라벨 | `참여자 4 · 이벤트 12건 · 미해결 메시지 1` | `4 participants · 12 events · 1 unresolved` |

---

## 5. Right Return Panel — 3블록

복귀 화면의 가장 중요한 텍스트 표면. 카피는 **간결하고 직설적**이며 시적 표현은 금지된다.

### 5.1 Working now (활동 중)

| 줄 | 한국어 | English |
|---|---|---|
| 헤더 | `활동 중` | `Working now` |
| 라인 1 | `Claude · 결제 단위 테스트 보강` | `Claude · expanding checkout unit tests` |
| 라인 2 | `Codex · webhook 재시도 큐 구현` | `Codex · implementing webhook retry queue` |

### 5.2 Waiting on you (당신을 기다림)

| 줄 | 한국어 | English |
|---|---|---|
| 헤더 | `당신을 기다림` | `Waiting on you` |
| 라인 1 (등불) | `Gemini · 보안 감사 보고서, 사람의 판단 필요` | `Gemini · security audit summary, ready for your read` |
| 라인 2 (연기) | `Terminal-A · Stripe 환경 변수 누락, 차단됨` | `Terminal-A · Stripe env missing, blocked` |
| 라인 3 (메시지) | `Claude의 미해결 질문 · 재시도 정책 결정 필요` | `Claude has an unresolved question · retry policy decision needed` |

### 5.3 Next move (다음 행동)

| 줄 | 한국어 | English |
|---|---|---|
| 헤더 | `다음 행동` | `Next move` |
| 본문 | `Stripe 환경 변수 복구 → 통합 테스트 재실행 → Gemini 검토 회신` | `Restore Stripe env → rerun integration tests → reply to Gemini review` |
| 보조 | `예상 소요 · 약 25분` | `estimated · ~25 minutes` |

---

## 6. 참여자 카드 4종

각 참여자는 동물 캐릭터 sprite + 라벨 + 한 줄 요약 + 다음 행동으로 구성된다.

### 6.1 Claude (여우, 모닥불)

| 영역 | 한국어 | English |
|---|---|---|
| 이름·도구 | `Claude · 여우` | `Claude · the fox` |
| 상태 | `모닥불 (modakbul)` | `modakbul · active` |
| 요약 | `결제 단위 테스트를 7건에서 23건으로 확장 중` | `expanding checkout unit tests from 7 to 23` |
| 다음 행동 | `엣지 케이스 4건 마무리 후 push` | `wrap up 4 edge cases, then push` |
| 메타 | `Ghostty 터미널 · 32분 활동 중` | `Ghostty · 32m active` |

### 6.2 Codex (올빼미, 모닥불)

| 영역 | 한국어 | English |
|---|---|---|
| 이름·도구 | `Codex · 올빼미` | `Codex · the owl` |
| 상태 | `모닥불 (modakbul)` | `modakbul · active` |
| 요약 | `webhook 재시도 큐 구현 · idempotency key 통합` | `building webhook retry queue with idempotency keys` |
| 다음 행동 | `재시도 한도와 백오프 정책 회신 대기` | `awaiting retry-limit and backoff decision` |
| 메타 | `tmux:1 · 18분 활동 중` | `tmux:1 · 18m active` |

### 6.3 Gemini (사슴, 등불)

| 영역 | 한국어 | English |
|---|---|---|
| 이름·도구 | `Gemini · 사슴` | `Gemini · the deer` |
| 상태 | `등불 (deungbul) · 검토 대기` | `deungbul · ready for review` |
| 요약 | `PCI-DSS 4.0 감사 보고서 작성 완료. 사람의 판단을 기다림` | `PCI-DSS 4.0 audit summary ready. Awaiting your judgment` |
| 다음 행동 | `보고서 검토 후 출시 가능 여부 결정` | `read the report, decide if release is safe` |
| 메타 | `Ghostty:2 · 9분 전 마지막 갱신` | `Ghostty:2 · last update 9m ago` |

### 6.4 Terminal-A (사용자, 연기)

| 영역 | 한국어 | English |
|---|---|---|
| 이름·도구 | `Terminal-A · 사용자` | `Terminal-A · you` |
| 상태 | `연기 (yeongi) · 차단됨` | `yeongi · blocked` |
| 요약 | `통합 테스트 실행 시도 중 STRIPE_SECRET_KEY 누락` | `tried integration tests, STRIPE_SECRET_KEY missing from env` |
| 다음 행동 | `1Password에서 키 회수 후 .env 복구` | `pull the key from 1Password, restore .env` |
| 메타 | `Ghostty:3 · 14분 동안 정지` | `Ghostty:3 · stalled for 14m` |

---

## 7. Bottom Activity Strip — 최근 이벤트

시간 역순으로 5건. 각 항목은 시각·참여자·상태 변화·요약 4요소로 구성한다.

| 시각 | 한국어 | English |
|---|---|---|
| 14:21 | `Terminal-A → 연기 · STRIPE_SECRET_KEY 누락 감지` | `Terminal-A → yeongi · STRIPE_SECRET_KEY missing` |
| 14:18 | `Claude → 모닥불 · 재시도 정책 결정 요청` | `Claude → modakbul · asked for retry policy decision` |
| 14:12 | `Gemini → 등불 · 보안 감사 보고서 정리 완료` | `Gemini → deungbul · audit summary prepared` |
| 14:05 | `Codex → 모닥불 · webhook 재시도 큐 작업 시작` | `Codex → modakbul · started webhook retry queue` |
| 14:02 | `미션 시작 · 결제 흐름 보안 검토` | `mission started · secure checkout audit` |

---

## 8. 미해결 메시지 카드 (Threads 패널)

미해결 메시지는 amber 좌측 강조선으로 시각 차별화한다.

| 영역 | 한국어 | English |
|---|---|---|
| 헤더 | `미해결 1건 · 회신 필요` | `1 unresolved · needs your reply` |
| 발신자 라벨 | `Claude → 사용자 · 16분 전` | `Claude → you · 16m ago` |
| 본문 | `결제 실패 시 재시도 정책을 자동 3회 + exponential backoff로 갈지, 사용자에게 즉시 알림으로 갈지 결정 필요해요. 보수적 옵션은 1회만 재시도이고요.` | `Should the retry policy be auto-3-with-exponential-backoff, or alert the user immediately? Conservative path is single retry only.` |
| 응답 힌트 | `회신: campsite camp message reply <id> --from=you "..."` | `reply: campsite camp message reply <id> --from=you "..."` |
| 푸터 | `해소 처리: campsite camp message resolve <id>` | `mark resolved: campsite camp message resolve <id>` |

---

## 9. 시각 보조 라벨 (배지·토스트·툴팁)

### 9.1 화로 상태 배지(범례용)

| 배지 | 한국어 | English |
|---|---|---|
| bulssi | `불씨 · 막 시작됨` | `bulssi · just started` |
| modakbul | `모닥불 · 활동 중` | `modakbul · in progress` |
| deungbul | `등불 · 검토 대기` | `deungbul · ready for review` |
| yeongi | `연기 · 차단됨` | `yeongi · blocked` |
| jangjak | `장작 · 다음 행동 준비` | `jangjak · next move prepared` |

### 9.2 토스트·푸시 안내(이벤트 발생 시)

| 트리거 | 한국어 | English |
|---|---|---|
| 신규 등불 발생 | `Gemini가 검토를 기다리고 있어요.` | `Gemini is waiting for your review.` |
| 신규 연기 발생 | `Terminal-A가 막혔어요. 환경 변수 확인이 필요해요.` | `Terminal-A is blocked. Check the missing env variable.` |
| 신규 메시지 도착 | `Claude의 새 질문이 도착했어요.` | `New question from Claude.` |
| 차단 해소 | `Terminal-A의 차단이 해소되었어요.` | `Terminal-A is unblocked.` |
| 미션 일시 정지 | `미션이 잠시 멎었어요. 마지막 활동은 14분 전이에요.` | `Mission has paused. Last activity 14m ago.` |

### 9.3 빈 상태 카피(참고용)

| 상황 | 한국어 | English |
|---|---|---|
| 활동 중 0 | `지금은 아무도 작업하지 않고 있어요.` | `Nobody is working right now.` |
| 검토 대기 0 | `검토할 것이 없어요. 잠시 쉬어도 좋아요.` | `Nothing to review. Take a breath.` |
| 차단 0 | `막힌 것이 없어요.` | `Nothing is blocked.` |
| 메시지 0 | `대화가 아직 없어요.` | `No conversations yet.` |

---

## 10. 카피 작성 원칙(디자이너 참고)

본 카피는 다음 원칙을 따른다. 시안 작업 중 카피 변형이 필요한 경우 동일 원칙을 적용한다.

### 10.1 어휘 정합

- 화로 5종 상태명은 한국어 + 영문 음차를 반드시 병기한다
- `mission`, `participant`, `next move`, `working now`, `waiting on you`는 양 표면에서 동일 어휘로 사용한다
- `done`, `complete`, `success`, `완료`, `성공` 등 거짓 완료 어휘는 사용하지 않는다

### 10.2 어조

- 직접적이지만 차분하다
- 긴급성을 인위적으로 부풀리지 않는다(`URGENT`, `즉시`, `위험` 회피)
- 사용자에 대한 호명은 한국어 `사용자`, 영문 `you`로 통일한다
- 이모티콘·이모지 사용 금지

### 10.3 길이 가이드

- Top status bar 항목: 한국어 12자 / 영어 18자 이내
- 참여자 요약: 한국어 28자 / 영어 50자 이내
- Return panel 라인: 한국어 22자 / 영어 40자 이내
- 메시지 본문: 한국어 80자 / 영어 130자 이내

### 10.4 한국어와 영어의 관계

- 단순 직역이 아닌 동일 의미의 자연 표현
- 한국어는 한자어 기반 학술 어휘 우선(구어적 비유 회피)
- 영어는 simple present + 동사구로 끝맺음(서사적 표현 회피)

---

## 11. 추가 시나리오용 카피 변형(선택)

디자이너가 다른 페르소나·다른 작업 영역으로 시안을 확장할 경우 다음 카피 세트를 활용한다.

### 11.1 시나리오 B — 디자인 시스템 정비

| 영역 | 한국어 | English |
|---|---|---|
| 미션 | `디자인 토큰 v3 정리 + Storybook 동기화` | `Design tokens v3 cleanup + Storybook sync` |
| 다음 행동 | `색채 토큰 충돌 12건 정리 후 Figma 동기화` | `resolve 12 color token conflicts, then sync Figma` |

### 11.2 시나리오 C — 데이터 마이그레이션

| 영역 | 한국어 | English |
|---|---|---|
| 미션 | `사용자 스키마 0042 마이그레이션 적용` | `Apply user schema migration 0042` |
| 다음 행동 | `스테이징 백필 검증 후 운영 적용 결정` | `verify staging backfill, then decide on prod cutover` |

### 11.3 시나리오 D — 사이드 프로젝트(희원 페르소나, 정식 영웅 변형)

본 시나리오는 1차 핸드오프 `payments-v1` 시나리오를 대체하는 **정식 F-2 영웅 시안**이다. 페르소나 희원(32세, 프론트엔드 개발자, 비코더 친화)의 퇴근 후 30분 사이드 프로젝트 시점을 표현한다. 분위기는 캐주얼·낮은 인지부하·"어렵지 않다" 정서이며, 코더 어휘(authentication flow·session management·OAuth·JWT·middleware)는 회피하고 비코더 친화 영어 어휘(login page·email verification·Vercel deploy)만 채택한다.

#### 11.3.1 시나리오 가정

| 항목 | 한국어 | English |
|---|---|---|
| 프로젝트 | `로그인 페이지 (사이드)` | `login page (side)` |
| 미션 | `로그인 페이지 만들기` | `Build the login page` |
| 참여자 수 | `1명 sparse 또는 2명` | `1 sparse or 2` |
| 미해결 메시지 | `0건 또는 1건 (가벼운 환경 변수 질문)` | `0 or 1 (light env var question)` |
| 마지막 진입 | `23분 전` | `23m ago` |

#### 11.3.2 Top Status Bar

| 영역 | 한국어 | English |
|---|---|---|
| 프로젝트 라벨 | `login-page` | `login-page` |
| 미션 라벨 | `미션 · 로그인 페이지 만들기` | `Mission · Build the login page` |
| 동기화 신선도 | `2분 전 동기화` | `synced 2m ago` |
| 활성 인원 | `활동 중 1` (1명) / `활동 중 2` (2명) | `1 working now` / `2 working now` |
| 차단 수 | `차단 0` (기본) / `차단 1` (yeongi 1건일 때) | `0 blocked` / `1 blocked` |
| 검토 대기 | `검토 대기 0` | `0 to review` |

#### 11.3.3 Left Terminal Rail (M3 시안 통합 후 4행)

P1-1 권고 반영. LOCAL 섹션 첫 진입 시 4행만 노출, 나머지는 펼치기 토글.

| 영역 | 한국어 | English |
|---|---|---|
| 섹션 헤더 | `LOCAL` | `LOCAL` |
| 상태 | `상태 · building` | `status · building` |
| 브랜치 | `브랜치 · feat/login-page` | `branch · feat/login-page` |
| 최근 진입 | `최근 진입 · 23분 전` | `last seen · 23m ago` |
| 신선도 | `신선도 · 양호` | `freshness · healthy` |

펼치기 토글 시 추가 노출 항목: 호스트·어댑터·잠금 (§11.1·§11.2 패턴 cross-reference).

#### 11.3.4 Mission Card

| 영역 | 한국어 | English |
|---|---|---|
| 미션 제목 | `로그인 페이지 만들기` | `Build the login page` |
| 미션 요약 | `이메일 + 비밀번호 로그인 흐름을 만들고 Vercel에 배포한다.` | `Build the email + password login flow and deploy to Vercel.` |
| 미션 단계 | `단계 · building` | `phase · building` |
| 시작 시각 | `시작 · 4월 28일 19:30` | `started · Apr 28, 19:30` |
| 미션 상태 | `모닥불 (modakbul) · 활발하게 진행 중` | `modakbul · in active progress` |
| 다음 행동 | `다음 행동 · 이메일 검증 흐름 마무리 후 Vercel 배포` | `next move · finish email verification, then deploy to Vercel` |
| 메타 라벨 (1명) | `참여자 1 · 이벤트 4건 · 미해결 메시지 0` | `1 participant · 4 events · 0 unresolved` |
| 메타 라벨 (2명) | `참여자 2 · 이벤트 6건 · 미해결 메시지 0` | `2 participants · 6 events · 0 unresolved` |

#### 11.3.5 Return Panel 3블록

##### Working now (활동 중)

| 줄 | 한국어 | English |
|---|---|---|
| 헤더 | `활동 중` | `Working now` |
| 라인 1 | `Claude · 이메일 검증 폼 만드는 중` | `Claude · building the email verification form` |
| 라인 2 (2명 케이스만) | `Codex · 비밀번호 강도 측정 추가` | `Codex · adding password strength check` |

##### Waiting on you (당신을 기다림)

**0건 케이스 (yeongi 0건)**: §9.3 빈 상태 카피 인용 — `검토할 것이 없어요. 잠시 쉬어도 좋아요.` / `Nothing to review. Take a breath.`

**1건 케이스 (yeongi 1건)**:

| 줄 | 한국어 | English |
|---|---|---|
| 헤더 | `당신을 기다림` | `Waiting on you` |
| 라인 1 (연기) | `Claude · API 키를 까먹은 것 같아요. 한번 봐주세요.` | `Claude · looks like the API key got missed. Take a look?` |

##### Next move (다음 행동)

| 줄 | 한국어 | English |
|---|---|---|
| 헤더 | `다음 행동` | `Next move` |
| 본문 | `이메일 검증 마무리 → 비밀번호 강도 추가 → Vercel 배포` | `Finish email verification → add password strength → deploy to Vercel` |
| 보조 | `예상 소요 · 약 18분` | `estimated · ~18 minutes` |

#### 11.3.6 참여자 카드

##### 1명 케이스 — Claude (여우, 모닥불)

| 영역 | 한국어 | English |
|---|---|---|
| 이름·도구 | `Claude · 여우` | `Claude · the fox` |
| 상태 | `모닥불 (modakbul)` | `modakbul · active` |
| 요약 | `이메일 검증 폼 + 입력 검증 메시지 작업 중` | `working on the email verification form + inline validation` |
| 다음 행동 | `폼 완성 후 비밀번호 입력 단계로 넘어가기` | `finish the form, then move to password input` |
| 메타 | `Ghostty 터미널 · 21분 활동 중` | `Ghostty · 21m active` |

##### 2명 케이스 — Claude (여우) + Codex (올빼미, 모닥불)

| 영역 | 한국어 | English |
|---|---|---|
| 이름·도구 | `Codex · 올빼미` | `Codex · the owl` |
| 상태 | `모닥불 (modakbul)` | `modakbul · active` |
| 요약 | `비밀번호 강도 측정 컴포넌트 만드는 중` | `building the password strength meter component` |
| 다음 행동 | `Claude의 폼 완성 기다린 다음 연결` | `wait for Claude's form, then wire it up` |
| 메타 | `tmux:1 · 12분 활동 중` | `tmux:1 · 12m active` |

#### 11.3.7 Activity Strip — 최근 5건

시간 역순. 가벼운 분위기 — modakbul 진척 3건 + 환경설정·commit 2건.

| 시각 | 한국어 | English |
|---|---|---|
| 19:53 | `Claude → 모닥불 · 이메일 검증 폼 첫 시안 완성` | `Claude → modakbul · email form first draft ready` |
| 19:48 | `Codex → 모닥불 · 비밀번호 강도 측정 컴포넌트 시작` | `Codex → modakbul · started password strength meter` |
| 19:40 | `사용자 · .env에 NEXT_PUBLIC_APP_URL 추가` | `you · added NEXT_PUBLIC_APP_URL to .env` |
| 19:35 | `Claude → 모닥불 · 라우팅 구조 정리 commit` | `Claude → modakbul · committed route restructure` |
| 19:30 | `미션 시작 · 로그인 페이지 만들기` | `mission started · build the login page` |

#### 11.3.8 토스트·빈 상태 카피 (시나리오 D delta)

§9.2·§9.3 패턴 답습. 시나리오 D 분위기 변형분만 별도 명시.

| 트리거 | 한국어 | English |
|---|---|---|
| 신규 미션 점화 | `첫 모닥불을 피웠어요. 좋은 시작이에요.` | `Lit your first campfire. Good start.` |
| Vercel 배포 시작 | `배포가 시작됐어요. 잠시만 기다려보세요.` | `Deploy started. Hang on a moment.` |
| 세션 종료 (save) | `다시 돌아오면 바로 시작할 수 있어요.` | `You can pick up right where you left off.` |
| 가벼운 차단(yeongi) 발생 | `Claude가 환경 변수를 한번 봐달래요.` | `Claude is asking you to check an env var.` |
| 빈 상태 (Working now 0) | `지금은 잠깐 쉬는 중이에요.` | `Things are quiet right now.` |

---

## 12. 인계 자료 형식

본 문서의 모든 카피는 다음 두 형태로 디자이너에게 전달된다.

- 본 마크다운 문서 (Figma 또는 Penpot에 즉시 복사 가능)
- 추가 요청 시 JSON 변환본 (`design/copy-active-camp.json`)

검수 시 시안 내 모든 텍스트가 본 문서 또는 §11의 변형 카피에서 출처를 가져야 한다.

---

*Document version: v1.0*
*Last updated: 2026-04-29*
*Owner: Kiwon Cho*

# Chapter 9: Generator 에이전트 구현

## 9.1 시스템 프롬프트 설계

Generator는 하네스에서 유일하게 파일 시스템에 쓰기 권한을 가진 에이전트다. 전체 비용의 91.3%를 차지하는 핵심 에이전트이며, 시스템 프롬프트가 산출물 품질을 직접 결정한다.

### 9.1.1 스펙 완전 구현 원칙

Generator 프롬프트의 첫 번째 원칙:

> "Implement every feature in the spec. Do not under-scope. The planner specified these features for a reason."

이 지시가 필요한 이유는, 에이전트가 대규모 스펙을 수신하면 자의적으로 범위를 축소하는 경향이 있기 때문이다. 16개 기능 중 "핵심" 8개만 구현하고 나머지를 "향후 추가"로 분류하는 행동을 방지한다.

"The planner specified these features for a reason"이라는 부연은 Generator에게 스펙의 권위를 확립한다. Generator가 스펙의 적절성을 재판단하는 것이 아니라, 스펙을 충실히 이행하는 것이 역할임을 명확히 한다.

### 9.1.2 Anti-Slop 패턴 적용

Generator 프롬프트에 포함된 anti-slop 패턴:

```
Apply anti-slop patterns. Avoid:
  - Generic purple gradients over white cards
  - Unmodified stock component libraries
  - Template layouts without customization
  - Excessive default shadows and borders
  - "AI-generated" visual patterns
```

Planner의 디자인 스킬 참조가 스펙 수준에서 anti-slop을 반영한다면, Generator의 anti-slop 지시는 구현 수준에서 이를 강제한다. 이중 적용이 필요한 이유는, 스펙에 "고유한 색상 팔레트"라고 명시되어 있어도 Generator가 구현 시 기본 Tailwind 색상으로 대체할 수 있기 때문이다.

### 9.1.3 AI 기능 구현 지시

프롬프트의 네 번째 원칙:

> "Build AI features as proper tool-using agents. When the spec includes AI integrations, build them as agents that can drive the app's functionality through tools. Not text-in/text-out wrappers."

이 지시가 구분하는 두 가지 구현 방식:

**Text-in/text-out 래퍼 (금지):**
```python
# 사용자 입력을 모델에 전달하고 텍스트 응답을 표시
response = claude.messages.create(prompt=user_input)
display(response.text)
```

**Tool-using 에이전트 (권장):**
```python
# AI가 앱의 도구를 사용하여 실제 작업을 수행
agent = Agent(
    tools=[track_create, note_place, effect_apply],
    system="You are a composition assistant..."
)
result = agent.run(user_request)
# result: 실제 트랙이 생성되고 노트가 배치됨
```

차이는 AI의 산출물 형태다. 래퍼는 텍스트를 반환하고, 에이전트는 행동을 수행한다. DAW 앱에서 "멜로디를 만들어줘"라는 요청에 대해, 래퍼는 "C-E-G-C의 코드 진행을 추천합니다"라는 텍스트를 반환하고, 에이전트는 실제 트랙에 노트를 배치한다.

## 9.2 Handoff 수신 시 행동 분기

Generator의 동작은 라운드에 따라 근본적으로 분기한다. 이 분기를 `buildUserPrompt()` 함수가 구현한다.

### 9.2.1 Round 1: 초기 빌드

```typescript
if (!handoff) {
  return [
    '## Product Spec\n',
    specJson,
    '\n\nBuild the complete application according to this spec.',
    'This is Round 1. Start from scratch.',
  ].join('\n')
}
```

Round 1에서 Generator는 handoff를 수신하지 않는다. 입력은 ProductSpec만이며, "Start from scratch"라는 지시와 함께 전체 앱을 처음부터 구축한다.

### 9.2.2 Round N: REFINE

```typescript
const directionLabel = handoff.strategic_direction === 'REFINE'
  ? 'REFINE the current implementation'
  : 'PIVOT to an entirely different aesthetic approach'
```

REFINE 방향을 수신하면 Generator는 다음 규칙을 따른다:

1. **must_fix 항목 전부 수정.** 항목별로 severity가 명시되어 있으며, critical부터 처리한다.
2. **preserve 항목 유지.** 이 항목들을 변경하면 회귀(regression)가 발생한다. Generator는 수정 전 preserve 목록을 확인하고, 해당 영역의 코드를 변경하지 않는다.
3. **디자인 방향 유지.** 색상 팔레트, 타이포그래피, 레이아웃 체계를 변경하지 않는다.
4. **수정 범위 최소화.** 지적된 항목만 수정하고, 지적되지 않은 영역은 건드리지 않는다.

이 규칙이 비용 감소의 메커니즘이다. Round 2에서 Generator가 전체 앱을 재작성하면 Round 1과 유사한 비용($71)이 발생한다. 지적된 항목만 수정하면 비용이 $37로 감소한다. Round 3에서는 수정 범위가 더 축소되어 $6까지 감소한다.

### 9.2.3 Round N: PIVOT

PIVOT 방향을 수신하면 Generator의 행동이 달라진다:

1. **미학적 접근 전면 재설계.** 새로운 색상 팔레트, 타이포그래피, 레이아웃 원칙을 적용한다.
2. **기능적 preserve 항목 유지.** PIVOT이라도 기능 구현은 보존한다. 변경 대상은 시각적 표현이지 기능 논리가 아니다.
3. **REFINE보다 넓은 수정 범위.** CSS, 레이아웃 컴포넌트, 색상 상수 등 시각 관련 코드 전반을 수정한다.

PIVOT의 비용은 REFINE보다 높다. 그러나 현재 방향성이 근본적으로 잘못된 경우, 세부 수정을 반복해도 점수가 정체할 뿐이다. PIVOT은 이 정체를 탈출하기 위한 전략이다.

### 9.2.4 프롬프트에 포함되는 맥락 정보

Round 2 이후의 사용자 프롬프트에는 다음 정보가 포함된다:

```typescript
return [
  `## Round ${round} — ${directionLabel}\n`,
  '### Product Spec\n',
  specJson,
  '\n### Previous Evaluation Feedback\n',
  `Verdict: ${handoff.verdict}`,
  `Direction: ${handoff.strategic_direction}`,
  `Rationale: ${handoff.direction_rationale}`,
  '\n### Must Fix (do NOT skip these)\n',
  ...handoff.must_fix.map((f) => `- [${f.severity}] ${f.description}`),
  '\n### Preserve (do NOT regress these)\n',
  ...handoff.preserve.map((p) => `- ${p.description}`),
  `\n### Budget Status\n`,
  `Spent: $${handoff.cost_so_far.total_usd.toFixed(2)}`,
  `Remaining: $${handoff.cost_so_far.budget_remaining_usd.toFixed(2)}`,
  `Rounds left: ${handoff.cost_so_far.rounds_remaining}`,
].join('\n')
```

**Budget Status 포함의 의도.** Generator에게 비용 제약을 인식시킨다. 남은 예산이 $20이고 남은 라운드가 1이면, Generator는 대규모 리팩토링보다 집중적 수정을 선택해야 한다. 이 정보가 없으면 Generator가 예산을 초과하는 작업을 시도할 수 있다.

**"do NOT skip these" / "do NOT regress these" 강조.** must_fix와 preserve의 중요성을 명시적으로 강조한다. 단순히 목록을 나열하는 것보다 금지 지시를 부가하는 것이 에이전트의 준수율을 높인다.

## 9.3 허용 도구 설계

Generator에게 허용된 도구:

| 도구 | 용도 | 권한 |
|------|------|------|
| FileRead | 기존 코드, 설정 파일 읽기 | 읽기 |
| FileWrite | 코드, 설정, 에셋 파일 생성/수정 | 쓰기 |
| Bash | 빌드, 테스트, 패키지 설치 실행 | 실행 |
| Glob | 파일 패턴 검색 | 읽기 |
| Grep | 코드 내 패턴 검색 | 읽기 |

Planner(읽기 전용)와 Evaluator(읽기 + Playwright)와 비교하면, Generator만이 FileWrite와 완전한 Bash 권한을 가진다. 이 권한 설계는 "최소 권한 원칙"(principle of least privilege)의 에이전트 버전이다. 각 에이전트에게 역할 수행에 필요한 최소한의 도구만 부여한다.

## 9.4 비용 패턴

Generator의 비용 패턴은 하네스 비용 구조에서 가장 중요한 변수다.

| 라운드 | 비용 | 전체 대비 | 작업 범위 |
|--------|------|----------|----------|
| Round 1 | $71.08 | 57.0% | 전체 앱 초기 구축 |
| Round 2 | $36.89 | 29.6% | Evaluator 지적 항목 수정 |
| Round 3 | $5.88 | 4.7% | 잔여 결함 수정 |

Round 1에서 Round 3으로의 비용 감소율: 91.7%.

이 감소의 메커니즘:
- Round 1: 16개 기능 전부를 구현. 수백 개 파일 생성. 프로젝트 구조 수립, 의존성 설치, 빌드 설정.
- Round 2: Evaluator가 지적한 5-10개 항목 수정. 기존 파일 수정 위주.
- Round 3: 잔여 2-3개 항목 수정. 미세 조정 수준.

이 패턴은 소프트웨어 개발의 일반적 패턴과 일치한다. 초기 구축 비용이 수정 비용보다 항상 크다. 하네스에서 이 패턴이 극적으로 나타나는 이유는, Evaluator의 피드백이 구체적이고 행동 지향적이어서 Generator의 수정 범위가 효율적으로 축소되기 때문이다.

## 9.5 Context Reset과 Generator

Chapter 4에서 분석한 context reset이 Generator에 미치는 영향을 구체화한다.

각 라운드에서 Generator는 새로운 agent() 호출로 시작한다. 이전 라운드에서 Generator가 어떤 코드를 작성했는지, 어떤 디버깅을 거쳤는지, 어떤 설계 결정을 내렸는지의 컨텍스트는 전달되지 않는다. Generator가 수신하는 정보는 ProductSpec과 Handoff뿐이다.

이 설계의 비용: Round 2의 Generator는 자신이 Round 1에서 작성한 코드를 "처음 보는" 코드로 취급한다. 코드를 읽고, 구조를 파악하고, 수정 대상을 식별하는 데 초기 오버헤드가 발생한다.

이 설계의 이점: Generator가 이전 라운드의 실패한 시도나 잘못된 방향에 구속되지 않는다. "이전에 이 방법을 시도했지만 실패했다"는 이력이 없으므로, 유효한 방법을 기피하는 편향이 발생하지 않는다. Handoff의 must_fix와 preserve만이 Generator의 행동을 제약하며, 수정 방법의 선택은 Generator의 자율에 맡긴다.

---

다음 장에서는 Evaluator 에이전트의 clean-room 격리 구현과 anti-rationalization 프롬프트를 다룬다.

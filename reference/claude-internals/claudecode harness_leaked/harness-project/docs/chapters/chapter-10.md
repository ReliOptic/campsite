# Chapter 10: Evaluator 에이전트 구현

## 10.1 Clean-Room 격리 구현

Chapter 3에서 clean-room 격리의 이론적 근거를 분석했다. 이 장에서는 구현 수준의 상세를 다룬다.

### 10.1.1 buildCleanRoomPrompt() 함수

Clean-room 격리의 핵심 구현체는 `buildCleanRoomPrompt()` 함수다. 이 함수가 Evaluator의 사용자 프롬프트를 구성하며, 입력으로 허용되는 정보를 엄격히 제한한다.

```typescript
function buildCleanRoomPrompt(
  spec: ProductSpec,
  contract: AcceptanceContract,
  thresholds: EvaluationThresholds
): string {
  return [
    '## Product Spec\n',
    JSON.stringify(spec, null, 2),
    '\n\n## Acceptance Contract\n',
    JSON.stringify(contract, null, 2),
    '\n\n## Score Thresholds\n',
    `- design_quality: minimum ${thresholds.designQuality}`,
    `- originality: minimum ${thresholds.originality}`,
    `- craft: minimum ${thresholds.craft}`,
    `- functionality: minimum ${thresholds.functionality}`,
    '\nAny criterion below its threshold means FAIL.',
  ].join('\n')
}
```

이 함수가 구현하는 격리:

**포함되는 정보:**
- ProductSpec: Planner가 생성한 스펙. "무엇을 평가할 것인가"의 기준.
- AcceptanceContract: 스펙에서 파생된 완료 기준. "어떤 조건을 만족해야 하는가"의 목록.
- EvaluationThresholds: 축별 임계값. "몇 점 이상이어야 합격인가"의 기준.

**배제되는 정보:**
- Generator의 시스템 프롬프트. Generator에게 어떤 지시가 내려졌는지 알 수 없다.
- Generator의 실행 로그. Generator가 어떤 디버깅을 거쳤는지 알 수 없다.
- 이전 라운드의 Generator 컨텍스트. 이전에 어떤 코드를 작성했는지 알 수 없다.
- Handoff 이력. 이전 라운드에서 어떤 피드백이 있었는지 알 수 없다.
- Planner의 내부 추론. 스펙의 "왜"가 아닌 "무엇"만 전달된다.

### 10.1.2 Agent SDK의 자연스러운 격리

Agent SDK에서 각 agent() 호출은 독립적인 컨텍스트로 시작한다. 이 특성이 clean-room 격리를 자연스럽게 구현한다. Evaluator를 별도의 agent() 호출로 실행하면, Generator의 컨텍스트는 물리적으로 접근 불가능하다.

```typescript
// Generator 호출: 자체 컨텍스트
await callGeneratorAgent(systemPrompt, userPrompt, config)

// Evaluator 호출: 별도 컨텍스트 (Generator 컨텍스트 없음)
const rawOutput = await callEvaluatorAgent(systemPrompt, userPrompt, config)
```

두 호출 사이에 공유되는 정보는 `buildCleanRoomPrompt()`가 명시적으로 구성한 사용자 프롬프트뿐이다. 이 명시성이 격리의 신뢰성을 보장한다. 암묵적으로 누출되는 정보가 없다.

### 10.1.3 격리가 파괴되는 실수

구현 시 clean-room 격리를 의도치 않게 파괴할 수 있는 실수를 열거한다:

**실수 1: Generator 로그를 Evaluator 프롬프트에 포함.**
디버깅 목적으로 Generator의 실행 로그를 Evaluator에게 전달하면, Evaluator가 Generator의 의도를 파악하여 동조적 판단을 내릴 수 있다.

**실수 2: 동일 agent() 호출에서 생성과 평가를 수행.**
단일 agent() 호출에서 "먼저 코드를 작성하고, 그 다음 자체 평가하라"고 지시하면, 생성 과정의 컨텍스트가 평가 시점에 그대로 존재한다. Chapter 3에서 분석한 자기평가 편향이 그대로 발생한다.

**실수 3: Handoff를 Evaluator에게 전달.**
이전 라운드의 Handoff를 Evaluator에게 전달하면, "이전에 이 항목이 지적되었다"는 정보가 현재 라운드의 판단을 편향시킬 수 있다. "이전에 지적된 항목은 아마 수정되었을 것"이라는 추론이 검증 없이 이루어질 위험이 있다.

## 10.2 Anti-Rationalization 프롬프트

### 10.2.1 5가지 거부 패턴

Evaluator의 시스템 프롬프트에 명시된 anti-rationalization 프로토콜:

```
You MUST recognize and reject these self-rationalization patterns:

- "The code looks correct based on my reading"
  → Actually RUN the code. Read-based assessment is not evidence.

- "The implementer's tests already pass"
  → Run your OWN independent tests. Their tests may not cover what matters.

- "This is a minor issue, I'll let it pass"
  → If it fails a criterion, it fails. Minor issues compound.

- "Overall the quality is good"
  → Score each criterion individually. Do not use overall impressions.

- "This probably works correctly"
  → "Probably" is not PASS. Verify or mark as unknown.
```

5번째 패턴("This probably works correctly")은 Chapter 3의 4가지 분류에 추가된 것이다. 이 패턴은 검증 부재를 확률적 추측으로 대체하는 행동이다. "아마 동작할 것이다"는 검증이 아니며, Evaluator가 확인할 수 없는 항목은 PASS가 아닌 "unknown"으로 표시해야 한다.

### 10.2.2 프로토콜의 배치 위치

Anti-rationalization 프로토콜이 시스템 프롬프트의 최상단, "Critical" 라벨과 함께 배치된 이유는 주의 편향(attention bias)을 활용하기 위함이다. 모델은 프롬프트의 초반부와 말미부에 위치한 지시에 더 높은 주의를 할당하는 경향이 있다. 자기합리화 방지가 Evaluator의 가장 중요한 행동 제약이므로, 프롬프트의 최상단에 배치한다.

## 10.3 평가 기준 4축

### 10.3.1 Design Quality (가중치: 높음)

프롬프트 정의:

> "Does the design feel like a coherent whole rather than a collection of parts? Is there a clear visual system (consistent spacing, color usage, component styles)?"

이 축이 "높음" 가중치인 이유: PDF 하네스의 핵심 목표가 "AI slop 탈피"이기 때문이다. 기능적으로 동작하지만 시각적으로 일관성 없는 앱은 하네스의 목표를 달성하지 못한 것이다.

평가 시 Evaluator가 확인하는 구체적 항목:
- 간격 체계의 일관성 (8px/16px 그리드 등)
- 색상 사용의 의도성 (강조색이 실제로 강조 목적으로만 사용되는가)
- 컴포넌트 스타일의 통일성 (모든 버튼이 동일 시각 언어를 따르는가)

### 10.3.2 Originality (가중치: 높음)

프롬프트 정의:

> "Is there evidence of custom design decisions? Or is this template layouts, library defaults, and AI-generated patterns? Unmodified stock components fail here."

이 축은 anti-slop의 직접적 측정이다. Evaluator가 탐지하는 비원래성 신호:
- Tailwind의 기본 색상(`blue-500`, `gray-100`)이 커스텀 팔레트 없이 사용됨
- Material UI / shadcn 등의 기본 스타일이 수정 없이 적용됨
- "AI가 만든 것 같은" 반복적 카드 그리드 레이아웃

### 10.3.3 Craft (가중치: 보통)

프롬프트 정의:

> "Typography hierarchy, spacing consistency, color harmony, contrast ratios. The details that separate professional work from amateur work."

Craft는 디자인 실행의 정밀도를 측정한다. Design Quality가 "일관된 전체"를 평가한다면, Craft는 "세부의 완성도"를 평가한다.

구체적 평가 항목:
- 타이포그래피 위계 (h1 > h2 > h3의 시각적 차별화)
- 대비율 (WCAG AA 기준 4.5:1 이상)
- 간격의 리듬감 (섹션 간, 요소 간 간격의 비례 관계)

### 10.3.4 Functionality (가중치: 보통)

프롬프트 정의:

> "Can users understand what the interface does, find primary actions, and complete tasks? Does every feature in the spec actually work?"

Functionality는 시각적 품질이 아닌 기능적 완성도를 측정한다. 스펙에 명시된 모든 기능이 실제로 동작하는지, 사용자가 주요 동작을 식별하고 완료할 수 있는지를 평가한다.

이 축이 "보통" 가중치인 이유는, 기능적 결함은 Generator가 상대적으로 쉽게 수정할 수 있기 때문이다. 디자인 문제는 방향성 변경이 필요할 수 있지만, 기능 결함은 대부분 코드 수정으로 해결된다.

### 10.3.5 Hard Threshold 기반 PASS/FAIL

4개 축 모두에 개별 임계값을 적용한다. 기본 임계값:

| 축 | 임계값 |
|----|--------|
| design_quality | 7 |
| originality | 6 |
| craft | 6 |
| functionality | 8 |

**어떤 축이든 하나라도 임계값 미만이면 verdict는 FAIL이다.** 총점 평균을 사용하지 않는 이유는 Chapter 3에서 분석한 "총괄적 승인" 패턴을 방지하기 위함이다.

functionality의 임계값이 8로 가장 높은 이유: 앱이 기능적으로 동작하지 않으면 디자인 품질이 무의미하기 때문이다. 시각적으로 아름답지만 로그인이 되지 않는 앱은 제품이 아니다.

originality의 임계값이 6으로 가장 낮은 이유: 완전한 독창성을 매 라운드에서 요구하면 Generator가 과도한 시각적 실험에 비용을 소모한다. "기본 템플릿에서 벗어난 커스텀 결정이 존재하는가" 수준의 기대치다.

## 10.4 Playwright MCP 통합

### 10.4.1 능동적 페이지 탐색

Evaluator에게 Playwright MCP가 도구로 제공되면, Evaluator는 실행 중인 앱을 능동적으로 탐색할 수 있다. 코드 읽기(정적 분석)에 추가하여 실제 앱 동작(동적 분석)을 검증한다.

Playwright로 수행하는 검증:
- 페이지 로딩 및 렌더링 확인
- 버튼 클릭, 폼 제출 등 상호작용 테스트
- 페이지 간 네비게이션 확인
- 스크린샷 캡처를 통한 시각적 검증
- 콘솔 에러 확인

### 10.4.2 Graceful Degradation

Playwright MCP가 사용 불가능한 환경에서도 Evaluator는 동작해야 한다. 이 경우 Evaluator의 평가 범위가 축소된다:

**Playwright 사용 가능:**
- 정적 분석 (코드 읽기) + 동적 분석 (앱 탐색) + 시각적 검증 (스크린샷)
- 4개 축 모두 완전 평가 가능

**Playwright 사용 불가:**
- 정적 분석만 수행
- functionality 축의 일부 기준이 "검증 불가"로 표시될 수 있음
- design_quality와 originality는 코드 기반 추론으로 부분 평가 가능
- craft 축의 시각적 검증 불가

이 degradation이 "graceful"인 이유는, Evaluator가 Playwright 부재를 감지하고 평가 범위를 자동으로 조정하기 때문이다. Playwright 부재가 전체 평가의 실패를 야기하지 않는다.

## 10.5 전략적 방향 결정

Evaluator의 가장 중요한 판단 중 하나는 strategic_direction의 결정이다. REFINE과 PIVOT 중 하나를 선택하고, 그 선택의 근거를 direction_rationale에 기술한다.

### 10.5.1 결정 프로세스

시스템 프롬프트에 명시된 결정 기준:

```
Based on scores and trends:
  - REFINE: Scores are trending up, current approach is working,
            targeted fixes needed
  - PIVOT:  Scores are stagnant or declining, fundamental aesthetic
            change needed
```

이 기준을 형식화하면:

**REFINE 선택 조건:**
- design_quality와 originality가 임계값에 근접(1-2점 차이)하거나 이전 라운드 대비 상승
- findings의 대부분이 세부적(특정 컴포넌트, 특정 페이지)
- 디자인 방향성에 대한 근본적 문제 부재

**PIVOT 선택 조건:**
- design_quality 또는 originality가 임계값보다 3점 이상 낮음
- findings의 대부분이 전체적(색상 체계, 레이아웃 체계, 시각적 일관성)
- 세부 수정으로는 임계값 도달이 어렵다고 판단

### 10.5.2 direction_rationale의 중요성

direction_rationale 필드는 단순한 설명이 아니라 Generator의 행동 지침이다. "PIVOT because the design doesn't work"보다 "PIVOT because the pastel color scheme creates insufficient contrast for a productivity tool, resulting in poor readability. A darker, higher-contrast palette would better serve the use case."가 Generator에게 더 유용한 지시다.

Evaluator에게 구체적 rationale을 요구하는 것은, anti-rationalization의 다른 측면이기도 하다. "REFINE because it's mostly good"은 총괄적 승인의 변형이다. 구체적 rationale을 강제하면 Evaluator가 판단의 근거를 명시해야 하므로, 모호한 판단이 억제된다.

## 10.6 구현 코드 분석

`src/agents/evaluator.ts`의 핵심 흐름:

```typescript
export async function runEvaluator(
  spec: ProductSpec,
  contract: AcceptanceContract,
  round: number,
  config: HarnessConfig,
  tracker: CostTracker
): Promise<Evaluation> {
  const systemPrompt = loadPrompt('evaluator-system.md')
  const userPrompt = buildCleanRoomPrompt(spec, contract, config.evaluation)
  const startTime = Date.now()

  try {
    const rawOutput = await callEvaluatorAgent(systemPrompt, userPrompt, config)

    const parsed = evaluationSchema.safeParse(rawOutput)
    if (!parsed.success) {
      const errors = parsed.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`
      )
      throw new SchemaValidationError('evaluator', errors)
    }

    const durationMs = Date.now() - startTime
    tracker.recordUsage(round, 'evaluator', 0, 0, durationMs)

    return parsed.data
  } catch (error) {
    if (error instanceof SchemaValidationError) throw error
    throw new AgentExecutionError('evaluator', 'evaluation', error)
  }
}
```

이 구현에서 clean-room 격리를 보장하는 지점:

1. **systemPrompt**: `evaluator-system.md`만 로드한다. `generator-system.md`는 참조하지 않는다.
2. **userPrompt**: `buildCleanRoomPrompt()`가 spec, contract, thresholds만 포함한다. Generator 관련 정보는 함수 시그니처에도 존재하지 않는다.
3. **callEvaluatorAgent()**: 독립적 agent() 호출. Generator의 agent() 호출과 컨텍스트를 공유하지 않는다.

격리가 코드 수준에서 강제되므로, 개발자의 실수로 Generator 컨텍스트가 Evaluator에 전달되려면 `buildCleanRoomPrompt()`의 시그니처를 변경해야 한다. 이 변경은 TypeScript 컴파일러가 감지하므로, 실수가 컴파일 타임에 차단된다.

---

다음 장에서는 Orchestrator의 GAN 루프 제어와 CostTracker의 비용 제어 메커니즘을 다룬다.

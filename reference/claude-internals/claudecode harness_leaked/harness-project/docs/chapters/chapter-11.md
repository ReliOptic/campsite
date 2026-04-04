# Chapter 11: 오케스트레이터와 비용 제어

## 11.1 GAN 루프 구현

Orchestrator는 하네스의 제어 중추다. Planner, Generator, Evaluator를 순서대로 호출하고, 반복 루프의 진입과 종료를 관리하며, 에이전트 간 데이터 변환을 수행한다.

### 11.1.1 실행 흐름

`runHarness()` 함수의 실행 흐름을 4단계로 분해한다:

**Phase 1: Planning**
```
사용자 프롬프트 → Planner → ProductSpec
                          ↓
                    AcceptanceContract (스펙에서 파생)
```

Planner가 ProductSpec을 생성하고, Orchestrator가 스펙의 각 기능에서 완료 기준을 추출하여 AcceptanceContract를 자동 생성한다. 이 두 산출물이 전체 실행의 불변 참조 문서가 된다.

**Phase 2: Contract Generation**
```typescript
function generateContract(spec: ProductSpec): AcceptanceContract {
  const criteria = spec.features.flatMap((feature, fi) =>
    feature.acceptance_criteria.map((criterion, ci) => ({
      id: `F${fi + 1}-C${ci + 1}`,
      description: criterion,
      testable: true,
      category: 'functionality' as const,
    }))
  )

  return {
    generated_from_spec: hashSpec(spec),
    criteria,
    generated_at: new Date().toISOString(),
  }
}
```

`generateContract()`는 에이전트 호출 없이 프로그래밍 방식으로 계약을 생성한다. 비용이 0이다. 각 기능의 acceptance_criteria를 평탄화(flatMap)하여 개별 Criterion 객체로 변환하고, `F1-C1`, `F1-C2`, `F2-C1` 형식의 ID를 부여한다.

`hashSpec()`는 스펙의 JSON 직렬화에 대한 해시를 생성하여 `generated_from_spec`에 기록한다. 이 해시로 계약이 어떤 스펙 버전에서 파생되었는지를 추적한다.

**Phase 3: Build-QA Loop**
```
Round 1: Generator(spec) → Evaluator(spec, contract) → FAIL?
  → Handoff 생성 → Round 2: Generator(spec, handoff) → Evaluator → FAIL?
    → Handoff 생성 → Round 3: Generator(spec, handoff) → Evaluator → PASS
```

루프의 각 반복에서:
1. Generator를 호출한다 (Round 1은 handoff 없이, Round N은 handoff와 함께).
2. Evaluator를 호출한다 (clean-room: spec + contract + thresholds만 전달).
3. 종료 조건을 확인한다 (PASS, plateau, budget).
4. 종료 조건 미달 시 Handoff를 생성하여 다음 라운드에 전달한다.

**Phase 4: Report**
```
CostTracker.generateReport() → cost-report.json
```

실행 완료 후 비용 리포트를 JSON 파일로 출력한다.

### 11.1.2 종료 조건 3가지

루프는 세 가지 조건 중 하나가 충족되면 종료한다.

**조건 1: PASS 달성.**
```typescript
if (evaluation.verdict === 'PASS') {
  console.log('[harness] PASS — stopping loop')
  break
}
```
Evaluator가 모든 축에서 임계값 이상의 점수를 부여하면 verdict가 PASS가 되고, 루프가 종료된다. 최적의 종료 조건이다.

**조건 2: 점수 정체 (Plateau) 감지.**
```typescript
if (isPlateauing(evaluations, config.evaluation.plateau)) {
  console.log('[harness] Score plateau detected, stopping loop')
  break
}
```
추가 라운드에서 품질 개선이 없으면 비용만 소비된다. plateau detection이 이 낭비를 방지한다. 상세 알고리즘은 11.2절에서 다룬다.

**조건 3: 예산 소진.**
```typescript
if (tracker.wouldExceedBudget('building')) {
  console.log('[harness] Budget insufficient for another round')
  break
}
```
다음 라운드의 예상 비용이 잔여 예산을 초과하면 루프를 종료한다. 상세 메커니즘은 11.3절에서 다룬다.

## 11.2 Plateau Detection 알고리즘

### 11.2.1 구현

```typescript
export function isPlateauing(
  history: Evaluation[],
  threshold: number = 0.5
): boolean {
  if (history.length < 2) return false

  const last = history[history.length - 1]
  const prev = history[history.length - 2]

  const avgLast = average(Object.values(last.scores))
  const avgPrev = average(Object.values(prev.scores))

  return (avgLast - avgPrev) < threshold
}
```

알고리즘: 마지막 2개 라운드의 4축 평균 점수를 비교한다. 개선 폭이 threshold(기본 0.5) 미만이면 plateau로 판단한다.

### 11.2.2 설계 결정

**왜 마지막 2개 라운드만 비교하는가?** 전체 이력의 추세선(trend line)을 분석하는 대안이 있으나, 2-3라운드의 짧은 이력에서 추세선의 통계적 유의성이 낮다. 마지막 2개 비교가 계산이 단순하고 직관적이다.

**왜 축별이 아닌 평균을 사용하는가?** 개별 축의 정체를 감지하면 더 정밀하지만, 하나의 축이 정체해도 다른 축이 개선되면 전체적으로 유효한 라운드다. 평균이 정체했다면 전반적인 개선이 없는 것이므로 종료가 적절하다.

**점수가 하락하는 경우.** `(avgLast - avgPrev) < threshold`이므로, 점수가 하락하면(음수 차이) 항상 threshold 미만이 되어 plateau로 감지된다. 이는 의도적이다. 점수가 하락하는 라운드는 추가 반복의 가치가 더 낮다.

### 11.2.3 Threshold 설정 전략

기본 threshold 0.5의 근거: 4축의 평균이 0.5 미만으로 개선되었다면, 절대 점수 기준으로 축당 0.125점 개선이다. 10점 만점에서 0.125점은 실질적 품질 차이가 없는 수준이다.

프로젝트에 따라 threshold를 조정할 수 있다:
- **높은 threshold (1.0)**: 작은 개선도 정체로 판단. 비용을 절약하지만 최종 품질이 다소 낮을 수 있다.
- **낮은 threshold (0.1)**: 미세한 개선도 계속 추구. 비용이 증가하지만 최종 품질이 더 높을 수 있다.
- **0 또는 음수 threshold**: plateau detection을 사실상 비활성화. maxRounds 또는 budget에 의해서만 종료.

## 11.3 CostTracker 설계

### 11.3.1 Per-Phase Reservation

CostTracker는 전체 예산을 단계별로 예약한다:

```typescript
const DEFAULT_RESERVATION: PhaseReservation = {
  planning: 0.02,   // 예산의 2%
  building: 0.85,   // 예산의 85%
  evaluation: 0.10, // 예산의 10%
  reserve: 0.03,    // 예산의 3%
}
```

$150 예산 기준의 배분:

| 단계 | 비율 | 금액 | 용도 |
|------|------|------|------|
| Planning | 2% | $3.00 | Planner 1회 + 재시도 1회 |
| Building | 85% | $127.50 | Generator 3라운드 |
| Evaluation | 10% | $15.00 | Evaluator 3라운드 |
| Reserve | 3% | $4.50 | 현재 라운드 evaluation 완료 보장 |

PDF 실제 비율(0.4%, 91.3%, 8.3%)과 비교하면, 구현의 예약 비율이 더 보수적이다. Planning에 2%를 예약한 이유는 재시도 가능성을 반영한 것이고, Reserve 3%는 예산 경계에서의 안전 마진이다.

### 11.3.2 예산 경고와 중단

```typescript
recordUsage(...): RoundCost {
  // ... 비용 기록 ...

  if (this.totalUsd >= this.budgetUsd) {
    throw new BudgetExceededError(this.totalUsd, this.budgetUsd, this.generateReport())
  }

  if (this.totalUsd >= this.budgetUsd * 0.8) {
    console.warn(`[cost-tracker] Budget 80% reached: ...`)
  }

  return cost
}
```

두 단계의 비용 제어:

**80% 경고.** 예산의 80%에 도달하면 경고를 출력한다. 이 시점에서 Orchestrator는 추가 라운드의 비용 효율을 재평가할 수 있다. 경고만 출력하고 실행은 계속된다.

**100% 중단.** 예산을 소진하면 `BudgetExceededError`를 발생시킨다. 이 에러에는 현재까지의 CostReport가 포함되어 있어, 호출자가 비용 내역을 확인할 수 있다.

### 11.3.3 Reserve의 역할

Reserve 3%($4.50)의 목적은 "현재 라운드의 evaluation 완료 보장"이다. Generator가 빌드를 완료한 후 예산이 부족하여 Evaluator를 실행하지 못하면, Generator의 비용이 낭비된다(평가 없는 빌드는 무의미). Reserve는 이 상황을 방지한다.

```typescript
wouldExceedBudget(phase: Phase): boolean {
  const phaseLimit = this.budgetUsd * this.reservation[phase]
  const reserveLimit = this.budgetUsd * (1 - this.reservation.reserve)
  return this.totalUsd >= reserveLimit || this.phaseSpend[phase] >= phaseLimit
}
```

`wouldExceedBudget('building')`이 true를 반환하는 조건:
1. 총 비용이 reserve를 제외한 한도(97%)에 도달. 또는
2. building 단계의 누적 비용이 해당 단계의 예약 한도(85%)에 도달.

두 조건 중 하나라도 충족되면 다음 라운드를 시작하지 않는다. 그러나 이미 시작된 라운드의 evaluation은 reserve로 완료한다.

### 11.3.4 estimateCost() 함수

```typescript
const INPUT_COST_PER_MILLION = 15.0    // $15/1M input tokens
const OUTPUT_COST_PER_MILLION = 75.0   // $75/1M output tokens

export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION
  )
}
```

Opus 4.6의 공개 가격을 기준으로 한다. 모델이 변경되거나 가격이 변동되면 이 상수를 갱신해야 한다. 현재 구현에서 토큰 수는 Agent SDK 응답에서 추출하며, placeholder 구현에서는 0으로 기록된다.

### 11.3.5 cost-report.json 출력

실행 완료 시 생성되는 비용 리포트:

```json
{
  "totalUsd": 124.70,
  "rounds": [
    { "round": 0, "agent": "planner", "inputTokens": 3200, "outputTokens": 1800, "estimatedUsd": 0.46, "durationMs": 28200 },
    { "round": 1, "agent": "generator", "inputTokens": 12000, "outputTokens": 45000, "estimatedUsd": 71.08, "durationMs": 7620000 },
    { "round": 1, "agent": "evaluator", "inputTokens": 8000, "outputTokens": 2100, "estimatedUsd": 3.24, "durationMs": 528000 }
  ],
  "budgetUsd": 150,
  "budgetUtilization": 0.831,
  "phases": { "planning": 0.46, "building": 113.85, "evaluation": 10.39 },
  "completedAt": "2026-04-05T14:30:00.000Z"
}
```

이 리포트는 하네스 최적화의 기초 데이터다. 라운드별 비용 감소 패턴, 단계별 비용 분포, 예산 활용률을 정량적으로 추적할 수 있다. Chapter 13(벤치마크와 평가)에서 이 리포트 데이터의 분석 방법을 다룬다.

## 11.4 에러 복구 전략

### 11.4.1 Planner 실패

```typescript
async function runPlannerWithRetry(
  config: HarnessConfig,
  tracker: CostTracker,
  maxRetries: number = 1
): Promise<ProductSpec> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await runPlanner(config.prompt, config, tracker)
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        console.warn(`[harness] Planner attempt ${attempt + 1} failed, retrying...`)
      }
    }
  }
  throw lastError
}
```

Planner 실패 시 1회 재시도한다. Planner의 비용이 $0.46으로 미미하므로, 재시도의 비용 부담이 낮다. 재시도에서도 실패하면 사용자에게 에러를 보고한다. Planner 없이는 하네스가 진행 불가능하므로, 무한 재시도는 허용하지 않는다.

### 11.4.2 Generator 실패

```typescript
try {
  await runGenerator(spec, handoff, round, config, tracker)
} catch (error) {
  if (error instanceof BudgetExceededError) {
    console.warn('[harness] Budget exceeded during build')
    break
  }
  console.error(`[harness] Generator failed: ${error}`)
  break
}
```

Generator 실패는 두 가지로 분류된다:
- **BudgetExceededError**: 예산 초과. 루프를 종료하고 현재까지의 결과를 반환한다.
- **기타 에러**: API 오류, 타임아웃 등. 루프를 종료한다. 향후 구현에서는 checkpoint에서 재개하는 복구가 가능하다.

### 11.4.3 Evaluator 실패

```typescript
try {
  evaluation = await runEvaluator(spec, contract, round, config, tracker)
} catch (error) {
  if (error instanceof BudgetExceededError) {
    console.warn('[harness] Budget exceeded during evaluation')
    break
  }
  console.warn(`[harness] Evaluator failed, treating as PARTIAL`)
  continue
}
```

Evaluator 실패의 복구 전략은 **PARTIAL 간주**다. 이 라운드의 평가를 건너뛰고 다음 라운드로 진행한다. Generator가 이미 빌드를 완료했으므로, Evaluator 실패로 그 빌드를 폐기하는 것은 비용 비효율적이다.

PARTIAL 간주 시 handoff가 생성되지 않으므로, 다음 라운드의 Generator는 이전 handoff(또는 Round 1이면 handoff 없음)를 기반으로 동작한다. 이는 차선의 결과이지만, 전체 루프 중단보다 나은 결과를 기대할 수 있다.

### 11.4.4 Rate Limit

Agent SDK 호출에서 rate limit에 도달하면 exponential backoff를 적용한다. 대기 시간: 1초 → 2초 → 4초 → 8초 → 16초. 5회 재시도 후에도 실패하면 에러를 전파한다.

이 복구 전략은 Agent SDK 통합 시 구현되며, 현재 placeholder에서는 즉시 에러를 발생시킨다.

## 11.5 Handoff 생성

### 11.5.1 createHandoff() 함수

```typescript
function createHandoff(
  evaluation: Evaluation,
  round: number,
  tracker: CostTracker
): Handoff {
  const handoff: Handoff = {
    round,
    verdict: evaluation.verdict,
    scores: evaluation.scores,
    thresholds_met: evaluation.threshold_failures.length === 0,
    must_fix: evaluation.findings
      .filter((f) => f.severity === 'critical' || f.severity === 'high')
      .map((f) => ({
        id: f.id,
        description: f.description,
        severity: f.severity,
      })),
    preserve: [],
    strategic_direction: evaluation.strategic_direction,
    direction_rationale: evaluation.direction_rationale,
    cost_so_far: {
      total_usd: tracker.getTotalUsd(),
      rounds_remaining: tracker.getRoundsRemaining(round),
      budget_remaining_usd: tracker.getRemainingBudget(),
    },
  }

  handoffSchema.parse(handoff)
  return handoff
}
```

이 함수에서 주목할 변환:

**findings → must_fix 변환.** Evaluation의 findings 배열에서 severity가 'critical' 또는 'high'인 항목만 추출하여 must_fix로 변환한다. 'medium' severity 항목은 must_fix에 포함하지 않는다. Generator에게 전달되는 수정 지시가 가장 중요한 항목으로 한정된다.

**preserve 배열.** 현재 구현에서 preserve는 빈 배열이다. 완전한 구현에서는 이전 라운드에서 합격한 항목을 추적하여 preserve에 포함해야 한다. 이는 향후 개선 항목이다.

**스키마 검증.** `handoffSchema.parse(handoff)`로 생성된 Handoff가 스키마를 만족하는지 검증한다. 이 검증은 방어적 프로그래밍이다. createHandoff()의 구현이 올바르면 항상 통과해야 하지만, 리팩토링 시 스키마 불일치를 조기에 포착한다.

---

다음 장에서는 하네스 프로젝트의 테스트 전략과 에이전트 시스템 테스트의 고유한 도전을 다룬다.

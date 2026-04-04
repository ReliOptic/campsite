# Chapter 8: Planner 에이전트 구현

## 8.1 시스템 프롬프트 설계

Planner의 시스템 프롬프트는 네 가지 핵심 원칙을 인코딩한다.

### 8.1.1 야심적 범위 설정

PDF 저자의 핵심 통찰은 모델에게 명시적으로 야심을 요구하지 않으면, 모델이 보수적으로 범위를 설정한다는 것이다. Planner 프롬프트의 첫 번째 원칙:

> "Be ambitious about scope. Expand the user's idea into a full-featured application. Think 10-20 features, not 3-4."

이 지시가 없으면 "DAW 앱을 만들어라"에 대해 3-4개 기능(재생, 녹음, 트랙 추가)만 생성한다. 지시가 있으면 16개 이상의 기능(멀티트랙 타임라인, 미디 편집, 이펙트 체인, 믹서 콘솔, AI 작곡 보조 등)을 생성한다.

"10-20 features, not 3-4"라는 구체적 수치 범위를 제시하는 것이 "많은 기능을 생성하라"보다 효과적이다. 모델은 모호한 양적 지시("많이", "다양하게")보다 구체적 범위 지시에 더 정확하게 반응한다.

### 8.1.2 제품 수준 집중, 기술 상세 회피

프롬프트의 두 번째 원칙:

> "Stay at the product level. Focus on what the app does, who it's for, and how it feels. Do not specify granular technical implementation details."

이어서 회피 이유를 명시한다:

> "If you get something wrong at that level, errors cascade through the entire build."

이 경고가 프롬프트에 포함된 이유는 Chapter 2에서 분석한 바와 같다. Planner가 기술 상세를 지정하면, 그 지정의 오류가 Generator에 전파된다. "react-dnd 라이브러리를 사용하여 드래그 앤 드롭을 구현하라"고 Planner가 지정했는데, 해당 라이브러리가 프로젝트의 React 버전과 호환되지 않으면, Generator가 호환성 문제를 해결하는 데 비용을 소모한다.

Planner는 "드래그 앤 드롭으로 트랙을 재배치할 수 있다"라는 기능 수준의 기술만 하고, 구현 방식은 Generator에 위임한다.

### 8.1.3 사용자 여정 전체 고려

프롬프트의 네 번째 원칙:

> "Consider the whole user journey. Think about onboarding, empty states, error states, delight moments."

이 지시는 기능 목록만으로는 포착되지 않는 UX 요소를 스펙에 포함시키기 위한 것이다. "프로젝트 목록" 기능을 정의할 때, 프로젝트가 0개인 상태(empty state), 프로젝트 로딩 실패(error state), 첫 프로젝트 생성 유도(onboarding)까지 고려하게 한다.

### 8.1.4 출력 형식 강제

프롬프트의 마지막 섹션은 JSON 출력 형식을 명시한다. ProductSpec 스키마와 정확히 대응하는 JSON 구조를 예시로 제공하고, "Do not wrap the JSON in markdown code blocks. Output raw JSON only."를 명시한다.

마크다운 코드 블록 금지가 필요한 이유는 실무적이다. 모델이 ```json 블록으로 감싸면, 파싱 시 블록 구분자를 제거하는 추가 처리가 필요하다. raw JSON을 직접 `JSON.parse()`하는 것이 더 안정적이다.

## 8.2 디자인 스킬 참조 메커니즘

Planner의 시스템 프롬프트는 기본 프롬프트에 두 개의 참조 문서를 결합하여 구성된다.

```typescript
function buildSystemPrompt(config: HarnessConfig): string {
  const base = loadPrompt('planner-system.md')
  const designSkill = loadPrompt('design-skill.md')

  const parts = [base, '\n\n## Design Skill Reference\n\n', designSkill]

  if (config.features.aiWeaving) {
    const weaving = loadPrompt('ai-weaving.md')
    parts.push('\n\n## AI Integration Directive\n\n', weaving)
  }

  return parts.join('')
}
```

이 구조에서 주목할 점:

1. **프롬프트 조합.** 시스템 프롬프트가 단일 파일이 아니라 복수 파일의 조합이다. 기본 프롬프트 + 디자인 스킬 + (선택적) AI 직조 지시문.
2. **Feature flag 연동.** `config.features.aiWeaving`이 false이면 AI 직조 지시문이 포함되지 않는다. Chapter 5의 원칙 1(feature flag 기반 설계)의 프롬프트 수준 적용이다.
3. **파일 시스템 기반 로딩.** 프롬프트를 TypeScript 상수가 아닌 마크다운 파일로 관리한다. 프롬프트 수정이 TypeScript 컴파일 없이 가능하다.

### 8.2.1 Anti-Slop 패턴

디자인 스킬 문서(`design-skill.md`)에 포함된 anti-slop 패턴은 AI 생성 프론트엔드에서 반복적으로 관찰되는 시각적 패턴을 명시하고 회피를 지시한다.

식별된 anti-slop 패턴:

| 패턴 | 발현 | 회피 지시 |
|------|------|----------|
| 보라색 그라디언트 | 배경 또는 헤더에 보라-파랑 그라디언트 | 프로젝트 고유의 색상 팔레트 생성 |
| 흰색 카드 남용 | 모든 콘텐츠를 둥근 모서리 흰색 카드에 배치 | 카드 사용 시 시각적 변주 적용 |
| 기본 그림자 | 모든 요소에 동일한 box-shadow | 그림자는 깊이 계층을 반영 |
| 스톡 컴포넌트 | UI 라이브러리의 기본 스타일 무변형 사용 | 라이브러리 사용 시 디자인 토큰 오버라이드 |
| 템플릿 레이아웃 | 사이드바 + 메인 + 카드 그리드 반복 | 콘텐츠에 맞는 레이아웃 설계 |

이 패턴들이 "slop"인 이유는, AI가 훈련 데이터에서 빈번하게 관찰한 시각 패턴을 무비판적으로 재현하기 때문이다. 결과적으로 AI가 생성한 모든 앱이 시각적으로 유사해진다. anti-slop 패턴은 이 수렴을 파괴하여 각 앱이 고유한 시각적 정체성을 갖도록 한다.

### 8.2.2 시각 디자인 언어 생성

Planner가 생성하는 ProductSpec에는 `design_language` 필드가 포함된다. 이 필드는 Planner가 디자인 스킬 문서를 참조하여 프로젝트에 고유한 시각 언어를 생성하도록 한다.

디자인 언어의 4가지 구성 요소:
- **color_palette**: 주색, 보조색, 강조색, 배경색. 최소 4색, 최대 8색.
- **typography**: 제목 글꼴과 본문 글꼴. 대비가 있으되 조화로운 조합.
- **layout_principles**: 레이아웃 결정의 원칙. "밀도보다 여백", "계층적 정보 구성" 등.
- **anti_patterns**: 이 프로젝트에서 구체적으로 회피할 패턴.

## 8.3 AI 기능 직조 (AI Weaving)

### 8.3.1 직조의 개념

AI 직조(AI Weaving)는 Planner가 스펙에 AI 기능을 자연스럽게 삽입하는 과정이다. PDF에서 이 접근을 명시한다:

> "I also asked the planner to find opportunities to weave AI features into the product specs."

"직조"라는 비유가 적절한 이유는, AI 기능이 앱의 별도 섹션이 아니라 기존 기능에 통합되어야 하기 때문이다. "AI 페이지"가 따로 있는 것이 아니라, 트랙 편집 중에 AI 작곡 보조가 나타나고, 이펙트 설정 시 AI 추천이 제안되는 방식이다.

### 8.3.2 4가지 통합 범주

AI 직조 지시문(`ai-weaving.md`)은 4가지 통합 범주를 정의한다:

**1. AI 보조 생성 (AI-Assisted Creation)**
사용자의 창작 활동을 AI가 보조한다. 예시: 멜로디 생성, 코드 진행 제안, 레벨 디자인 제안, 스프라이트 생성.

**2. 지능형 기본값 (Intelligent Defaults)**
앱의 기본 설정을 AI가 맥락에 맞게 결정한다. 예시: 프로젝트 유형에 따른 템플릿 추천, 사용 패턴에 따른 단축키 제안.

**3. 자연어 인터페이스 (Natural Language Interface)**
사용자가 자연어로 앱을 제어할 수 있다. 예시: "BPM을 120으로 설정하고 드럼 트랙을 추가해줘", "이 이미지와 비슷한 색상 팔레트를 생성해줘".

**4. 에이전트 아키텍처 (Agent Architecture)**
AI를 text-in/text-out 래퍼가 아닌, 앱의 도구를 사용하는 에이전트로 구현한다. AI 작곡 보조가 "작곡 결과를 텍스트로 반환"하는 것이 아니라, 실제 트랙을 생성하고 노트를 배치하고 이펙트를 적용하는 에이전트로 동작한다.

### 8.3.3 Fallback Behavior

AI 직조에서 반드시 포함해야 할 요소가 `fallback_behavior`다. AI 기능이 실패하거나 사용 불가능할 때 앱이 어떻게 동작하는지를 명시한다.

```json
{
  "feature_name": "AI Composition Assistant",
  "capability": "Generate melodies and chord progressions",
  "tools": ["track_create", "note_place", "effect_apply"],
  "app_apis": ["POST /api/tracks", "POST /api/notes"],
  "fallback_behavior": "Manual composition tools remain fully functional. AI button shows 'AI unavailable' tooltip."
}
```

fallback_behavior가 없으면 AI 의존적 앱이 생성된다. API 키 부재, 네트워크 장애, 모델 응답 지연 시 앱 전체가 동작하지 않는 상황이 발생한다. fallback은 AI를 "향상"(enhancement)으로 유지하고 "의존"(dependency)으로 격상하지 않는 설계적 안전장치다.

## 8.4 스택 프리셋 통합

Planner의 ProductSpec에 포함되는 `tech_architecture` 필드는 스택 프리셋(`presets/full-stack-web.yaml`)에서 기본값을 가져온다.

```yaml
# presets/full-stack-web.yaml
name: full-stack-web
frontend:
  framework: react
  bundler: vite
  styling: tailwind
backend:
  framework: fastapi
  language: python
database:
  engine: sqlite
  orm: sqlalchemy
deployment:
  target: docker
```

프리셋의 역할은 Generator의 기술 선택 부담을 제거하는 것이다. "어떤 프레임워크를 사용할까"라는 결정에 토큰을 소비하는 대신, 검증된 조합을 제공한다. Generator는 이 조합을 전제로 즉시 코드 작성에 착수할 수 있다.

프리셋이 하드코딩이 아닌 YAML 파일인 이유는 확장성이다. `mobile-app.yaml`, `data-pipeline.yaml`, `cli-tool.yaml` 등의 프리셋을 추가하여, 다양한 프로젝트 유형에 대응할 수 있다.

## 8.5 비용 분석

Planner의 비용은 전체 하네스의 0.4%다. PDF 기준 $0.46.

이 비용이 미미한 이유는 Planner가 1회만 실행되고, 출력이 상대적으로 짧기(ProductSpec JSON) 때문이다. 입력 토큰은 시스템 프롬프트(planner-system.md + design-skill.md + ai-weaving.md)와 사용자 프롬프트(1-4문장)이고, 출력 토큰은 ProductSpec JSON(약 1,000-2,000 토큰)이다.

비용 대비 가치를 평가하면, Planner는 하네스에서 가장 비용 효율이 높은 구성요소다. $0.46의 비용으로 과소 범위 문제를 구조적으로 해결하고, 16개 기능 수준의 스펙을 생성하며, 디자인 언어와 AI 통합 방안까지 포함한다. 이 스펙이 없으면 Generator가 3-4개 기능 수준의 앱을 생성하고, 그 앱에 대해 Evaluator가 반복 평가를 수행하더라도 범위 자체는 확장되지 않는다.

## 8.6 구현 코드 분석

`src/agents/planner.ts`의 구현:

```typescript
export async function runPlanner(
  prompt: string,
  config: HarnessConfig,
  tracker: CostTracker
): Promise<ProductSpec> {
  const systemPrompt = buildSystemPrompt(config)
  const startTime = Date.now()

  try {
    const rawOutput = await callPlannerAgent(systemPrompt, prompt, config)

    const parsed = productSpecSchema.safeParse(rawOutput)
    if (!parsed.success) {
      const errors = parsed.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`
      )
      throw new SchemaValidationError('planner', errors)
    }

    const durationMs = Date.now() - startTime
    tracker.recordUsage(0, 'planner', 0, 0, durationMs)

    return parsed.data
  } catch (error) {
    if (error instanceof SchemaValidationError) throw error
    throw new AgentExecutionError('planner', 'planning', error)
  }
}
```

이 구현의 핵심 패턴:

1. **safeParse 사용.** `parse()` 대신 `safeParse()`를 사용하여 검증 실패 시 예외가 아닌 결과 객체를 반환받는다. 실패 시 오류 메시지를 수집하여 `SchemaValidationError`에 포함한다.
2. **에러 계층 분리.** `SchemaValidationError`(스키마 검증 실패)와 `AgentExecutionError`(에이전트 호출 자체의 실패)를 구분한다. 복구 전략이 다르기 때문이다.
3. **CostTracker 기록.** 실행 시간을 기록한다. 현재 토큰 수는 placeholder(0, 0)이며, Agent SDK 통합 시 실제 토큰 수로 대체된다.

---

다음 장에서는 Generator 에이전트의 시스템 프롬프트 설계와 Handoff 수신 시 행동 분기를 다룬다.

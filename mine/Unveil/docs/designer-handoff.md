# Unveil — 디자이너 핸드오프 가이드

Unity 에디터에서 프로젝트를 열고 퍼즐이 실행되는 상태까지 필요한 작업 목록.
코드는 전부 작성되어 있음. 아래는 Unity 에디터 안에서 해야 할 설정 작업.

---

## 1. 프로젝트 열기

| 항목 | 값 |
|------|-----|
| Unity 버전 | 2022.3 LTS 이상 (URP 포함) |
| 프로젝트 경로 | `mine/Unveil/` |
| 렌더 파이프라인 | Universal Render Pipeline (URP) |

Unity Hub에서 `mine/Unveil/` 폴더를 열면 됨.
최초 열 때 패키지 임포트에 2-3분 소요.

---

## 2. 필수 패키지 확인

Window > Package Manager에서 아래 패키지가 설치되어 있는지 확인:

- **Universal RP** (com.unity.render-pipelines.universal)
- **Post Processing** (URP에 내장)
- **Test Framework** (com.unity.test-framework) — 테스트 실행용

없으면 Package Manager에서 `+` > `Add package by name`으로 추가.

---

## 3. URP 설정

### 3-1. URP Asset 생성
1. Project 창에서 우클릭 > Create > Rendering > URP Asset (with Universal Renderer)
2. 파일 이름: `UnveilURP`
3. 생성된 `UnveilURP_Renderer` 파일도 함께 확인

### 3-2. 프로젝트에 적용
1. Edit > Project Settings > Graphics
2. **Scriptable Render Pipeline Settings** 에 `UnveilURP` 드래그
3. Edit > Project Settings > Quality > Rendering 에도 같은 에셋 적용

### 3-3. URP 설정값
UnveilURP 에셋 선택 후 Inspector에서:

| 항목 | 값 | 이유 |
|------|-----|------|
| HDR | Off | WebGL 호환 |
| Anti Aliasing | 2x MSAA | 모바일 성능 |
| Shadow Resolution | 1024 | 모바일 적정값 |
| Shadow Distance | 30 | 이소메트릭 뷰 커버 |

---

## 4. 씬 설정

### 4-1. 빈 씬 생성
1. File > New Scene > Empty Scene
2. 이름: `AmbientSky`
3. Assets/Scenes/ 폴더에 저장

### 4-2. 부트스트래퍼 배치
1. Hierarchy에서 우클릭 > Create Empty
2. 이름: `Bootstrapper`
3. Inspector에서 Add Component > `GameBootstrapper` 스크립트 추가
4. **이것만 하면 됨.** 카메라, 라이트, 월드, 컨트롤러 전부 자동 생성됨

### 4-3. 빌드 씬 등록
1. File > Build Settings
2. `AmbientSky` 씬을 Scenes In Build에 드래그
3. 인덱스 0번인지 확인

---

## 5. 셰이더 확인

`Assets/Shaders/` 폴더에 두 파일이 있음:
- `UnveilToon.shader` — 불투명 오브젝트용
- `UnveilToonTransparent.shader` — 반투명 오브젝트용 (물 리플 등)

씬 실행 시 자동으로 로드됨. 별도 설정 불필요.
**만약 분홍색(마젠타) 오브젝트가 보이면:** URP Asset이 적용되지 않은 것. 3번 항목 재확인.

---

## 6. 플레이 테스트

### 6-1. 에디터에서 실행
1. Play 버튼 클릭
2. 자동으로 생성되는 것들:
   - 이소메트릭 카메라 (30도 각도, 직교 투영)
   - 방향성 조명 + 포스트프로세싱 (블룸, 비네팅)
   - 파티클 시스템
   - 4개 무드 월드 (숨겨진 상태)
   - Threshold 구조물 (숨겨진 상태)
   - WebBridge + 컨트롤러들
3. 기본 화면: 빈 배경 + 파티클. **퍼즐은 아직 안 보임** (JS에서 트리거 필요)

### 6-2. 퍼즐 수동 테스트
에디터 Console에서 퍼즐을 직접 띄우려면:

1. Play 모드에서 Hierarchy > GameManager 오브젝트 선택
2. Inspector에서 SceneController 컴포넌트 확인
3. 아래 테스트 스크립트를 임시로 사용:

```csharp
// Assets/Editor/QuickTest.cs — 에디터 전용, 배포에 포함 안 됨
using UnityEditor;
using UnityEngine;

public class QuickTest
{
    [MenuItem("Unveil/Start Test Puzzle")]
    static void StartTestPuzzle()
    {
        if (!Application.isPlaying)
        {
            Debug.Log("Play 모드에서 실행하세요.");
            return;
        }

        var sc = Object.FindAnyObjectByType<SceneController>();
        if (sc == null)
        {
            Debug.LogError("SceneController를 찾을 수 없습니다.");
            return;
        }

        sc.SetMood("calm");
        sc.StartPuzzle(42);
    }

    [MenuItem("Unveil/Next Puzzle")]
    static void NextPuzzle()
    {
        var sc = Object.FindAnyObjectByType<SceneController>();
        if (sc != null) sc.SetStep(3);
    }

    [MenuItem("Unveil/Return to Idle")]
    static void ReturnToIdle()
    {
        var sc = Object.FindAnyObjectByType<SceneController>();
        if (sc != null) sc.SetStep(0);
    }
}
```

4. 저장 후 상단 메뉴에 **Unveil** 메뉴 생성됨
5. Play 모드에서 Unveil > Start Test Puzzle 클릭
6. 3x3 계단 퍼즐 그리드가 나타남
7. 블록 클릭하면 90도 회전. 시작→끝 경로가 연결되면 자동 해결

### 6-3. 퍼즐 조작법

| 입력 | 동작 |
|------|------|
| 블록 클릭 | 90도 시계방향 회전 |
| 시작점 (0,0) | 초록 패드, 회전 불가 |
| 종착점 (2,2) | 금색 패드 (상하 부유), 회전 불가 |
| 경로 연결 성공 | 아바타가 경로를 따라 걸어감 → 쿨다운 씬 전환 |

### 6-4. 무드 전환 테스트
Console 창에서 직접 호출:
```
// Play 모드에서 Console > 입력 불가능하므로 QuickTest에 추가하거나
// WebBridge를 통해 JSON 메시지 전송:
// unityInstance.SendMessage('GameManager', 'OnMessageFromWeb', '{"type":"SET_MOOD","vibe":"heavy"}')
```

사용 가능한 무드: `calm`, `heavy`, `restless`, `drift`, `agora`

---

## 7. WebGL 빌드

### 7-1. 빌드 설정
1. File > Build Settings > Platform: **WebGL** 선택 > Switch Platform
2. Player Settings:
   - Resolution: Default (캔버스가 100%로 채움)
   - WebGL Template: **Unveil** (WebGLTemplates/Unveil/ 폴더)
   - Compression Format: **Gzip** (Brotli는 서버 설정 필요)
   - Color Space: **Gamma** (WebGL 호환)
   - API Compatibility Level: **.NET Standard 2.1**

### 7-2. 빌드 실행
1. Build Settings > Build
2. 출력 폴더 선택 (예: `Build/WebGL/`)
3. 빌드 시간: 약 5-10분 (첫 빌드)

### 7-3. 로컬 테스트
빌드 후 로컬에서 확인:
```bash
cd Build/WebGL
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

---

## 8. 디자이너가 만들어야 할 에셋

코드에서 참조하지만 아직 존재하지 않는 에셋 목록:

### 필수 (빌드 전)
| 에셋 | 규격 | 용도 |
|------|------|------|
| `icon-192.png` | 192x192 PNG | PWA 아이콘 (홈화면) |
| `icon-512.png` | 512x512 PNG | PWA 아이콘 (스플래시) |

위치: `WebGLTemplates/Unveil/` 폴더에 넣으면 빌드 시 자동 포함.

### 선택 (비주얼 개선)
| 에셋 | 설명 |
|------|------|
| LevelDefinition SO | Assets > Create > Unveil > Level Definition 으로 생성. 시드/난이도/무드 세팅 |
| 셰이더 파라미터 튜닝 | UnveilToon 셰이더의 Rim Color, Shadow Color, Fog 거리 조정 |
| 포스트프로세싱 프로필 | Bloom/Vignette 강도 — GameBootstrapper.cs에 기본값 있음 |

---

## 9. 파일 구조 요약

```
Assets/
├── Editor/
│   └── QuickTest.cs          ← 위에서 만든 테스트 메뉴 (선택)
├── Plugins/WebGL/
│   └── bridge.jslib           ← JS 인터롭 (IndexedDB 포함)
├── Scenes/
│   └── AmbientSky.unity       ← 직접 만들어야 함 (4번 참조)
├── Scripts/
│   ├── GameBootstrapper.cs    ← 씬 자동 조립
│   ├── SceneController.cs     ← 전체 오케스트레이터
│   ├── WebBridge.cs           ← JS↔Unity 통신
│   ├── MaterialPool.cs        ← 공유 머티리얼 3개
│   ├── MoodControllerBase.cs  ← 무드 컨트롤러 베이스
│   ├── LightingController.cs  ← 조명/포스트프로세싱
│   ├── ParticleController.cs  ← 파티클
│   ├── ProceduralWorldBuilder.cs ← 무드 월드 4+1종
│   ├── MeshBuilder.cs         ← 프로시저럴 메시 6종
│   ├── Cooldown/
│   │   └── CooldownSceneBuilder.cs ← 쿨다운 3종
│   ├── Puzzle/
│   │   ├── PuzzleController.cs
│   │   ├── PuzzleStateMachine.cs
│   │   ├── PuzzleWorldBuilder.cs
│   │   ├── LevelDefinition.cs   ← ScriptableObject
│   │   ├── IsometricGrid.cs
│   │   ├── StairBlock.cs
│   │   ├── PathValidator.cs
│   │   ├── PlayerWalker.cs
│   │   └── TelemetryCollector.cs
│   ├── Progression/
│   │   └── XpCalculator.cs
│   └── Telemetry/
│       └── TelemetrySyncService.cs
├── Shaders/
│   ├── UnveilToon.shader
│   └── UnveilToonTransparent.shader
└── Tests/
    ├── EditMode/ (37 테스트)
    └── PlayMode/ (스캐폴드)

WebGLTemplates/Unveil/
├── index.html    ← PWA 로딩 UI
├── manifest.json ← PWA 매니페스트
└── sw.js         ← 서비스 워커

supabase/
├── migrations/001_telemetry_schema.sql
└── functions/
    ├── assess/index.ts
    └── coach/index.ts
```

---

## 10. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 모든 오브젝트가 분홍색 | URP Asset 미적용 | 3번 항목 재실행 |
| Play 해도 아무것도 안 보임 | Bootstrapper 컴포넌트 누락 | 4-2번 확인 |
| 퍼즐 블록이 안 보임 | 퍼즐이 트리거되지 않음 | 6-2번의 QuickTest 사용 |
| 클릭해도 블록이 안 돌아감 | 카메라 레이캐스트 실패 | Game 뷰 해상도가 너무 작지 않은지 확인 |
| Console에 셰이더 에러 | URP 버전 불일치 | Unity 2022.3+ 사용 확인 |
| WebGL 빌드 실패 | .NET 호환성 | Player Settings > .NET Standard 2.1 |
| 빌드 후 로딩 멈춤 | Compression 미지원 서버 | Gzip으로 변경 또는 서버 설정 |

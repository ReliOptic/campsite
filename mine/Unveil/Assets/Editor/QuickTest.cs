// Assets/Editor/QuickTest.cs — Editor-only test menu, excluded from builds
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

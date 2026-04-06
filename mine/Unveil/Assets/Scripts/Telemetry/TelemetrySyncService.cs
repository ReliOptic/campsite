using UnityEngine;
using System.Runtime.InteropServices;

/// <summary>
/// Manages offline-first telemetry persistence via IndexedDB.
/// Events are written to IndexedDB immediately, then synced to Supabase
/// as a single POST on session end.
///
/// WebGL: calls bridge.jslib functions.
/// Editor: logs to console (no IndexedDB).
/// </summary>
public class TelemetrySyncService : MonoBehaviour
{
    public static TelemetrySyncService Instance { get; private set; }

    [Header("Sync Config")]
    [SerializeField] private string supabaseUrl = "";
    [SerializeField] private string supabaseAnonKey = "";

    private bool _initialized;

#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")] private static extern void TelemetryStore_Init();
    [DllImport("__Internal")] private static extern void TelemetryStore_Write(string json);
    [DllImport("__Internal")] private static extern void TelemetryStore_Sync(string endpoint, string apiKey);
    [DllImport("__Internal")] private static extern void TelemetryStore_SetMeta(string key, string value);
#else
    private static void TelemetryStore_Init()
    {
        Debug.Log("[TelemetrySyncService] IndexedDB init (editor stub)");
    }
    private static void TelemetryStore_Write(string json)
    {
        Debug.Log($"[TelemetrySyncService] Write: {json}");
    }
    private static void TelemetryStore_Sync(string endpoint, string apiKey)
    {
        Debug.Log($"[TelemetrySyncService] Sync to {endpoint} (editor stub)");
    }
    private static void TelemetryStore_SetMeta(string key, string value)
    {
        Debug.Log($"[TelemetrySyncService] SetMeta: {key}={value}");
    }
#endif

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    private void Start()
    {
        Initialize();
    }

    public void Initialize()
    {
        if (_initialized) return;
        TelemetryStore_Init();
        _initialized = true;
    }

    /// <summary>
    /// Buffer a telemetry event to IndexedDB. Persists offline.
    /// </summary>
    public void WriteEvent(string json)
    {
        if (!_initialized) Initialize();
        TelemetryStore_Write(json);
    }

    /// <summary>
    /// Sync all pending events to Supabase. Call on session end.
    /// </summary>
    public void SyncToServer()
    {
        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseAnonKey))
        {
            Debug.LogWarning("[TelemetrySyncService] Supabase config not set. Skipping sync.");
            return;
        }

        string endpoint = $"{supabaseUrl}/functions/v1/assess";
        TelemetryStore_Sync(endpoint, supabaseAnonKey);
    }

    /// <summary>
    /// Store session metadata (streak, user ID, etc.)
    /// </summary>
    public void SetMeta(string key, string value)
    {
        TelemetryStore_SetMeta(key, value);
    }

    /// <summary>
    /// Inject config at runtime (from env/config system).
    /// </summary>
    public void Configure(string url, string anonKey)
    {
        supabaseUrl = url;
        supabaseAnonKey = anonKey;
    }

    private void OnApplicationPause(bool pauseStatus)
    {
        // Mobile: sync when app goes to background
        if (pauseStatus) SyncToServer();
    }

    private void OnApplicationQuit()
    {
        SyncToServer();
    }
}

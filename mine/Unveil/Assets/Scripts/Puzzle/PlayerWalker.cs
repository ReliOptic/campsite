using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Auto-walks a player avatar along a validated path on the isometric grid.
/// Moves smoothly between grid positions with direction-aware facing.
/// Monument Valley style: player glides along the solved stair path.
/// </summary>
public class PlayerWalker : MonoBehaviour
{
    [Header("Movement")]
    [SerializeField] private float moveSpeed = 2.5f;
    [SerializeField] private float stepHeight = 0.3f;

    private IsometricGrid _grid;
    private Vector2Int _currentCell;
    private GameObject _avatar;
    private Coroutine _walkCoroutine;

    public event Action OnPathComplete;
    public Vector2Int CurrentCell => _currentCell;

    /// <summary>
    /// Create the player avatar and place at starting cell.
    /// </summary>
    public void Initialize(IsometricGrid grid, Vector2Int startCell)
    {
        _grid = grid;
        _currentCell = startCell;

        // Build a simple avatar: small pyramid on a flat box (Monument Valley style)
        _avatar = new GameObject("Avatar");
        _avatar.transform.SetParent(transform);

        var body = MeshBuilder.CreateFlatBox("AvatarBody", 0.3f, 0.5f, 0.3f);
        body.transform.SetParent(_avatar.transform);
        body.transform.localPosition = new Vector3(0f, 0.25f, 0f);
        SetAvatarMaterial(body, new Color(0.95f, 0.85f, 0.70f));

        var head = MeshBuilder.CreatePyramid("AvatarHead", 4, 0.18f, 0.25f);
        head.transform.SetParent(_avatar.transform);
        head.transform.localPosition = new Vector3(0f, 0.6f, 0f);
        SetAvatarMaterial(head, new Color(1f, 0.92f, 0.80f));

        // Place at start position
        Vector3 worldPos = _grid.GridToWorld(startCell.x, startCell.y);
        _avatar.transform.position = worldPos + Vector3.up * stepHeight;
    }

    /// <summary>
    /// Walk along a sequence of path nodes from PathValidator.
    /// </summary>
    public void WalkPath(List<PathValidator.PathNode> nodes)
    {
        if (_walkCoroutine != null) StopCoroutine(_walkCoroutine);
        _walkCoroutine = StartCoroutine(WalkPathCoroutine(nodes));
    }

    private IEnumerator WalkPathCoroutine(List<PathValidator.PathNode> nodes)
    {
        for (int i = 0; i < nodes.Count; i++)
        {
            var node = nodes[i];
            Vector3 target = _grid.GridToWorld(node.GridPos.x, node.GridPos.y)
                           + Vector3.up * stepHeight;

            // Face the direction of movement
            if (i > 0)
            {
                Vector3 dir = target - _avatar.transform.position;
                dir.y = 0f;
                if (dir.sqrMagnitude > 0.001f)
                {
                    Quaternion targetRot = Quaternion.LookRotation(dir);
                    _avatar.transform.rotation = targetRot;
                }
            }

            // Smooth movement to next node
            yield return MoveToPosition(target);

            _currentCell = node.GridPos;

            // Brief pause at each node for visual rhythm
            yield return new WaitForSeconds(0.08f);
        }

        _walkCoroutine = null;
        OnPathComplete?.Invoke();
    }

    private IEnumerator MoveToPosition(Vector3 target)
    {
        Vector3 start = _avatar.transform.position;
        float distance = Vector3.Distance(start, target);
        float duration = distance / moveSpeed;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.SmoothStep(0f, 1f, elapsed / duration);
            Vector3 pos = Vector3.Lerp(start, target, t);

            // Add slight arc for stair-stepping feel
            float arc = Mathf.Sin(t * Mathf.PI) * stepHeight * 0.5f;
            pos.y += arc;

            _avatar.transform.position = pos;
            yield return null;
        }

        _avatar.transform.position = target;
    }

    /// <summary>
    /// Teleport avatar to a grid position without animation.
    /// </summary>
    public void SetPosition(Vector2Int cell)
    {
        _currentCell = cell;
        if (_avatar != null && _grid != null)
        {
            _avatar.transform.position = _grid.GridToWorld(cell.x, cell.y)
                                       + Vector3.up * stepHeight;
        }
    }

    private static void SetAvatarMaterial(GameObject go, Color color)
    {
        MaterialPool.ApplyToon(go, color);
    }
}

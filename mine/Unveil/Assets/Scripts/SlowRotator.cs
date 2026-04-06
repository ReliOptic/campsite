using UnityEngine;

/// <summary>
/// Simple Y-axis rotation for ambient visual elements (floating fragments, orbs, etc.)
/// </summary>
public class SlowRotator : MonoBehaviour
{
    public float speed = 15f;

    private void Update()
    {
        transform.Rotate(Vector3.up, speed * Time.deltaTime, Space.Self);
    }
}

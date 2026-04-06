using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Validates whether a continuous walking path exists from start to goal
/// on the isometric grid. Uses BFS across connected stair blocks.
/// A valid path requires:
///   1. Adjacent blocks have matching edge heights
///   2. Each block has an internal path connecting entry to exit edges
/// </summary>
public static class PathValidator
{
    public struct PathResult
    {
        public bool IsValid;
        public List<PathNode> Nodes;
    }

    public struct PathNode
    {
        public Vector2Int GridPos;
        public int EntryDir;   // direction entered from (-1 for start)
        public int ExitDir;    // direction exited to (-1 for goal)

        public PathNode(Vector2Int pos, int entry, int exit)
        {
            GridPos = pos;
            EntryDir = entry;
            ExitDir = exit;
        }
    }

    /// <summary>
    /// Find a valid path from start to goal cell using BFS.
    /// Returns the ordered list of nodes if found.
    /// </summary>
    public static PathResult FindPath(IsometricGrid grid, Vector2Int start, Vector2Int goal)
    {
        var result = new PathResult { IsValid = false, Nodes = new List<PathNode>() };

        StairBlock startBlock = grid.GetBlock(start.x, start.y);
        if (startBlock == null) return result;

        // BFS: state = (gridPos, entryDirection). entryDir=-1 for start block.
        var queue = new Queue<(Vector2Int pos, int entryDir, List<PathNode> path)>();

        // Start block: player stands here, no real entry direction
        var startNode = new PathNode(start, -1, -1);
        queue.Enqueue((start, -1, new List<PathNode> { startNode }));

        var visited = new HashSet<long>();

        while (queue.Count > 0)
        {
            var (pos, entryDir, path) = queue.Dequeue();

            // Collision-safe key: entryDir shifted to 0-4 range (supports -1)
            long stateKey = ((long)pos.x << 16) | ((long)(pos.y & 0xFFFF) << 4) | (long)(entryDir + 1);
            if (visited.Contains(stateKey)) continue;
            visited.Add(stateKey);

            StairBlock current = grid.GetBlock(pos.x, pos.y);
            if (current == null) continue;

            bool isOrigin = entryDir == -1;

            // Try each exit direction from this block
            for (int exitDir = 0; exitDir < 4; exitDir++)
            {
                // Normal blocks: can't U-turn back through entry edge
                if (!isOrigin && exitDir == entryDir) continue;

                if (isOrigin)
                {
                    // Start block: exit any open (non-wall) edge
                    if (current.GetEdgeHeight(exitDir) < 0) continue;
                }
                else
                {
                    // Mid-path blocks: require internal path from entry to exit
                    if (!current.HasInternalPath(entryDir, exitDir)) continue;
                }

                // Check neighbor connection
                var offset = IsometricGrid.DirectionOffset(exitDir);
                Vector2Int nextPos = pos + offset;

                // Reached goal?
                if (nextPos == goal)
                {
                    StairBlock goalBlock = grid.GetBlock(goal.x, goal.y);
                    if (goalBlock != null && StairBlock.CanConnect(current, exitDir, goalBlock))
                    {
                        var finalPath = new List<PathNode>(path);
                        // Update last node's exit
                        var last = finalPath[finalPath.Count - 1];
                        finalPath[finalPath.Count - 1] = new PathNode(last.GridPos, last.EntryDir, exitDir);
                        // Add goal node
                        finalPath.Add(new PathNode(goal, IsometricGrid.OppositeDir(exitDir), -1));
                        result.IsValid = true;
                        result.Nodes = finalPath;
                        return result;
                    }
                    continue;
                }

                if (!grid.InBounds(nextPos.x, nextPos.y)) continue;

                StairBlock neighbor = grid.GetBlock(nextPos.x, nextPos.y);
                if (!StairBlock.CanConnect(current, exitDir, neighbor)) continue;

                int neighborEntry = IsometricGrid.OppositeDir(exitDir);
                var newPath = new List<PathNode>(path);
                var updatedLast = newPath[newPath.Count - 1];
                newPath[newPath.Count - 1] = new PathNode(updatedLast.GridPos, updatedLast.EntryDir, exitDir);
                newPath.Add(new PathNode(nextPos, neighborEntry, -1));

                queue.Enqueue((nextPos, neighborEntry, newPath));
            }
        }

        return result;
    }

    /// <summary>
    /// Quick check: does any valid path exist?
    /// </summary>
    public static bool HasValidPath(IsometricGrid grid, Vector2Int start, Vector2Int goal)
    {
        return FindPath(grid, start, goal).IsValid;
    }
}

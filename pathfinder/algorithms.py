from  collections import deque
import heapq

#Breadth-First Search
def bfs(grid, start, goal):
    rows = len(grid)
    cols = len(grid[0])
    visited = [[False for _ in range(cols)] for _ in range(rows)]
    parent = {}

    directions = [(-1,0),(1,0),(0,-1),(0,1)]  # Up, Down, Left, Right
    queue = deque()
    queue.append(start)
    visited[start[0]][start[1]] = True

    while queue:
        curr = queue.popleft()
        if curr == goal:
            # Reconstruct path from goal to start
            path = []
            while curr != start:
                path.append(list(curr))
                curr = parent[curr]
            path.append(list(start))
            path.reverse()
            tree = build_search_tree(start, parent)
            return path, tree


        for dr, dc in directions:
            r, c = curr[0] + dr, curr[1] + dc
            if 0 <= r < rows and 0 <= c < cols and not visited[r][c]:
                if grid[r][c] != 'X':  # Don't go through obstacles
                    queue.append((r, c))
                    visited[r][c] = True
                    parent[(r, c)] = curr

    return None  # No path found



def dfs(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    visited = [[False]*cols for _ in range(rows)]
    parent = {}
    stack = [start]
    visited[start[0]][start[1]] = True

    while stack:
        curr = stack.pop()
        if curr == goal:
            tree = build_search_tree(start, parent)
            return reconstruct_path(parent, start, goal), tree

        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            r, c = curr[0]+dr, curr[1]+dc
            if 0<=r<rows and 0<=c<cols and not visited[r][c] and grid[r][c] != 'X':
                visited[r][c] = True
                parent[(r, c)] = curr
                stack.append((r, c))
    return None, None



def ucs(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    cost = {start: 0}
    parent = {}
    visited = set()
    heap = [(0, start)]

    while heap:
        curr_cost, curr = heapq.heappop(heap)
        if curr in visited:
            continue
        visited.add(curr)

        if curr == goal:
            tree = build_search_tree(start, parent)
            return reconstruct_path(parent, start, goal), tree

        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            r, c = curr[0]+dr, curr[1]+dc
            next_cell = (r, c)
            if 0<=r<rows and 0<=c<cols and grid[r][c] != 'X':
                new_cost = curr_cost + 1  # static cost, make dynamic if needed
                if next_cell not in cost or new_cost < cost[next_cell]:
                    cost[next_cell] = new_cost
                    parent[next_cell] = curr
                    heapq.heappush(heap, (new_cost, next_cell))
    return None, None



def heuristic(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

def astar(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    g_cost = {start: 0}
    f_cost = {start: heuristic(start, goal)}
    parent = {}
    heap = [(f_cost[start], start)]

    while heap:
        _, curr = heapq.heappop(heap)
        if curr == goal:
            tree = build_search_tree(start, parent)
            return reconstruct_path(parent, start, goal), tree

        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            r, c = curr[0]+dr, curr[1]+dc
            neighbor = (r, c)
            if 0<=r<rows and 0<=c<cols and grid[r][c] != 'X':
                tentative_g = g_cost[curr] + 1
                if neighbor not in g_cost or tentative_g < g_cost[neighbor]:
                    parent[neighbor] = curr
                    g_cost[neighbor] = tentative_g
                    f_cost[neighbor] = tentative_g + heuristic(neighbor, goal)
                    heapq.heappush(heap, (f_cost[neighbor], neighbor))
    return None, None




def best_first(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    parent = {}
    heap = [(heuristic(start, goal), start)]

    while heap:
        _, curr = heapq.heappop(heap)
        if curr == goal:
            tree = build_search_tree(start, parent)
            return reconstruct_path(parent, start, goal), tree

        visited.add(curr)

        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            r, c = curr[0]+dr, curr[1]+dc
            neighbor = (r, c)
            if 0<=r<rows and 0<=c<cols and grid[r][c] != 'X' and neighbor not in visited:
                parent[neighbor] = curr
                heapq.heappush(heap, (heuristic(neighbor, goal), neighbor))
                visited.add(neighbor)
    return None, None



def reconstruct_path(parent, start, goal):
    path = []
    curr = goal
    while curr != start:
        path.append([curr[0], curr[1]])
        curr = parent[curr]
    path.append([start[0], start[1]])
    path.reverse()
    return path



def build_search_tree(start, parent_map):
    def build(node):
        children = [child for child, parent in parent_map.items() if parent == node]
        return {
            "text": {"name": f"{node}"},
            "children": [build(child) for child in children]
        }
    return build(start)

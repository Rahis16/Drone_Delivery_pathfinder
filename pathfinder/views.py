from django.shortcuts import render
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from collections import deque
from .algorithms import bfs, dfs, ucs, astar, best_first


# Create your views here.
def home(request):
    return render(request, "home.html")


@csrf_exempt
def solve_grid(request):
    if request.method == "POST":
        grid = json.loads(request.POST.get("grid"))
        algorithm = request.POST.get("algorithm")

        start = None
        goal = None

        rows = len(grid)
        cols = len(grid[0])

        # Find S and G positions
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "S":
                    start = (r, c)
                elif grid[r][c] == "G":
                    goal = (r, c)

        if not start or not goal:
            return JsonResponse(
                {"success": False, "error": "Start or Goal not defined"}
            )

        # Select and run the chosen algorithm
        if algorithm == "bfs":
            path, tree = bfs(grid, start, goal)
        elif algorithm == "dfs":
            path, tree = dfs(grid, start, goal)
        elif algorithm == "ucs":
            path, tree = ucs(grid, start, goal)
        elif algorithm == "astar":
            path, tree = astar(grid, start, goal)
        elif algorithm == "bestfirst":
            path, tree = best_first(grid, start, goal)
        else:
            return JsonResponse({"success": False, "error": "Unsupported algorithm"})

        if path:
            return JsonResponse(
                {
                    "success": True,
                    "path": path,
                    "tree":tree,
                }
            )
        else:
            return JsonResponse({"success": False, "error": "No path found"})

    return JsonResponse({"success": False, "error": "Invalid request method"})

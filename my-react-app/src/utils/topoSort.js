// utils/topoSort.js
// Kahn's Algorithm for topological sorting of tasks by dependencies

// /**
//  * Topologically sorts tasks by their dependencies.
//  * @param {Array} tasks - Array of task objects, each with id and dependencies (array of ids)
//  * @returns {Array} Sorted array of tasks (or empty array if cycle detected)
//  */
export function topologicalSortTasks(tasks) {
  // Build graph
  const inDegree = {};
  const graph = {};
  tasks.forEach(task => {
    inDegree[task.id] = 0;
    graph[task.id] = [];
  });
  tasks.forEach(task => {
    (task.dependencies || []).forEach(dep => {
      if (graph[dep]) {
        graph[dep].push(task.id);
        inDegree[task.id]++;
      }
    });
  });

  // Kahn's algorithm
  const queue = Object.keys(inDegree).filter(id => inDegree[id] === 0);
  const sorted = [];
  while (queue.length) {
    const id = queue.shift();
    const task = tasks.find(t => String(t.id) === String(id));
    if (task) sorted.push(task);
    for (const neighbor of graph[id]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }
  // If not all tasks are sorted, there is a cycle
  if (sorted.length !== tasks.length) return [];
  return sorted;
}

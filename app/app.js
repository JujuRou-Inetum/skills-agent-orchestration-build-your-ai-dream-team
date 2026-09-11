const state = { projects: [], query: "", status: "all", sort: "priority" };
const priorityOrder = { High: 0, Medium: 1, Low: 2 };
const statusClass = { "In progress": "progress", Planning: "planning", "At risk": "risk", Complete: "complete" };
const grid = document.querySelector("#project-grid");
const loadingState = document.querySelector("#loading-state");
const errorState = document.querySelector("#error-state");
const emptyState = document.querySelector("#empty-state");

function setState(stateName) {
  loadingState.hidden = stateName !== "loading";
  errorState.hidden = stateName !== "error";
  emptyState.hidden = stateName !== "empty";
  grid.hidden = stateName !== "success";
}

function updateMetrics(projects) {
  const active = projects.filter((project) => project.status === "In progress").length;
  const attention = projects.filter((project) => project.priority === "High" || project.status === "At risk").length;
  const owners = new Set(projects.map((project) => project.owner)).size;
  document.querySelector('[data-metric="total"]').textContent = projects.length;
  document.querySelector('[data-metric="active"]').textContent = active;
  document.querySelector('[data-metric="attention"]').textContent = attention;
  document.querySelector('[data-metric="owners"]').textContent = owners;
}

function getVisibleProjects() {
  const query = state.query.toLowerCase();
  return state.projects.filter((project) => state.status === "all" || project.status === state.status).filter((project) => `${project.name} ${project.owner} ${project.summary}`.toLowerCase().includes(query)).sort((left, right) => {
    if (state.sort === "name") return left.name.localeCompare(right.name);
    if (state.sort === "recent") return right.activityOrder - left.activityOrder;
    return priorityOrder[left.priority] - priorityOrder[right.priority];
  });
}

function projectCard(project) {
  const badgeClass = statusClass[project.status] || "planning";
  return `<article class="project-card"><div class="card-topline"><span class="status-badge ${badgeClass}"><span class="status-dot" aria-hidden="true"></span>${project.status}</span><span class="priority priority-${project.priority.toLowerCase()}">${project.priority} priority</span></div><h3>${project.name}</h3><p class="project-summary">${project.summary}</p><div class="activity"><span class="activity-icon" aria-hidden="true">↗</span><span><strong>Recent activity</strong>${project.recentActivity}</span></div><div class="card-footer"><span class="owner-avatar" aria-hidden="true">${project.owner.split(" ").map((name) => name[0]).join("")}</span><span>Owned by <strong>${project.owner}</strong></span><span class="card-arrow" aria-hidden="true">→</span></div></article>`;
}

function render() {
  const projects = getVisibleProjects();
  document.querySelector("#result-count").textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;
  grid.innerHTML = projects.map(projectCard).join("");
  setState(projects.length ? "success" : "empty");
}

async function loadProjects() {
  setState("loading");
  try {
    const response = await fetch("project-data.json");
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.projects)) throw new Error("Invalid project data");
    state.projects = data.projects;
    updateMetrics(state.projects);
    render();
  } catch (error) {
    console.error(error);
    setState("error");
  }
}

document.querySelector("#search-input").addEventListener("input", (event) => { state.query = event.target.value; render(); });
document.querySelector("#status-filter").addEventListener("change", (event) => { state.status = event.target.value; render(); });
document.querySelector("#sort-select").addEventListener("change", (event) => { state.sort = event.target.value; render(); });
document.querySelector("#clear-button").addEventListener("click", () => { state.query = ""; state.status = "all"; document.querySelector("#search-input").value = ""; document.querySelector("#status-filter").value = "all"; render(); });
document.querySelector("#retry-button").addEventListener("click", loadProjects);
loadProjects();
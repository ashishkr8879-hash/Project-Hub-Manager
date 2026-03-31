const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

export interface Editor {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  clientName: string;
  projectName: string;
  totalValue: number;
  totalDeliverables: number;
  editorId: string;
  editorName: string;
  status: "pending" | "in_progress" | "completed";
  completedDeliverables: number;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalEditors: number;
  todayRevenue: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
}

export interface CreateProjectPayload {
  clientName: string;
  projectName: string;
  totalValue: number;
  totalDeliverables: number;
  editorId: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error((err as { error: string }).error || "Request failed");
  }
  return res.json();
}

export async function fetchEditors(): Promise<Editor[]> {
  return apiFetch<Editor[]>("/editors");
}

export async function fetchProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/projects");
}

export async function fetchEditorProjects(editorId: string): Promise<Project[]> {
  return apiFetch<Project[]>(`/projects/editor/${editorId}`);
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard/stats");
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  return apiFetch<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProjectStatus(
  id: string,
  status: Project["status"],
  completedDeliverables?: number
): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, completedDeliverables }),
  });
}

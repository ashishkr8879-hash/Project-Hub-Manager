const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Editor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  joinedAt: string;
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
  deadline?: string;
  notes?: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalEditors: number;
  todayRevenue: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  pendingReviews: number;
}

export interface VideoSubmission {
  id: string;
  projectId: string;
  editorId: string;
  editorName: string;
  fileName: string;
  fileSize: string;
  deliverableIndex: number;
  submittedAt: string;
  status: "pending_review" | "approved" | "rejected";
  reviewNote?: string;
  reviewedAt?: string;
  projectName?: string;
  clientName?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: "project_assigned" | "video_submitted" | "video_approved" | "video_rejected";
  title: string;
  message: string;
  projectId?: string;
  videoId?: string;
  read: boolean;
  createdAt: string;
}

export interface EditorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  joinedAt: string;
  stats: {
    totalProjects: number;
    completedProjects: number;
    inProgressProjects: number;
    pendingProjects: number;
    totalVideosUploaded: number;
    approvedVideos: number;
    rejectedVideos: number;
    pendingReviewVideos: number;
    totalEarnings: number;
  };
  recentProjects: Project[];
}

export interface LoginPayload { username: string; password: string; }
export interface LoginResponse { id: string; name: string; role: "admin" | "editor"; editorId?: string; }
export interface CreateProjectPayload {
  clientName: string; projectName: string; totalValue: number;
  totalDeliverables: number; editorId: string; deadline?: string; notes?: string;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

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

// ─── API functions ────────────────────────────────────────────────────────────

export const login = (p: LoginPayload) =>
  apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(p) });

export const fetchEditors = () => apiFetch<Editor[]>("/editors");
export const fetchProjects = () => apiFetch<Project[]>("/projects");
export const fetchEditorProjects = (id: string) => apiFetch<Project[]>(`/projects/editor/${id}`);
export const fetchDashboardStats = () => apiFetch<DashboardStats>("/dashboard/stats");

export const createProject = (p: CreateProjectPayload) =>
  apiFetch<Project>("/projects", { method: "POST", body: JSON.stringify(p) });

export const updateProjectStatus = (id: string, status: Project["status"], completedDeliverables?: number) =>
  apiFetch<Project>(`/projects/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, completedDeliverables }) });

export const fetchEditorProfile = (id: string) => apiFetch<EditorProfile>(`/editors/${id}/profile`);

export const fetchProjectVideos = (projectId: string) =>
  apiFetch<VideoSubmission[]>(`/projects/${projectId}/videos`);

export const fetchEditorVideos = (editorId: string) =>
  apiFetch<VideoSubmission[]>(`/videos/editor/${editorId}`);

export const fetchPendingVideos = () => apiFetch<VideoSubmission[]>("/videos/pending");

export const submitVideo = (projectId: string, body: { editorId: string; fileName: string; fileSize: string; deliverableIndex: number }) =>
  apiFetch<VideoSubmission>(`/projects/${projectId}/videos`, { method: "POST", body: JSON.stringify(body) });

export const reviewVideo = (videoId: string, action: "approve" | "reject", note?: string) =>
  apiFetch<VideoSubmission>(`/videos/${videoId}/review`, { method: "PATCH", body: JSON.stringify({ action, note }) });

export const fetchNotifications = (userId: string) =>
  apiFetch<AppNotification[]>(`/notifications/${userId}`);

export const markNotificationsRead = (userId: string, notifIds?: string[]) =>
  apiFetch<{ success: boolean }>("/notifications/mark-read", { method: "POST", body: JSON.stringify({ userId, notifIds }) });

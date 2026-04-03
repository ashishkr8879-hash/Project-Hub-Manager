const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Editor {
  id: string; name: string; email: string; username?: string;
  phone: string; specialization: string; joinedAt: string;
  bankAccount?: string; location?: string;
}

export interface EditorFull extends Editor {
  password: string;
}

export type ProjectType = "ugc" | "ai_video" | "editing" | "branded" | "corporate" | "wedding" | "social_media" | "graphic_design" | "ads_setup" | "website" | "other";

export interface Project {
  id: string;
  clientId?: string; clientName: string; clientPhone?: string; clientEmail?: string;
  projectName: string; projectType: ProjectType;
  totalValue: number; modelCost: number;
  totalDeliverables: number; editorId: string; editorName: string; editorPhone?: string;
  status: "pending" | "in_progress" | "completed";
  completedDeliverables: number;
  paidAmount: number;
  createdAt: string; deadline?: string; notes?: string; script?: string;
  revisionRequested: boolean;
}

export interface Client {
  id: string; name: string; phone: string; email: string;
  businessType: string; city: string; createdAt: string;
}

export interface ProjectReference {
  id: string; projectId: string; title: string;
  url?: string; fileName?: string; fileType?: string; note: string; addedAt: string;
}

export interface Message {
  id: string; projectId: string;
  senderId: string; senderName: string; senderRole: "admin" | "editor";
  text: string; fileName?: string; fileSize?: string; fileType?: string; isAudio?: boolean;
  readBy: string[]; createdAt: string;
}

export interface CalendarDay {
  count: number;
  projects: { id: string; projectName: string; clientName: string; status: string; projectType: string }[];
}

export interface DashboardStats {
  totalProjects: number; totalEditors: number; totalClients: number;
  todayRevenue: number; activeProjects: number; completedProjects: number;
  pendingProjects: number; pendingReviews: number; customisationProjects: number;
}

export interface VideoSubmission {
  id: string; projectId: string; editorId: string; editorName: string;
  fileName: string; fileSize: string; deliverableIndex: number;
  submittedAt: string; status: "pending_review" | "approved" | "rejected";
  reviewNote?: string; reviewedAt?: string;
  projectName?: string; clientName?: string;
}

export interface AppNotification {
  id: string; userId: string;
  type: "project_assigned" | "video_submitted" | "video_approved" | "video_rejected" | "message_received" | "revision_requested";
  title: string; message: string;
  projectId?: string; videoId?: string;
  read: boolean; createdAt: string;
}

export interface AdminProfile {
  id: string; name: string; businessName: string; email: string; phone: string;
  stats: {
    totalProjects: number; completedProjects: number; activeProjects: number;
    customisationProjects: number; totalClients: number; totalEditors: number;
    totalRevenue: number; netRevenue: number;
    totalUgcProjects: number; totalModelCost: number; pendingReviews: number;
  };
  recentClients: Client[];
}

export interface EditorProfile {
  id: string; name: string; email: string; phone: string;
  specialization: string; joinedAt: string;
  stats: {
    totalProjects: number; completedProjects: number; inProgressProjects: number;
    pendingProjects: number; customisationProjects: number;
    totalVideosUploaded: number; approvedVideos: number; rejectedVideos: number;
    pendingReviewVideos: number; totalEarnings: number;
  };
  recentProjects: Project[];
}

export type ProjectWithRevenue = Project & { companyRevenue: number };

export interface EditorAnalytics {
  id: string; name: string; email: string; phone: string;
  specialization: string; joinedAt: string;
  bankAccount?: string; location?: string; monthlySalary: number;
  stats: {
    totalProjects: number; completedProjects: number; inProgressProjects: number;
    pendingProjects: number; customisationProjects: number;
    totalVideosUploaded: number; approvedVideos: number; rejectedVideos: number;
    pendingReviewVideos: number; totalRevenue: number; companyProfit: number;
  };
  allProjects: ProjectWithRevenue[];
  projectsByDate: { date: string; projects: ProjectWithRevenue[]; dayRevenue: number }[];
}

export interface LoginPayload { username: string; password: string; }
export interface LoginResponse { id: string; name: string; role: "admin" | "editor"; editorId?: string; }

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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = (p: LoginPayload) =>
  apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(p) });

// ─── Admin ────────────────────────────────────────────────────────────────────

export const fetchAdminProfile = () => apiFetch<AdminProfile>("/admin/profile");

// ─── Clients ──────────────────────────────────────────────────────────────────

export const fetchClients = () => apiFetch<Client[]>("/clients");
export const createClient = (body: Omit<Client, "id" | "createdAt">) =>
  apiFetch<Client>("/clients", { method: "POST", body: JSON.stringify(body) });
export const deleteClient = (id: string) =>
  apiFetch<{ success: boolean }>(`/clients/${id}`, { method: "DELETE" });
export const fetchClientProjects = (clientId: string) =>
  apiFetch<{ client: Client; projects: Project[]; totalValue: number }>(`/clients/${clientId}/projects`);

// ─── Editors ──────────────────────────────────────────────────────────────────

export const fetchEditors = () => apiFetch<Editor[]>("/editors");
export const fetchEditorFull = (id: string) => apiFetch<EditorFull>(`/editors/${id}/full`);
export const fetchEditorProfile = (id: string) => apiFetch<EditorProfile>(`/editors/${id}/profile`);
export const fetchEditorAnalytics = (id: string) => apiFetch<EditorAnalytics>(`/editors/${id}/profile`);

export interface CreateEditorPayload {
  name: string; username: string; password: string; email?: string;
  phone: string; specialization: string; location?: string; bankAccount?: string;
}
export const createEditor = (p: CreateEditorPayload) =>
  apiFetch<Editor>("/editors", { method: "POST", body: JSON.stringify(p) });
export const deleteEditor = (id: string) =>
  apiFetch<{ success: boolean }>(`/editors/${id}`, { method: "DELETE" });
export const updateEditor = (id: string, p: Partial<CreateEditorPayload>) =>
  apiFetch<Editor>(`/editors/${id}`, { method: "PATCH", body: JSON.stringify(p) });

// ─── Projects ─────────────────────────────────────────────────────────────────

export const fetchProjects = () => apiFetch<Project[]>("/projects");
export const fetchEditorProjects = (id: string) => apiFetch<Project[]>(`/projects/editor/${id}`);
export const fetchDashboardStats = () => apiFetch<DashboardStats>("/dashboard/stats");

export interface CreateProjectPayload {
  clientId?: string; clientName: string; clientPhone?: string; clientEmail?: string;
  clientBusinessType?: string; clientCity?: string;
  projectName: string; projectType: ProjectType;
  totalValue: number; modelCost?: number; totalDeliverables: number;
  editorId: string; deadline?: string; notes?: string; script?: string;
}

export const createProject = (p: CreateProjectPayload) =>
  apiFetch<Project>("/projects", { method: "POST", body: JSON.stringify(p) });

export const updateProjectPayment = (id: string, paidAmount: number) =>
  apiFetch<Project>(`/projects/${id}/payment`, { method: "PATCH", body: JSON.stringify({ paidAmount }) });

export const updateProjectStatus = (id: string, status: Project["status"], completedDeliverables?: number) =>
  apiFetch<Project>(`/projects/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, completedDeliverables }) });

export const setRevision = (projectId: string, revisionRequested: boolean) =>
  apiFetch<Project>(`/projects/${projectId}/revision`, { method: "PATCH", body: JSON.stringify({ revisionRequested }) });

// ─── Calendar ─────────────────────────────────────────────────────────────────

export const fetchCalendar = (month: string, editorId?: string) =>
  apiFetch<Record<string, CalendarDay>>(`/projects/calendar?month=${month}${editorId ? `&editorId=${editorId}` : ""}`);

// ─── References ───────────────────────────────────────────────────────────────

export const fetchProjectReferences = (projectId: string) =>
  apiFetch<ProjectReference[]>(`/projects/${projectId}/references`);

export const addReference = (projectId: string, body: { title: string; url?: string; note: string; fileName?: string; fileType?: string }) =>
  apiFetch<ProjectReference>(`/projects/${projectId}/references`, { method: "POST", body: JSON.stringify(body) });

export const deleteReference = (id: string) =>
  apiFetch<{ success: boolean }>(`/references/${id}`, { method: "DELETE" });

// ─── Messages ─────────────────────────────────────────────────────────────────

export const fetchMessages = (projectId: string) =>
  apiFetch<Message[]>(`/projects/${projectId}/messages`);

export const sendMessage = (projectId: string, body: {
  senderId: string; senderName: string; senderRole: "admin" | "editor";
  text: string; fileName?: string; fileSize?: string; fileType?: string; isAudio?: boolean;
}) => apiFetch<Message>(`/projects/${projectId}/messages`, { method: "POST", body: JSON.stringify(body) });

export const markMessagesRead = (projectId: string, userId: string) =>
  apiFetch<{ success: boolean }>(`/projects/${projectId}/messages/mark-read`, { method: "POST", body: JSON.stringify({ userId }) });

export const deleteMessage = (projectId: string, messageId: string, requesterId: string) =>
  apiFetch<{ success: boolean }>(`/projects/${projectId}/messages/${messageId}`, { method: "DELETE", body: JSON.stringify({ requesterId }) });

// ─── Videos ───────────────────────────────────────────────────────────────────

export const fetchEditorVideos = (editorId: string) =>
  apiFetch<VideoSubmission[]>(`/videos/editor/${editorId}`);

export const fetchPendingVideos = () => apiFetch<VideoSubmission[]>("/videos/pending");

export const submitVideo = (projectId: string, body: { editorId: string; fileName: string; fileSize: string; deliverableIndex: number }) =>
  apiFetch<VideoSubmission>(`/projects/${projectId}/videos`, { method: "POST", body: JSON.stringify(body) });

export const reviewVideo = (videoId: string, action: "approve" | "reject", note?: string) =>
  apiFetch<VideoSubmission>(`/videos/${videoId}/review`, { method: "PATCH", body: JSON.stringify({ action, note }) });

// ─── Notifications ────────────────────────────────────────────────────────────

export const fetchNotifications = (userId: string) =>
  apiFetch<AppNotification[]>(`/notifications/${userId}`);

export const markNotificationsRead = (userId: string, notifIds?: string[]) =>
  apiFetch<{ success: boolean }>("/notifications/mark-read", { method: "POST", body: JSON.stringify({ userId, notifIds }) });

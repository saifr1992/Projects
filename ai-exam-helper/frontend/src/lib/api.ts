import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { demoApi } from "./demoData";

export const API_BASE_URL = "demo://local";

const TOKEN_KEY = "exam_helper_token";

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      tokenStore.clear();
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/signup"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export type ApiError = AxiosError<{ detail?: string }>;

export function extractError(err: unknown, fallback = "Something went wrong"): string {
  const e = err as ApiError;
  return e?.response?.data?.detail ?? e?.message ?? fallback;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function makeResponse<T>(
  data: T,
  status: number,
  config: InternalAxiosRequestConfig,
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status < 400 ? "OK" : "Error",
    headers: {},
    config,
    request: {},
  };
}

function rejectWith(
  status: number,
  detail: string,
  config: InternalAxiosRequestConfig,
): Promise<never> {
  const response = makeResponse({ detail }, status, config);
  const error = new AxiosError(
    detail,
    String(status),
    config,
    {},
    response,
  );
  return Promise.reject(error);
}

function parseBody(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (raw instanceof FormData) {
    const obj: Record<string, unknown> = {};
    raw.forEach((value, key) => {
      if (value instanceof File) {
        obj[key] = { name: value.name, size: value.size };
      } else {
        obj[key] = value;
      }
    });
    return obj;
  }
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function currentUserId(): number | null {
  const user = demoApi.getMeFromToken(tokenStore.get());
  return user?.id ?? null;
}

function route(
  method: string,
  url: string,
  params: Record<string, unknown>,
  body: Record<string, unknown>,
): unknown {
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+/, "/");

  if (method === "post" && path === "/api/auth/login") {
    return demoApi.login(String(body.email ?? ""), String(body.password ?? ""));
  }
  if (method === "post" && path === "/api/auth/signup") {
    return demoApi.signup(
      String(body.name ?? ""),
      String(body.email ?? ""),
      String(body.password ?? ""),
    );
  }
  if (method === "get" && path === "/api/auth/me") {
    const user = demoApi.getMeFromToken(tokenStore.get());
    if (!user) {
      const e: any = new Error("Not authenticated");
      e.status = 401;
      e.detail = "Not authenticated";
      throw e;
    }
    return user;
  }

  if (method === "get" && path === "/api/papers/subjects") {
    return demoApi.listSubjects();
  }
  if (method === "get" && path === "/api/papers") {
    return demoApi.listPapers(
      params.q as string | undefined,
      params.subject as string | undefined,
      params.year !== undefined ? Number(params.year) : undefined,
    );
  }
  if (method === "post" && path === "/api/papers") {
    const userId = currentUserId() ?? 1;
    const file = body.file as { name?: string } | undefined;
    return demoApi.uploadPaper(
      {
        title: String(body.title ?? ""),
        subject: String(body.subject ?? ""),
        year: Number(body.year ?? new Date().getFullYear()),
        semester: body.semester ? String(body.semester) : undefined,
        description: body.description ? String(body.description) : undefined,
        file_name: file?.name,
      },
      userId,
    );
  }
  const paperDelete = /^\/api\/papers\/(\d+)$/.exec(path);
  if (method === "delete" && paperDelete) {
    demoApi.deletePaper(Number(paperDelete[1]));
    return { ok: true };
  }

  if (method === "get" && path === "/api/chat/sessions") {
    return demoApi.listSessions();
  }
  const sessionGet = /^\/api\/chat\/sessions\/(\d+)$/.exec(path);
  if (method === "get" && sessionGet) {
    const session = demoApi.getSession(Number(sessionGet[1]));
    if (!session) {
      const e: any = new Error("Session not found");
      e.status = 404;
      e.detail = "Session not found";
      throw e;
    }
    return session;
  }
  if (method === "delete" && sessionGet) {
    demoApi.deleteSession(Number(sessionGet[1]));
    return { ok: true };
  }
  if (method === "post" && path === "/api/chat/send") {
    return demoApi.sendMessage(
      String(body.content ?? ""),
      body.session_id !== undefined ? Number(body.session_id) : undefined,
      body.paper_id !== undefined ? Number(body.paper_id) : undefined,
    );
  }

  if (method === "get" && path === "/api/quiz") {
    return demoApi.listQuizzes();
  }
  if (method === "post" && path === "/api/quiz/generate") {
    return demoApi.generateQuiz({
      paper_id: body.paper_id !== undefined ? Number(body.paper_id) : undefined,
      topic: body.topic ? String(body.topic) : undefined,
      num_questions: Number(body.num_questions ?? 5),
      difficulty: (body.difficulty as "easy" | "medium" | "hard") ?? "medium",
    });
  }
  const quizSubmit = /^\/api\/quiz\/(\d+)\/submit$/.exec(path);
  if (method === "post" && quizSubmit) {
    return demoApi.submitQuiz(
      Number(quizSubmit[1]),
      (body.answers as number[]) ?? [],
    );
  }

  if (method === "get" && path === "/api/admin/users") {
    return demoApi.listUsers();
  }
  if (method === "get" && path === "/api/admin/stats") {
    return demoApi.stats();
  }
  const userDelete = /^\/api\/admin\/users\/(\d+)$/.exec(path);
  if (method === "delete" && userDelete) {
    demoApi.deleteUser(Number(userDelete[1]));
    return { ok: true };
  }

  const e: any = new Error(`Demo: unhandled ${method.toUpperCase()} ${path}`);
  e.status = 404;
  e.detail = `Demo: unhandled ${method.toUpperCase()} ${path}`;
  throw e;
}

api.defaults.adapter = async (config) => {
  await delay(120);
  const method = (config.method ?? "get").toLowerCase();
  const url = config.url ?? "";
  const params = (config.params as Record<string, unknown>) ?? {};
  const body = parseBody(config.data);

  try {
    const data = route(method, url, params, body);
    return makeResponse(data, 200, config);
  } catch (err: any) {
    const status = err?.status ?? 500;
    const detail = err?.detail ?? err?.message ?? "Demo error";
    return rejectWith(status, detail, config);
  }
};

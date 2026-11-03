const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// User information returned by the backend
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

// Authentication response
export interface AuthResponse {
  message: string;
  user: AuthUser;
}

// API error response
interface ApiError {
  detail?: string | { msg?: string }[];
  message?: string;
}

// Common request handler for authentication endpoints
async function authRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/v1/auth${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to MedSearch AI. Make sure the backend is running."
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = data as ApiError | null;
    const detail = errorData?.detail;

    let message = "Authentication failed. Please try again.";

    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      message = detail
        .map((item) => item.msg || "Invalid input")
        .join(", ");
    } else if (typeof errorData?.message === "string") {
      message = errorData.message;
    }

    throw new Error(message);
  }

  if (data === null) {
    throw new Error("The server returned an invalid response.");
  }

  return data as T;
}

// Register a new user
export async function signup(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return authRequest<AuthResponse>("/signup", {
    method: "POST",
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      password,
    }),
  });
}

// Sign in an existing user
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return authRequest<AuthResponse>("/login", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });
}

// Get the currently authenticated user
export async function getCurrentUser(): Promise<{
  user: AuthUser;
}> {
  return authRequest<{ user: AuthUser }>("/me");
}

// Sign out and invalidate the server-side session
export async function logout(): Promise<{ message: string }> {
  return authRequest<{ message: string }>("/logout", {
    method: "POST",
  });
}

// Check whether the current session is valid
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await getCurrentUser();
    return Boolean(response.user?.id && response.user.is_active);
  } catch {
    return false;
  }
}
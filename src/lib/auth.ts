import api from "./axios";

export interface RegisterUserPayload {
  username: string;
  email: string;
  password: string;
}

export interface RegisteredUser {
  id: string;
  last_login: string | null;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
  role: string;
  verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  login_ip: string | null;
  // Ya no usamos `any[]`, sino `unknown[]`
  groups: unknown[];
  user_permissions: unknown[];
}

export const registerUser = async (
  data: RegisterUserPayload
): Promise<RegisteredUser> => {
  const response = await api.post<RegisteredUser>("/auth/users/", data);
  return response.data;
};

export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: {
    refresh: string;
    access: string;
  };
  user: {
    email: string;
    username: string;
  };
}

export const loginUser = async (
  data: LoginUserPayload
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/authentication/login/",
    data
  );
  return response.data;
};

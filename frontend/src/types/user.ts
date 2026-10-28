/** User (docs/API.md §4.6). */
export type Role = "admin" | "agent";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: "active" | "inactive";
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  agent: {
    id: string;
    agent_code: string;
    whatsapp_number: string;
    bio: string | null;
    service_area: string | null;
    joined_at: string | null;
  } | null;
}

export interface LoginResponse {
  user: User;
  access_expires_at: string;
}

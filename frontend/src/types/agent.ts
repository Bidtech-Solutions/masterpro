export interface AgentListingCounts {
  total: number;
  draft: number;
  active: number;
  sold: number;
  rented: number;
  inactive: number;
}

export interface AgentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  avatar_url: string | null;
  last_login_at: string | null;
}

export interface Agent {
  id: string;
  agent_code: string;
  whatsapp_number: string;
  bio: string | null;
  service_area: string | null;
  joined_at: string | null;
  user: AgentUser;
  listing_counts: AgentListingCounts;
  created_at: string;
  updated_at: string;
}

export interface AgentOption {
  id: string;
  agent_code: string;
  name: string;
  status: "active" | "inactive";
}

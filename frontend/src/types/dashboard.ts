export interface PropertiesSummary {
  total: number;
  draft: number;
  active: number;
  sold: number;
  rented: number;
  inactive: number;
}

export interface AgentsSummary {
  total: number;
  active: number;
}

export interface TotalsSummary {
  view_count: number;
  whatsapp_click_count: number;
}

export interface TopViewedProperty {
  id: string;
  code: string;
  title: string;
  property_type: string;
  city_name: string;
  district?: string | null;
  view_count: number;
  whatsapp_click_count: number;
  cover_image_url?: string | null;
}

export interface RecentProperty {
  id: string;
  code: string;
  title: string;
  status: string;
  updated_at: string;
}

export interface DashboardSummaryResponse {
  properties: PropertiesSummary;
  agents?: AgentsSummary | null;
  totals: TotalsSummary;
  top_viewed: TopViewedProperty[];
  recently_updated: RecentProperty[];
}

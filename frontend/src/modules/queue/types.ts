export enum QueueStatus {
  BOOKED = 'BOOKED',
  ARRIVED = 'ARRIVED',
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  RETURN_LATER = 'RETURN_LATER',
  CANCELLED = 'CANCELLED',
}

export interface Branch {
  id: string;
  name: string;
  lat: number;
  lng: number;
  active_desks: number;
  total_desks: number;
  rush_mode: boolean;
}

export interface Service {
  id: string;
  name: string;
  base_duration_minutes: number;
  priority_level: number;
  required_docs: string[];
}

export interface Token {
  id: string;
  token_number: string;
  user?: any;
  branch?: any;
  service?: any;
  booking_type: string;
  status: QueueStatus;
  priority: number;
  desk_number?: number | null;
  expected_service_time: string;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  delay_reported_minutes?: number | null;
  rating?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface AdvanceTokenRequest {
  new_status: QueueStatus;
}

export interface AnalyticsData {
  active_desks: number;
  total_desks: number;
  avg_wait_minutes: number;
  tokens_served_today: number;
  tokens_waiting: number;
  no_show_count: number;
  no_show_percentage: number;
  rush_mode: boolean;
}

export interface JSendResponse<T> {
  status: 'success' | 'fail' | 'error';
  data: T;
  message?: string;
}

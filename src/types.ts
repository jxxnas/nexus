export type TicketStatus = 'Open' | 'On Hold' | 'Closed Complete' | 'Failed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketType = 'Incident' | 'Request' | 'Onboarding' | 'Task' | 'Facility';

export interface Group {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'Agent' | 'Admin' | 'User' | 'Worker';
  group_ids?: string[]; // JSON string in DB
}

export interface Comment {
  id: number;
  ticket_id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  group_id: string;
  group_name?: string;
  assigned_to?: string;
  assigned_name?: string;
  parent_id?: string;
  opener?: string; // This will be the requested_for_name if manual
  opener_email?: string; // This will be the requested_for_email if manual
  opened_by?: string; // user_id of the person who created it
  opened_by_name?: string;
  requested_for_id?: string; // user_id of the person it's for
  requested_for_name?: string;
  requested_for_email?: string;
  created_at: string;
  updated_at: string;
  dynamic_fields: Record<string, any>;
  children?: Ticket[];
  comments?: Comment[];
}

export interface TicketTemplate {
  id: string;
  trigger_type: TicketType;
  child_task_title: string;
  child_task_group_id: string;
}

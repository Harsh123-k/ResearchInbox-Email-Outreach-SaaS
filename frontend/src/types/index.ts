export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Sender {
  id: string;
  user_id: string;
  name: string;
  email: string;
  is_default: number;
}

export interface EmailItem {
  id: string;
  campaign_id: string;
  user_id: string;
  sender_id: string;
  sender_email: string;
  sender_name: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: 'Scheduled' | 'Sending' | 'Sent' | 'Failed' | 'Cancelled';
  scheduled_time: string;
  sent_at?: string;
  error_message?: string;
  preview_url?: string;
  created_at: string;
}

export interface SlackStatus {
  connected: boolean;
  teamName?: string;
  channelName?: string;
  connectedAt?: string;
}

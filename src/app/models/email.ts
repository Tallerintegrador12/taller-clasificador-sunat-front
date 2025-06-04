import {Attachment} from './attachment';

export interface Email {
  id: number;
  from: string;
  fromName: string;
  subject: string;
  preview: string;
  content?: string;
  time: string;
  read: boolean;
  starred: boolean;
  priority: 'high' | 'medium' | 'low';
  labels: string[];
  hasAttachment: boolean;
  folder: string;
  avatar: string;
  attachments?: Attachment[];
}

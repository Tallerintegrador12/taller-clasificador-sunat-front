export interface EmailFilters {
  read: boolean | null;
  starred: boolean | null;
  priority: string | null;
  hasAttachment: boolean | null;
  labels: string[];
}

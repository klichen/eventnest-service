export interface EventEntity {
  id: string;
  clubId: string;
  title: string;
  description: string | null;
  location: string;
  incentives: string | null;
  startDatetime: Date;
  endDatetime: Date | null;
  campuses: string[] | null;
}

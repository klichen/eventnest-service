export interface EventEntity {
  id: string;
  clubId: string;
  imageUrl: string;
  title: string;
  location: string;
  incentives: string | null;
  startDatetime: Date;
  endDatetime: Date | null;
  campuses: string[] | null;
}

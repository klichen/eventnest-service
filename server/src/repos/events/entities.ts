export interface EventEntity {
  id: string;
  clubId: string;
  imageUrl: string;
  postUrl: string;
  title: string;
  description: string | null;
  location: string;
  incentives: string | null;
  startDatetime: Date;
  endDatetime: Date | null;
  campuses: string[] | null;
}

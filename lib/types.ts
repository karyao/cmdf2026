export interface PhotoRecord {
  _id: string;
  image_url: string;
  timestamp: string;
  prompt?: string;
  user_id?: string;
  event_id?: string;
}

export interface CreatePhotoInput {
  imageData: string;
  prompt?: string;
  userId?: string;
  eventId?: string;
}

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  image?: string;
  provider: string;
  providerId: string;
  createdAt: string;
}

export interface EventRecord {
  _id: string;
  title: string;
  type: "public" | "private";
  city: string;
  intervalMinutes: number;
  createdBy: string;
  members: string[];
  createdAt: string;
}

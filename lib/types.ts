export interface PhotoRecord {
  _id: string;
  image_url: string;
  timestamp: string;
  prompt?: string;
  user_id?: string;
}

export interface CreatePhotoInput {
  imageData: string;
  prompt?: string;
  userId?: string;
}

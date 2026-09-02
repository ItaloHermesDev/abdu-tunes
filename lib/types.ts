export type Profile = {
  id: string;
  userId: string;
  name: string;
  avatarPath: string | null;
  avatarUrl: string | null;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  profileId: string;
  profileName: string;
  avatarUrl: string | null;
};

export type AlbumRecord = {
  id: string;
  userId: string;
  profileId: string;
  title: string;
  description: string | null;
  coverPath: string | null;
  createdAt: string;
  updatedAt: string;
  trackCount: number;
  coverUrl: string | null;
};

export type TrackRecord = {
  id: string;
  userId: string;
  profileId: string;
  albumId: string | null;
  albumTitle: string | null;
  title: string;
  artist: string;
  duration: number;
  filePath: string;
  thumbnailPath: string | null;
  youtubeUrl: string | null;
  youtubeId: string | null;
  mimeType: string;
  isFavorite: boolean;
  createdAt: string;
  streamUrl: string;
  coverUrl: string | null;
};

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  streamUrl: string;
  coverUrl: string | null;
  isFavorite: boolean;
  albumTitle: string | null;
};

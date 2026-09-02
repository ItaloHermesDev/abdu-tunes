import "server-only";

import { exec, query } from "@/lib/mysql";
import { mediaUrl } from "@/lib/utils";
import type { AlbumRecord, Profile, TrackRecord } from "@/lib/types";

export async function initDb() {
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(120) NOT NULL,
      avatar_path TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_profiles_user (user_id),
      CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await exec(`
    CREATE TABLE IF NOT EXISTS albums (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      profile_id VARCHAR(36) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      cover_path TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_albums_user (user_id),
      INDEX idx_albums_profile (profile_id),
      CONSTRAINT fk_albums_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      profile_id VARCHAR(36) NOT NULL,
      album_id VARCHAR(36),
      title VARCHAR(255) NOT NULL,
      artist VARCHAR(190) NOT NULL DEFAULT 'Desconhecido',
      duration INT NOT NULL DEFAULT 0,
      file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      youtube_url TEXT,
      youtube_id VARCHAR(32),
      mime_type VARCHAR(80) NOT NULL DEFAULT 'audio/mpeg',
      is_favorite TINYINT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tracks_user (user_id),
      INDEX idx_tracks_profile (profile_id),
      INDEX idx_tracks_album (album_id),
      INDEX idx_tracks_favorite (profile_id, is_favorite),
      CONSTRAINT fk_tracks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await migrateProfileColumns();
}

async function tableColumns(table: string) {
  const result = await query(
    `SELECT COLUMN_NAME as name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  return new Set(result.rows.map((row) => String(row.name)));
}

async function addColumn(table: string, definition: string) {
  const name = definition.split(" ")[0];
  const columns = await tableColumns(table);
  if (!columns.has(name)) {
    await exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

async function migrateProfileColumns() {
  await addColumn("albums", "profile_id VARCHAR(36) NULL");
  await addColumn("tracks", "profile_id VARCHAR(36) NULL");

  const users = await query("SELECT id, name FROM users");
  for (const user of users.rows) {
    const userId = String(user.id);
    const existing = await query(
      "SELECT id FROM profiles WHERE user_id = ? ORDER BY created_at ASC LIMIT 1",
      [userId],
    );
    let profileId = existing.rows[0] ? String(existing.rows[0].id) : "";
    if (!profileId) {
      profileId = crypto.randomUUID();
      await exec("INSERT INTO profiles (id, user_id, name) VALUES (?, ?, ?)", [
        profileId,
        userId,
        String(user.name),
      ]);
    }
    await exec(
      "UPDATE albums SET profile_id = ? WHERE user_id = ? AND (profile_id IS NULL OR profile_id = '')",
      [profileId, userId],
    );
    await exec(
      "UPDATE tracks SET profile_id = ? WHERE user_id = ? AND (profile_id IS NULL OR profile_id = '')",
      [profileId, userId],
    );
  }
}

function asProfile(row: Record<string, unknown>): Profile {
  const avatarPath = (row.avatar_path as string | null) ?? null;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    avatarPath,
    avatarUrl: mediaUrl("avatars", avatarPath),
  };
}

function asAlbum(row: Record<string, unknown>): AlbumRecord {
  const coverPath = (row.cover_path as string | null) ?? null;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    profileId: String(row.profile_id ?? ""),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    coverPath,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    trackCount: Number(row.track_count ?? 0),
    coverUrl: mediaUrl("covers", coverPath),
  };
}

function asTrack(row: Record<string, unknown>): TrackRecord {
  const thumbnailPath = (row.thumbnail_path as string | null) ?? null;
  const albumCover = (row.album_cover as string | null) ?? null;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    profileId: String(row.profile_id ?? ""),
    albumId: (row.album_id as string | null) ?? null,
    albumTitle: (row.album_title as string | null) ?? null,
    title: String(row.title),
    artist: String(row.artist),
    duration: Number(row.duration ?? 0),
    filePath: String(row.file_path),
    thumbnailPath,
    youtubeUrl: (row.youtube_url as string | null) ?? null,
    youtubeId: (row.youtube_id as string | null) ?? null,
    mimeType: String(row.mime_type ?? "audio/mpeg"),
    isFavorite: Boolean(row.is_favorite),
    createdAt: String(row.created_at),
    streamUrl: `/api/stream/${row.id}`,
    coverUrl: mediaUrl("covers", thumbnailPath || albumCover),
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  await initDb();
  const id = crypto.randomUUID();
  await exec("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)", [
    id,
    input.name,
    input.email.toLowerCase(),
    input.passwordHash,
  ]);
  const profile = await getDefaultProfile(id);
  return { id, name: input.name, email: input.email.toLowerCase(), profileId: profile.id };
}

export async function findUserByEmail(email: string) {
  await initDb();
  const result = await query(
    "SELECT id, name, email, password_hash as passwordHash FROM users WHERE email = ?",
    [email.toLowerCase()],
  );
  const row = result.rows[0] as unknown as
    | { id: string; name: string; email: string; passwordHash: string }
    | undefined;
  return row ?? null;
}

export async function findUserById(id: string) {
  await initDb();
  const result = await query("SELECT id, name, email FROM users WHERE id = ?", [id]);
  const row = result.rows[0] as unknown as
    | { id: string; name: string; email: string }
    | undefined;
  return row ?? null;
}

export async function createProfile(userId: string, name: string) {
  await initDb();
  const id = crypto.randomUUID();
  await exec("INSERT INTO profiles (id, user_id, name) VALUES (?, ?, ?)", [
    id,
    userId,
    name.trim(),
  ]);
  const profile = await getProfile(userId, id);
  if (!profile) throw new Error("Falha ao criar perfil.");
  return profile;
}

export async function listProfiles(userId: string) {
  await initDb();
  const result = await query(
    "SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at ASC",
    [userId],
  );
  return result.rows.map((row) => asProfile(row));
}

export async function getProfile(userId: string, profileId: string) {
  await initDb();
  const result = await query("SELECT * FROM profiles WHERE user_id = ? AND id = ?", [
    userId,
    profileId,
  ]);
  const row = result.rows[0];
  return row ? asProfile(row) : null;
}

export async function getDefaultProfile(userId: string) {
  const profiles = await listProfiles(userId);
  return profiles[0] ?? (await createProfile(userId, "Perfil"));
}

export async function updateProfile(
  userId: string,
  profileId: string,
  patch: { name?: string; avatarPath?: string | null },
) {
  const profile = await getProfile(userId, profileId);
  if (!profile) return null;
  await exec("UPDATE profiles SET name = ?, avatar_path = ? WHERE id = ? AND user_id = ?", [
    patch.name?.trim() || profile.name,
    patch.avatarPath === undefined ? profile.avatarPath : patch.avatarPath,
    profileId,
    userId,
  ]);
  return getProfile(userId, profileId);
}

export async function deleteProfile(userId: string, profileId: string) {
  const profiles = await listProfiles(userId);
  if (profiles.length <= 1) {
    throw new Error("Mantenha pelo menos um perfil.");
  }
  await exec("DELETE FROM tracks WHERE profile_id = ? AND user_id = ?", [profileId, userId]);
  await exec("DELETE FROM albums WHERE profile_id = ? AND user_id = ?", [profileId, userId]);
  await exec("DELETE FROM profiles WHERE id = ? AND user_id = ?", [profileId, userId]);
}

const ALBUM_SELECT = `
  SELECT
    a.id, a.user_id, a.profile_id, a.title, a.description, a.cover_path,
    a.created_at, a.updated_at, COUNT(t.id) as track_count
  FROM albums a
  LEFT JOIN tracks t ON t.album_id = a.id
`;

export async function listAlbums(profileId: string) {
  await initDb();
  const result = await query(
    `${ALBUM_SELECT} WHERE a.profile_id = ? GROUP BY a.id, a.user_id, a.profile_id, a.title, a.description, a.cover_path, a.created_at, a.updated_at ORDER BY a.updated_at DESC`,
    [profileId],
  );
  return result.rows.map((row) => asAlbum(row));
}

export async function getAlbum(profileId: string, albumId: string) {
  await initDb();
  const result = await query(
    `${ALBUM_SELECT} WHERE a.profile_id = ? AND a.id = ? GROUP BY a.id, a.user_id, a.profile_id, a.title, a.description, a.cover_path, a.created_at, a.updated_at`,
    [profileId, albumId],
  );
  const row = result.rows[0];
  return row ? asAlbum(row) : null;
}

export async function createAlbum(input: {
  userId: string;
  profileId: string;
  title: string;
  description?: string | null;
  coverPath?: string | null;
}) {
  await initDb();
  const id = crypto.randomUUID();
  await exec(
    "INSERT INTO albums (id, user_id, profile_id, title, description, cover_path) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      input.userId,
      input.profileId,
      input.title,
      input.description ?? null,
      input.coverPath ?? null,
    ],
  );
  return getAlbum(input.profileId, id);
}

export async function updateAlbum(
  profileId: string,
  albumId: string,
  patch: { title?: string; description?: string | null; coverPath?: string | null },
) {
  const album = await getAlbum(profileId, albumId);
  if (!album) return null;
  await exec(
    "UPDATE albums SET title = ?, description = ?, cover_path = ? WHERE id = ? AND profile_id = ?",
    [
      patch.title ?? album.title,
      patch.description === undefined ? album.description : patch.description,
      patch.coverPath === undefined ? album.coverPath : patch.coverPath,
      albumId,
      profileId,
    ],
  );
  return getAlbum(profileId, albumId);
}

export async function deleteAlbum(profileId: string, albumId: string) {
  await initDb();
  await exec("UPDATE tracks SET album_id = NULL WHERE profile_id = ? AND album_id = ?", [
    profileId,
    albumId,
  ]);
  await exec("DELETE FROM albums WHERE id = ? AND profile_id = ?", [albumId, profileId]);
}

const TRACK_SELECT = `
  SELECT t.*, a.title as album_title, a.cover_path as album_cover
  FROM tracks t
  LEFT JOIN albums a ON a.id = t.album_id
`;

export async function listTracks(
  profileId: string,
  options: {
    albumId?: string;
    loose?: boolean;
    favorite?: boolean;
    query?: string;
    limit?: number;
  } = {},
) {
  await initDb();
  const clauses = ["t.profile_id = ?"];
  const args: Array<string | number | null> = [profileId];

  if (options.albumId) {
    clauses.push("t.album_id = ?");
    args.push(options.albumId);
  }
  if (options.loose) {
    clauses.push("t.album_id IS NULL");
  }
  if (options.favorite) {
    clauses.push("t.is_favorite = 1");
  }
  if (options.query) {
    clauses.push("(LOWER(t.title) LIKE ? OR LOWER(t.artist) LIKE ? OR LOWER(IFNULL(a.title, '')) LIKE ?)");
    const like = `%${options.query.toLowerCase()}%`;
    args.push(like, like, like);
  }

  const limit = options.limit ?? 400;
  const result = await query(
    `${TRACK_SELECT} WHERE ${clauses.join(" AND ")} ORDER BY t.created_at DESC LIMIT ?`,
    [...args, limit],
  );
  return result.rows.map((row) => asTrack(row));
}

export async function getTrack(userId: string, trackId: string) {
  await initDb();
  const result = await query(`${TRACK_SELECT} WHERE t.user_id = ? AND t.id = ?`, [
    userId,
    trackId,
  ]);
  const row = result.rows[0];
  return row ? asTrack(row) : null;
}

export async function createTrack(input: {
  userId: string;
  profileId: string;
  albumId?: string | null;
  title: string;
  artist: string;
  duration: number;
  filePath: string;
  thumbnailPath?: string | null;
  youtubeUrl?: string | null;
  youtubeId?: string | null;
  mimeType?: string;
}) {
  await initDb();
  const id = crypto.randomUUID();
  await exec(
    `INSERT INTO tracks (
      id, user_id, profile_id, album_id, title, artist, duration, file_path,
      thumbnail_path, youtube_url, youtube_id, mime_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.profileId,
      input.albumId ?? null,
      input.title,
      input.artist,
      input.duration,
      input.filePath,
      input.thumbnailPath ?? null,
      input.youtubeUrl ?? null,
      input.youtubeId ?? null,
      input.mimeType ?? "audio/mpeg",
    ],
  );

  if (input.albumId && input.thumbnailPath) {
    const album = await getAlbum(input.profileId, input.albumId);
    if (album && !album.coverPath) {
      await updateAlbum(input.profileId, input.albumId, {
        coverPath: input.thumbnailPath,
      });
    }
  }

  return getTrack(input.userId, id);
}

export async function updateTrack(
  userId: string,
  trackId: string,
  patch: { albumId?: string | null; isFavorite?: boolean; title?: string; artist?: string },
) {
  const track = await getTrack(userId, trackId);
  if (!track) return null;
  await exec(
    "UPDATE tracks SET album_id = ?, is_favorite = ?, title = ?, artist = ? WHERE id = ? AND user_id = ?",
    [
      patch.albumId === undefined ? track.albumId : patch.albumId,
      patch.isFavorite === undefined ? Number(track.isFavorite) : Number(patch.isFavorite),
      patch.title ?? track.title,
      patch.artist ?? track.artist,
      trackId,
      userId,
    ],
  );
  return getTrack(userId, trackId);
}

export async function deleteTrack(userId: string, trackId: string) {
  const track = await getTrack(userId, trackId);
  if (!track) return null;
  await exec("DELETE FROM tracks WHERE id = ? AND user_id = ?", [trackId, userId]);
  return track;
}

export async function libraryStats(profileId: string) {
  await initDb();
  const result = await query(
    `SELECT
      (SELECT COUNT(*) FROM tracks WHERE profile_id = ?) as tracks,
      (SELECT COUNT(*) FROM albums WHERE profile_id = ?) as albums,
      (SELECT COUNT(*) FROM tracks WHERE profile_id = ? AND is_favorite = 1) as favorites,
      (SELECT COUNT(*) FROM tracks WHERE profile_id = ? AND album_id IS NULL) as loose`,
    [profileId, profileId, profileId, profileId],
  );
  const row = result.rows[0] ?? {};
  return {
    tracks: Number(row.tracks),
    albums: Number(row.albums),
    favorites: Number(row.favorites),
    loose: Number(row.loose),
  };
}

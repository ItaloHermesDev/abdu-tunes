import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")];
    }),
);

const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectTimeout: 15000,
  multipleStatements: true,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS profiles (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(120) NOT NULL,
      avatar_path TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_profiles_user (user_id),
      CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS albums (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS tracks (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

const [ping] = await connection.query("SELECT DATABASE() as db, NOW() as now");
console.log("connected", ping);

for (const sql of statements) {
  await connection.query(sql);
}

const [tables] = await connection.query("SHOW TABLES");
console.log("tables", tables);
await connection.end();

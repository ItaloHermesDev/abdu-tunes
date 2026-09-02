import "server-only";

function read(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export function getEnv() {
  return {
    dbHost: read("DB_HOST"),
    dbPort: Number(process.env.DB_PORT || "3306"),
    dbUser: read("DB_USER"),
    dbPassword: read("DB_PASSWORD"),
    dbName: read("DB_NAME"),
    authSecret: read("AUTH_SECRET"),
    authCookieName: read("AUTH_COOKIE_NAME", "abdu_session"),
    appUrl: read("APP_URL", "http://localhost:3000"),
    storageDir: read("STORAGE_DIR", "./storage"),
    binDir: read("BIN_DIR", "./bin"),
    ytdlpPath: process.env.YTDLP_PATH || "",
    ffmpegPath: process.env.FFMPEG_PATH || "",
  };
}

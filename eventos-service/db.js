import mysql from "mysql2/promise";

const getConfig = () => {
  if (process.env.DATABASE_URL) {
    try {
      const u = new URL(process.env.DATABASE_URL);
      return {
        host: u.hostname,
        port: parseInt(u.port || "3306", 10),
        user: u.username,
        password: u.password,
        database: u.pathname.slice(1) || "buscazap",
      };
    } catch (_) {
      // fallback to DB_*
    }
  }
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "buscazap",
  };
};

const pool = mysql.createPool({
  ...getConfig(),
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;

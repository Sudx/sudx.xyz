// src/pages/api/submit_mission.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

// Configuração do cliente do banco de dados
const db = createClient({
  url: import.meta.env.TURSO_DATABASE_URL as string,
  authToken: import.meta.env.TURSO_AUTH_TOKEN as string,
});

// Função para garantir que a tabela exista
async function initializeDatabase() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT NOT NULL UNIQUE,
        x_username TEXT NOT NULL,
        telegram_username TEXT NOT NULL,
        reddit_username TEXT,
        email TEXT,
        submission_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database initialized and 'submissions' table ensured.");
  } catch (e) {
    console.error("Error during initial DB setup:", e);
  }
}

// Inicializa o banco de dados na inicialização
initializeDatabase();

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ error: "Unsupported Media Type" }), { status: 415 });
  }

  try {
    const data = await request.json();
    const { walletAddress, xUsername, telegramUsername, redditUsername, email } = data;

    if (!walletAddress || !xUsername || !telegramUsername) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Verificar se a carteira já existe
    const existingSubmission = await db.execute({
      sql: "SELECT 1 FROM submissions WHERE wallet_address = ?",
      args: [walletAddress],
    });

    if (existingSubmission.rows.length > 0) {
      return new Response(JSON.stringify({ message: "This wallet has already been submitted." }), { status: 200 });
    }

    // Inserir a nova submissão
    await db.execute({
      sql: "INSERT INTO submissions (wallet_address, x_username, telegram_username, reddit_username, email) VALUES (?, ?, ?, ?, ?)",
      args: [walletAddress, xUsername, telegramUsername, redditUsername || '', email || ''],
    });

    return new Response(JSON.stringify({ message: "Submission successful!" }), { status: 200 });

  } catch (e) {
    console.error("--- DETAILED SUBMISSION ERROR ---");
    console.error(e);
    console.error("--- END OF ERROR ---");
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), { status: 500 });
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ message: "This endpoint only accepts POST requests." }), { status: 405 });
}

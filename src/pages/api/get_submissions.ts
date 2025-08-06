// src/pages/api/get_submissions.ts
import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

// A API não deve ser pré-renderizada, pois precisa ser dinâmica
export const prerender = false;

// Configuração do cliente do banco de dados
const db = createClient({
  url: import.meta.env.TURSO_DATABASE_URL as string,
  authToken: import.meta.env.TURSO_AUTH_TOKEN as string,
});

// Chave secreta do admin para proteger o endpoint
const secretKey = import.meta.env.ADMIN_API_KEY;

export const GET: APIRoute = async ({ request }) => {
  // 1. Verificar a chave de API
  const authHeader = request.headers.get('Authorization');
  
  if (!secretKey) {
    console.error("ADMIN_API_KEY não está configurada no ambiente.");
    return new Response(JSON.stringify({ error: "Configuração de segurança do servidor incompleta." }), { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${secretKey}`) {
    return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), { status: 401 });
  }

  // 2. Se a chave for válida, buscar os dados
  try {
    const result = await db.execute("SELECT * FROM submissions ORDER BY submission_timestamp DESC");
    
    // O Turso retorna os dados em um formato específico, vamos extraí-los
    const submissions = result.rows.map(row => {
        const submission: { [key: string]: any } = {};
        result.columns.forEach((col, index) => {
            submission[col] = row[index];
        });
        return submission;
    });

    return new Response(JSON.stringify(submissions), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (e) {
    console.error("--- ERRO AO BUSCAR SUBMISSIONS ---");
    console.error(e);
    console.error("--- FIM DO ERRO ---");
    return new Response(JSON.stringify({ error: "Erro interno ao buscar dados do banco." }), { status: 500 });
  }
};

// src/pages/api/get_submissions.ts
import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

export const prerender = false;

// Verificação explícita das variáveis de ambiente
const tursoUrl = import.meta.env.TURSO_DATABASE_URL;
const tursoAuthToken = import.meta.env.TURSO_AUTH_TOKEN;
const secretKey = import.meta.env.ADMIN_API_KEY;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Função de resposta de erro centralizada
function createErrorResponse(message: string, status = 500) {
  console.error(message);
  return new Response(JSON.stringify({ error: message }), { 
    status, 
    headers: corsHeaders 
  });
}

if (!tursoUrl) {
  console.error("Variável de ambiente TURSO_DATABASE_URL não está configurada.");
}
if (!tursoAuthToken) {
  console.error("Variável de ambiente TURSO_AUTH_TOKEN não está configurada.");
}
if (!secretKey) {
  console.error("Variável de ambiente ADMIN_API_KEY não está configurada.");
}

const db = createClient({
  url: tursoUrl as string,
  authToken: tursoAuthToken as string,
});

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

export const GET: APIRoute = async ({ request }) => {
  // Verificar variáveis de ambiente em cada requisição para garantir que o deploy mais recente as tenha
  if (!tursoUrl || !tursoAuthToken || !secretKey) {
    return createErrorResponse("Configuração de ambiente do servidor incompleta. Uma ou mais variáveis de ambiente essenciais não foram carregadas.");
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader || authHeader !== `Bearer ${secretKey}`) {
    return createErrorResponse('Acesso não autorizado.', 401);
  }

  try {
    const result = await db.execute("SELECT * FROM submissions ORDER BY submission_timestamp DESC");
    
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
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (e) {
    return createErrorResponse(`Erro interno ao buscar dados do banco: ${e.message}`);
  }
};
'use strict';

// Cliente independente para a Área do Professor.
// Utiliza a chave pública já existente no projeto.
// Nunca colocar uma service_role ou chave secreta aqui.

const crogerProfessorSupabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        storageKey: 'croger-professor-auth',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  );

async function autenticarProfessor(email, senha) {
  const { data, error } =
    await crogerProfessorSupabase.auth.signInWithPassword({
      email,
      password: senha
    });

  if (error) throw error;

  const { data: autorizado, error: erroPermissao } =
    await crogerProfessorSupabase.rpc('eh_professor');

  if (erroPermissao || autorizado !== true) {
    await crogerProfessorSupabase.auth.signOut();
    throw new Error('Acesso administrativo não autorizado.');
  }

  return data.user;
}

async function sairProfessor() {
  const { error } =
    await crogerProfessorSupabase.auth.signOut();

  if (error) throw error;
}

console.log('C ROGER MUSIC: autenticação do professor carregada.');

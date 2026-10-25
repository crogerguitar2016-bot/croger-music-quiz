// C ROGER MUSIC
// Autenticacao Supabase

const crogerSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function autenticarAluno() {
  const { data: sessao, error: erroSessao } =
    await crogerSupabase.auth.getSession();

  if (erroSessao) {
    throw erroSessao;
  }

  if (!sessao.session) {
    const { error } =
      await crogerSupabase.auth.signInAnonymously();

    if (error) {
      throw error;
    }
  }

  const { data, error } =
    await crogerSupabase.auth.getUser();

  if (error || !data.user) {
    throw error || new Error(
      "Nao foi possivel identificar o aluno."
    );
  }

  return data.user.id;
}

console.log("C ROGER MUSIC: modulo de autenticacao carregado.");

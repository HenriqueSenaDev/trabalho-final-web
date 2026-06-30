import { supabase } from "./supabaseClient.js";

export let sessao = null;
export let carregandoSessao = true;
const sessaoCallbacks = [];

export function registrarSessaoCallback(callback) {
  sessaoCallbacks.push(callback);
};

async function carregarSessao() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return;
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (perfilError || !perfil) return null;

  return perfil;
}

carregarSessao().then((resultadoSessao) => {
  sessaoCallbacks.forEach(callback => callback(resultadoSessao));
});
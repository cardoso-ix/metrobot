const CHAVE_API = "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";
const URL_API = "https://api.groq.com/openai/v1/chat/completions";

// ========== VERIFICAÇÃO DE LOGIN ==========
const usuarioLogado = JSON.parse(localStorage.getItem("metrobot_usuario_logado"));
if (!usuarioLogado) {
  window.location.href = "login.html";
}

// Preenche dados do usuário na sidebar
document.getElementById("usuarioAvatar").textContent = usuarioLogado.iniciais || usuarioLogado.nome.slice(0, 2).toUpperCase();
document.getElementById("usuarioNome").textContent = usuarioLogado.nome;

function fazerLogout() {
  localStorage.removeItem("metrobot_usuario_logado");
  window.location.href = "login.html";
}

// ========== ELEMENTOS ==========
const chatBox = document.getElementById("chatBox");
const inputUsuario = document.getElementById("inputUsuario");
const btnEnviar = document.getElementById("btnEnviar");
const historicoLista = document.getElementById("historicoLista");
const btnNovaConversa = document.getElementById("btnNovaConversa");

// ========== SYSTEM PROMPT ==========
const SYSTEM_PROMPT = {
  role: "system",
  content: `Você é o MetroBot, um assistente técnico especialista em metrologia e calibração, com domínio completo das seguintes normas e referências:

- ABNT NBR ISO/IEC 17025: Requisitos gerais para a competência de laboratórios de ensaio e calibração.
- ISO 9001: Sistema de gestão da qualidade, incluindo rastreabilidade de medição e controle de equipamentos.
- VIM (Vocabulário Internacional de Metrologia): Conceitos fundamentais, gerais e termos associados.
- Documentação técnica do INMETRO: Portarias, normas, guias e regulamentos brasileiros de metrologia.
- GUM (Guide to the Expression of Uncertainty in Measurement): Metodologia completa para cálculo e expressão de incerteza de medição.

Suas competências incluem calibração de instrumentos, cálculo de incerteza de medição (Tipo A, Tipo B, combinada e expandida), rastreabilidade metrológica, interpretação de normas técnicas, validação de métodos e ensaios de proficiência.

Regras:
- Responda sempre em português do Brasil.
- Seja claro, didático e organizado. Separe bem os parágrafos. Nunca escreva tudo em um bloco único.
- Use listas quando houver múltiplos itens ou etapas.
- Cite a norma ou referência técnica quando aplicável.
- Se a pergunta não for sobre metrologia, diga: "Minha especialização é exclusivamente em metrologia e calibração. Posso te ajudar com alguma dúvida nessa área?"`
};

// ========== ESTADO ==========
let historico = [SYSTEM_PROMPT];
const CHAVE_CONVERSAS = `metrobot_conversas_${usuarioLogado.id}`;
let conversas = JSON.parse(localStorage.getItem(CHAVE_CONVERSAS) || "[]");
let conversaAtualId = null;

// ========== SUGESTÕES ==========
function usarSugestao(el) {
  inputUsuario.value = el.querySelector("strong").textContent;
  inputUsuario.dispatchEvent(new Event("input"));
  enviarMensagem();
}

// ========== HISTÓRICO ==========
function salvarConversas() {
  localStorage.setItem(CHAVE_CONVERSAS, JSON.stringify(conversas));
}

function renderizarHistorico() {
  historicoLista.innerHTML = "";
  if (conversas.length === 0) {
    historicoLista.innerHTML = '<div class="historico-vazio">Nenhuma conversa ainda</div>';
    return;
  }
  conversas.slice().reverse().forEach((conversa) => {
    const item = document.createElement("div");
    item.classList.add("historico-item");
    if (conversa.id === conversaAtualId) item.classList.add("ativo");
    item.textContent = conversa.titulo;
    item.addEventListener("click", () => carregarConversa(conversa.id));
    historicoLista.appendChild(item);
  });
}

function carregarConversa(id) {
  const conversa = conversas.find(c => c.id === id);
  if (!conversa) return;
  conversaAtualId = id;
  historico = [SYSTEM_PROMPT, ...conversa.mensagens];
  chatBox.innerHTML = "";
  conversa.mensagens.forEach(msg => {
    if (msg.role === "user") adicionarMensagemNaTela(msg.content, "usuario");
    else adicionarMensagemNaTela(msg.content, "bot");
  });
  renderizarHistorico();
}

function novaConversa() {
  conversaAtualId = null;
  historico = [SYSTEM_PROMPT];
  chatBox.innerHTML = `
    <div class="boas-vindas" id="boasVindas">
      <h1>Como posso te ajudar?</h1>
      <p>Especialista em metrologia, calibração e normas técnicas</p>
      <div class="sugestoes">
        <div class="sugestao" onclick="usarSugestao(this)">
          <strong>O que é incerteza de medição?</strong>
          <span>Conceito fundamental do VIM</span>
        </div>
        <div class="sugestao" onclick="usarSugestao(this)">
          <strong>Requisitos da ISO/IEC 17025</strong>
          <span>Norma para laboratórios de calibração</span>
        </div>
        <div class="sugestao" onclick="usarSugestao(this)">
          <strong>Incerteza Tipo A e Tipo B</strong>
          <span>Como calcular e diferenciar</span>
        </div>
        <div class="sugestao" onclick="usarSugestao(this)">
          <strong>Rastreabilidade metrológica</strong>
          <span>Conceito e importância prática</span>
        </div>
      </div>
    </div>`;
  renderizarHistorico();
}

// ========== FORMATAÇÃO ==========
function formatarTexto(texto) {
  let html = texto
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s(.+)$/gm, '<strong>$1</strong>');

  const linhas = html.split("\n");
  let resultado = "";
  let dentroLista = false;
  let tipoLista = "";

  linhas.forEach(linha => {
    linha = linha.trim();
    if (!linha) {
      if (dentroLista) {
        resultado += tipoLista === "ul" ? "</ul>" : "</ol>";
        dentroLista = false;
      }
      return;
    }
    if (/^[-•*]\s/.test(linha)) {
      if (!dentroLista || tipoLista !== "ul") {
        if (dentroLista) resultado += "</ol>";
        resultado += "<ul>";
        dentroLista = true;
        tipoLista = "ul";
      }
      resultado += `<li>${linha.replace(/^[-•*]\s/, "")}</li>`;
    } else if (/^\d+\.\s/.test(linha)) {
      if (!dentroLista || tipoLista !== "ol") {
        if (dentroLista) resultado += "</ul>";
        resultado += "<ol>";
        dentroLista = true;
        tipoLista = "ol";
      }
      resultado += `<li>${linha.replace(/^\d+\.\s/, "")}</li>`;
    } else {
      if (dentroLista) {
        resultado += tipoLista === "ul" ? "</ul>" : "</ol>";
        dentroLista = false;
      }
      resultado += `<p>${linha}</p>`;
    }
  });

  if (dentroLista) resultado += tipoLista === "ul" ? "</ul>" : "</ol>";
  return resultado;
}

// ========== MENSAGENS ==========
function removerBoasVindas() {
  const bv = document.getElementById("boasVindas");
  if (bv) bv.remove();
}

function adicionarMensagemNaTela(texto, tipo) {
  removerBoasVindas();

  const mensagem = document.createElement("div");
  mensagem.classList.add("mensagem", tipo);

  const inner = document.createElement("div");
  inner.classList.add("mensagem-inner");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = tipo === "bot" ? "M" : (usuarioLogado.iniciais || usuarioLogado.nome.slice(0, 2).toUpperCase());

  const balao = document.createElement("div");
  balao.classList.add("balao");

  if (tipo === "bot") {
    balao.innerHTML = formatarTexto(texto);
  } else {
    balao.textContent = texto;
  }

  inner.appendChild(avatar);
  inner.appendChild(balao);
  mensagem.appendChild(inner);
  chatBox.appendChild(mensagem);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function mostrarDigitando() {
  const mensagem = document.createElement("div");
  mensagem.classList.add("mensagem", "bot", "digitando");
  mensagem.id = "digitando";

  const inner = document.createElement("div");
  inner.classList.add("mensagem-inner");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = "M";

  const balao = document.createElement("div");
  balao.classList.add("balao");

  for (let i = 0; i < 3; i++) {
    const ponto = document.createElement("span");
    ponto.classList.add("ponto");
    balao.appendChild(ponto);
  }

  inner.appendChild(avatar);
  inner.appendChild(balao);
  mensagem.appendChild(inner);
  chatBox.appendChild(mensagem);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removerDigitando() {
  const el = document.getElementById("digitando");
  if (el) el.remove();
}

// ========== ENVIAR ==========
async function enviarMensagem() {
  const texto = inputUsuario.value.trim();
  if (!texto) return;

  adicionarMensagemNaTela(texto, "usuario");
  historico.push({ role: "user", content: texto });
  inputUsuario.value = "";
  inputUsuario.style.height = "auto";
  btnEnviar.disabled = true;
  mostrarDigitando();

  try {
    const resposta = await fetch(URL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CHAVE_API}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: historico,
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    const dados = await resposta.json();
    const textoResposta = dados.choices[0].message.content;

    removerDigitando();
    adicionarMensagemNaTela(textoResposta, "bot");
    historico.push({ role: "assistant", content: textoResposta });

    const mensagensParaSalvar = historico.filter(m => m.role !== "system");
    const titulo = texto.length > 40 ? texto.substring(0, 40) + "..." : texto;

    if (!conversaAtualId) {
      conversaAtualId = Date.now().toString();
      conversas.push({ id: conversaAtualId, titulo, mensagens: mensagensParaSalvar });
    } else {
      const idx = conversas.findIndex(c => c.id === conversaAtualId);
      if (idx !== -1) conversas[idx].mensagens = mensagensParaSalvar;
    }

    salvarConversas();
    renderizarHistorico();

  } catch (erro) {
    removerDigitando();
    adicionarMensagemNaTela("Ops! Algo deu errado. Tente novamente.", "bot");
    console.error("Erro:", erro);
  }

  btnEnviar.disabled = false;
  inputUsuario.focus();
}

// ========== EVENTOS ==========
inputUsuario.addEventListener("input", () => {
  inputUsuario.style.height = "auto";
  inputUsuario.style.height = Math.min(inputUsuario.scrollHeight, 200) + "px";
  btnEnviar.disabled = inputUsuario.value.trim() === "";
});

inputUsuario.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!btnEnviar.disabled) enviarMensagem();
  }
});

btnEnviar.addEventListener("click", enviarMensagem);
btnNovaConversa.addEventListener("click", novaConversa);

// ========== INICIALIZAR ==========
renderizarHistorico();
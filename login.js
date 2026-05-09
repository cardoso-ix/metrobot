function getUsuarios() {
  return JSON.parse(localStorage.getItem("metrobot_usuarios") || "[]");
}

function salvarUsuarios(usuarios) {
  localStorage.setItem("metrobot_usuarios", JSON.stringify(usuarios));
}

function mostrarErro(id, msg) {
  document.getElementById(id).textContent = msg;
}

function limparErros() {
  document.getElementById("loginErro").textContent = "";
  document.getElementById("cadErro").textContent = "";
}

function toggleSenha(inputId, olho) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    olho.style.opacity = "1";
  } else {
    input.type = "password";
    olho.style.opacity = "0.4";
  }
}

function mostrarLogin() {
  limparErros();
  document.getElementById("telaLogin").style.display = "flex";
  document.getElementById("telaCadastro").style.display = "none";
}

function mostrarCadastro() {
  limparErros();
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("telaCadastro").style.display = "flex";
}

function fazerLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  limparErros();

  if (!email || !senha) {
    mostrarErro("loginErro", "Preencha todos os campos.");
    return;
  }

  const usuarios = getUsuarios();
  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

  if (!usuario) {
    mostrarErro("loginErro", "E-mail ou senha incorretos.");
    return;
  }

  localStorage.setItem("metrobot_usuario_logado", JSON.stringify(usuario));
  window.location.href = "index.html";
}

function fazerCadastro() {
  const nome = document.getElementById("cadNome").value.trim();
  const email = document.getElementById("cadEmail").value.trim();
  const senha = document.getElementById("cadSenha").value;
  const senhaConf = document.getElementById("cadSenhaConf").value;
  limparErros();

  if (!nome || !email || !senha || !senhaConf) {
    mostrarErro("cadErro", "Preencha todos os campos.");
    return;
  }

  if (senha.length < 6) {
    mostrarErro("cadErro", "A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  if (senha !== senhaConf) {
    mostrarErro("cadErro", "As senhas não coincidem.");
    return;
  }

  const usuarios = getUsuarios();
  const existe = usuarios.find(u => u.email === email);

  if (existe) {
    mostrarErro("cadErro", "Este e-mail já está cadastrado.");
    return;
  }

  const novoUsuario = {
    id: Date.now().toString(),
    nome,
    email,
    senha,
    iniciais: nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
  };

  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);
  localStorage.setItem("metrobot_usuario_logado", JSON.stringify(novoUsuario));
  window.location.href = "index.html";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const telaLogin = document.getElementById("telaLogin");
    if (telaLogin.style.display !== "none") {
      fazerLogin();
    } else {
      fazerCadastro();
    }
  }
});

if (localStorage.getItem("metrobot_usuario_logado")) {
  window.location.href = "index.html";
}
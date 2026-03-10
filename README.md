# 🗣️ InterviewCoach — Simulador de Entrevista Técnica com IA Nativa

![Status](https://img.shields.io/badge/Status-Beta-orange)
![Licença](https://img.shields.io/badge/Licença-MIT-green)
![Versão](https://img.shields.io/badge/Versão-1.0.0-blue)
![Chrome AI](https://img.shields.io/badge/IA-Gemini%20Nano-blueviolet)

O **InterviewCoach** é uma ferramenta de preparação para processos seletivos técnicos que funciona de forma **100% offline**. Utilizando a tecnologia **Gemini Nano** integrada diretamente ao Google Chrome, o simulador avalia suas respostas em tempo real, fornecendo feedback estruturado sobre precisão técnica, clareza e profundidade, sem que seus dados saiam do seu computador.

---

## 🎯 Para quem é este projeto?
- Desenvolvedores que desejam treinar para entrevistas técnicas sob pressão.
- Candidatos que preferem praticar por voz (Speech-to-Text) para simular uma conversa real.
- Engenheiros preocupados com privacidade que não querem enviar suas respostas para servidores de terceiros.

---

## 🚀 Funcionalidades Atuais
- **5 Trilhas de Conhecimento:** Frontend, Backend, Dados, Mobile e DevOps.
- **Avaliação Multidimensional:** Gráfico de radar comparando Precisão, Profundidade, Clareza, Exemplos e Boas Práticas.
- **Entrada Híbrida:** Responda digitando ou falando (PT-BR).
- **Leitura de Perguntas (TTS):** A IA lê a pergunta em Inglês para treinar seu listening.
- **Histórico Persistente:** Seus resultados são salvos localmente via IndexedDB.
- **Resiliência com IA:** Sistema de retry automático (2 tentativas) e fallback para garantir fluidez.
- **Mute Automático:** O microfone é pausado automaticamente enquanto a IA lê a pergunta, evitando eco.
- **Feedback de Download:** Barra de progresso real enquanto o modelo Gemini Nano (~1.5GB) é baixado.
- **Modo Escuro (Dark Mode):** Suporte nativo a tema escuro com persistência de preferência.
- **Exportação JSON:** Baixe os resultados detalhados da sua sessão para estudo offline.
- **Customização por JD:** Cole a descrição da vaga e a IA selecionará as perguntas mais relevantes para aquele cargo.
- **Modo Deep Dive (Follow-up):** A IA faz perguntas de acompanhamento baseadas nas suas respostas para testar sua profundidade técnica.
- **PWA (Instalável):** O app pode ser instalado e funciona offline após o primeiro acesso.

---

## 📂 Estrutura do Projeto
```text
├── index.html          # Interface principal
├── index.js            # Ponto de entrada e orquestração
├── style.css           # Estilização e Variáveis de Tema
├── controllers/        # Lógica de Fluxo (Session, History)
├── services/           # Serviços de IA, Voz, Armazenamento e Scoring
├── views/              # Gerenciamento de DOM e Telas
├── data/               # Banco de perguntas (JSON)
├── tests/              # Testes de Integração e Mocks
└── SKILL.md            # Registro de competências e progresso
```

## 📋 Pré-requisitos Técnicos

Diferente de apps comuns, este projeto exige que a IA do seu navegador esteja ativa.

### 1. Versão do Navegador
- **Google Chrome 127+** ou **Chrome Canary**.

### 2. Ativação de Flags (Obrigatório)
Acesse `chrome://flags` e habilite:
1. `#prompt-api-for-gemini-nano`: **Enabled**
2. `#optimization-guide-on-device-model`: **Enabled BypassPrefRequirement**

### 3. Componente de IA
Acesse `chrome://components` e verifique se o **Optimization Guide On Device Model** está atualizado. O download inicial tem cerca de 1.5GB.

---

## 🛠️ Instalação e Uso

### Passo 1: Clonar e Instalar
```bash
git clone https://github.com/seu-usuario/interviewcoach.git
cd interviewcoach
npm install
```

### Passo 2: Iniciar o Servidor Local
```bash
npm start
```
Acesse: `http://localhost:8080`

### Exemplo de Fluxo (Cenário Real)
1. **Configuração:** Selecione "Frontend", "Pleno" e "Prática Rápida".
2. **Pergunta:** A IA exibe: *"Explain the difference between useEffect and useLayoutEffect."*
3. **Resposta (Voz):** Você clica no microfone e explica em Português.
4. **Avaliação:** O Gemini Nano processa e retorna:
```json
{
  "scores": { "accuracy": 9, "depth": 7, "clarity": 10, "examples": 5, "bestPractices": 8 },
  "totalScore": 78,
  "strengths": ["Clareza na explicação do ciclo de vida", "Diferenciação correta do momento do paint"],
  "missing": ["Faltou mencionar exemplos de medição de DOM"],
  "improvement": "Tente citar casos de uso onde o useEffect causaria 'flicker' visual.",
  "modelAnswer": "UseLayoutEffect roda de forma síncrona antes do paint..."
}
```

---

## ⚙️ Configuração (Variáveis de Ambiente)

Este projeto **não utiliza `.env` clássico** por ser client-side. A configuração é feita via:
- **Flags do Chrome:** Define a disponibilidade da IA.
- **data/*.json:** Onde você pode adicionar ou editar perguntas.
- **VoiceService.js:** Ajuste `sttLanguage` (reconhecimento) ou `ttsLanguage` (fala) conforme necessário.

---

## 🤝 Contribuição e Licença

Contribuições são bem-vindas! Siga os passos:
1. Crie um Fork do projeto.
2. Adicione novas perguntas em `data/questions-{trilha}.json`.
3. Abra um Pull Request.

Distribuído sob a licença **MIT**. Veja `LICENSE` para mais informações.

---

## 🎓 Autor
Desenvolvido por **Matheus Gasparotto Polli**.

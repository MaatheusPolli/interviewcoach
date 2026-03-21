# 🗺️ Roadmap Estratégico — InterviewCoach (Evolução)

Este documento define os próximos passos para o **InterviewCoach**, focando em expandir a acessibilidade, a imersão e a retenção do usuário.

---

## 🌅 Horizonte 1 — Quick Wins (Próximos Passos)
*Foco: Refinamento de UX e Engajamento Imediato.*

| Título | Impacto | Esforço | Detalhes |
| :--- | :--- | :---: | :--- |
| **Gamificação (Ready Score)** | Médio | P | Criar um sistema de pontuação acumulada e badges locais (ex: "Especialista em Backend") para incentivar a constância. |
| **Dicas em Tempo Real (Hinter)** | Alto | M | Se o usuário ficar em silêncio por > 5s, a IA sugere palavras-chave ou tópicos para destravar a resposta. |
| **Filtros Avançados** | Baixo | P | Permitir filtrar perguntas por tópicos específicos dentro de uma trilha (ex: apenas 'React' em Frontend). |

---

## 🚀 Horizonte 2 — Expansão (Médio Prazo)
*Foco: Imersão e Novas Camadas de Simulação.*

| Título | Impacto | Esforço | Detalhes |
| :--- | :--- | :---: | :--- |
| **Simulador de Personas** | Médio | M | Escolha de "Intervistadores" com diferentes estilos (Técnico Rígido, Gestor Amigável, etc) via System Prompt. |
| **Auto-Review (Gravação)** | Alto | M | Gravação de vídeo/áudio local (MediaRecorder API) para que o usuário assista sua performance após o feedback. |
| **Ecossistema .interview** | Alto | M | Criar um padrão de mercado para arquivos de trilhas customizadas que podem ser importados/exportados pela comunidade. |

---

## 🔭 Horizonte 3 — Visão (Longo Prazo)
*Foco: Independência Tecnológica e Multimodalidade Avançada.*

| Título | Impacto | Esforço | Detalhes |
| :--- | :--- | :---: | :--- |
| **Independência de Navegador (WebGPU)** | Crítico | G | Migrar para `WebLLM` (Llama 3/Phi-3) para rodar em qualquer navegador moderno sem depender de flags do Chrome. |
| **Análise Comportamental Local** | Médio | G | Uso de `MediaPipe` ou `TensorFlow.js` para analisar contato visual, postura e microexpressões em tempo real. |

---

## ✅ Itens Concluídos (v1.1.0)
- [x] **Tradução Automática via IA:** Suporte dinâmico para PT/EN/ES.
- [x] **Áudio Sob Demanda:** Controle do usuário sobre a reprodução de voz.
- [x] **Resiliência e Fallback:** Lógica de retry para falhas de parsing da IA.
- [x] **Navegação SPA:** Refatoração do ciclo de vida da sessão sem recarregamento de página.
- [x] **Enriquecimento de Dados:** Expansão do banco de perguntas inicial.

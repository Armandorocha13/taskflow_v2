# taskflow v2 — Gestão de Tarefas com WhatsApp

Sistema de to-do-list com painel administrativo, login individual por membro, gestão de equipe e notificações via WhatsApp (Z-API).

## Funcionalidades

- **Painel Admin** — lança tarefas para membros com título, descrição, prazo e prioridade
- **Gestão de equipe** — cadastra, edita e remove integrantes diretamente pelo painel
- **Login individual** — cada membro acessa apenas suas próprias tarefas
- **Notificação WhatsApp** — ao criar uma tarefa, o membro é notificado via WhatsApp
- **Alerta de atrasadas** — botão para enviar alertas para todos com tarefas vencidas
- **Filtros** — pendentes, concluídas, alta prioridade
- **Persistência local** — dados salvos no `localStorage` do navegador

## Estrutura do projeto

```
taskflow/
├── index.html        # Estrutura principal (login, admin, membro, modais)
├── css/
│   └── style.css     # Estilos completos
├── js/
│   └── app.js        # Lógica da aplicação + integração Z-API
└── README.md
```

## Como usar

Basta abrir o `index.html` diretamente no navegador — **não precisa de servidor**.

## Acesso padrão

| Usuário | Senha     | Perfil |
|---------|-----------|--------|
| admin   | admin123  | Admin  |
| ana     | senha123  | Membro |
| carlos  | senha123  | Membro |
| julia   | senha123  | Membro |
| marcos  | senha123  | Membro |

> Você pode adicionar novos membros pelo painel admin → aba **Equipe**.

## Gestão de equipe

No painel admin, aba **Equipe**:
- Visualize todos os integrantes com avatar, login e contagem de tarefas
- Clique em **+ Novo integrante** para cadastrar nome, login, senha e número de WhatsApp
- Use **Editar** para atualizar dados de um membro existente
- Use **Remover** para excluir um membro (tarefas são mantidas)

## Configuração do WhatsApp (Z-API)

1. Acesse [z-api.io](https://z-api.io) e crie uma conta gratuita
2. Crie uma instância e escaneie o QR Code com o WhatsApp que vai enviar
3. No painel admin → aba **WhatsApp**, preencha:
   - **Instance ID**
   - **Token**
   - **Client-Token** (opcional — Security Token)
4. Cadastre o número de cada membro (formato: `5521999990000`)
5. Clique em **Salvar** e depois **Enviar mensagem de teste**

## Notificações automáticas

| Evento | Quando dispara | Mensagem enviada |
|--------|---------------|-----------------|
| Tarefa atribuída | Ao clicar em "Lançar tarefa" | Título, descrição, prazo e prioridade |
| Tarefa atrasada | Ao clicar em "Alertar atrasadas" | Nome da tarefa e prazo vencido |

## Tecnologias

- HTML5 + CSS3 + JavaScript puro (sem dependências externas)
- `localStorage` para persistência de dados no navegador
- [Z-API](https://z-api.io) para integração com WhatsApp

## Subindo para o GitHub

```bash
cd taskflow
git init
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git add .
git commit -m "feat: taskflow v2 com gestão de equipe e notificações WhatsApp"
git branch -M main
git push -u origin main
```

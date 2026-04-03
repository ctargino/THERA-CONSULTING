# API de Pedidos e Produtos

Teste técnico para vaga de Desenvolvedor Back-end na **Thera Consulting**. API RESTful para gerenciamento de pedidos e produtos, construída com NestJS, TypeORM e PostgreSQL.

Para decisões técnicas detalhadas, convenções e regras de negócio, consulte [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md).

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16+
- npm

## Setup

```bash
git clone <url-do-repositorio>
cd teste-backend
npm install
cp .env.example .env
```

Edite o `.env` com as credenciais do banco e o JWT secret.

## Executando Localmente

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

## Executando os Testes

```bash
# Rodar todos os testes
npm test

# Rodar testes em modo watch (reexecuta ao salvar)
npm run test:watch

# Rodar testes com coverage
npm run test:cov
```

> Não é necessário ter o PostgreSQL rodando — os testes usam repositórios mockados e não dependem de banco de dados.

## Executando com Docker

```bash
docker compose up --build
```

Isso inicia:

- **API** em `http://localhost:3000`
- **PostgreSQL** em `localhost:5432`

Os dados do PostgreSQL persistem em um volume nomeado entre reinicializações dos containers.

Para parar:

```bash
docker compose down
```

Para parar e remover volumes:

```bash
docker compose down -v
```

## Live Demo

A API está disponível online em: https://thera-consulting-production.up.railway.app/api-docs

> O ambiente será desativado em **08/04/2026**.

## Documentação da API

Swagger UI disponível em `http://localhost:3000/api-docs` quando o servidor estiver rodando.

Clique no botão **Authorize** e cole seu token JWT (sem o prefixo "Bearer ") para testar os endpoints autenticados.

## Health Check

Endpoint público para verificação de saúde da aplicação e do banco de dados:

```bash
curl http://localhost:3000/health
```

Resposta:

```json
{
  "status": "ok",
  "timestamp": "2026-04-03T12:00:00.000Z",
  "uptime": 123.456,
  "database": {
    "status": "healthy",
    "responseTimeMs": 5
  }
}
```

Em caso de falha no banco, `status` será `"error"` e `database.status` será `"unhealthy"`.

## Autenticação

Todos os endpoints exceto `/auth/login` e `/health` requerem um token JWT Bearer.

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Use o `access_token` retornado no header `Authorization` para as requisições subsequentes:

```
Authorization: Bearer <access_token>
```

## Estrutura do Projeto

```
src/
├── common/
│   └── decorators/
│       └── public.decorator.ts
├── middleware/
│   └── logging.middleware.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── dto/
│   ├── order/
│   │   ├── order.controller.ts
│   │   ├── order.entity.ts
│   │   ├── order.module.ts
│   │   ├── order.service.ts
│   │   ├── order-item.entity.ts
│   │   └── dto/
│   └── product/
│       ├── product.controller.ts
│       ├── product.entity.ts
│       ├── product.module.ts
│       ├── product.service.ts
│       └── dto/
├── app.module.ts
└── main.ts
```

# Decisões Técnicas

Este documento cobre todas as escolhas arquiteturais, convenções e regras de negócio adotadas neste projeto.

## Arquitetura

### Framework: NestJS 11

NestJS foi escolhido por ser o framework especificado nos requisitos do desafio. Ele fornece uma estrutura modular com injeção de dependências, decorators e separação clara de responsabilidades pronto de uso.

### Arquitetura em Camadas (Controller -> Service -> Repository)

Cada módulo de domínio (Product, Order, Auth) segue um padrão de três camadas:

- **Controller**: Trata requisições/respostas HTTP, validação de DTOs via `class-validator` e decorators Swagger. Não contém lógica de negócio.
- **Service**: Contém toda a lógica de negócio — validações, cálculos, transições de status, gerenciamento de estoque. Depende de interfaces de repositório, não de implementações.
- **Repository**: Acesso a dados via TypeORM. Cada repositório implementa uma interface (`IProductRepository`, `IOrderRepository`) para permitir testabilidade e desacoplamento.

**Por quê**: Esta separação permite que cada camada mude de forma independente. Services podem ser testados unitariamente com mocks de repositórios. Controllers permanecem finos. Repositories lidam apenas com persistência.

### Organização em Módulos

```
src/modules/product/   # CRUD de produtos
src/modules/order/     # Ciclo de vida de pedidos + gerenciamento de estoque
src/modules/auth/      # Autenticação JWT
src/middleware/         # Concerns transversais (logging)
src/common/decorators/ # Decorators compartilhados (@Public)
```

**Por quê**: Um módulo por domínio mantém código relacionado junto. O diretório `common/` guarda código compartilhado entre módulos.

## Princípios SOLID

### Princípio da Responsabilidade Única (SRP)

Cada classe tem um motivo para mudar:

- **Controllers** lidam apenas com concerns HTTP (roteamento, validação, serialização).
- **Services** contêm apenas lógica de negócio (sem detalhes HTTP ou de banco).
- **Repositories** lidam apenas com operações de banco de dados.
- **DTOs** definem apenas regras de validação de input.

Nenhuma classe mistura responsabilidades. `ProductController` não calcula totais. `OrderService` não trata respostas HTTP. `ProductRepository` não valida regras de negócio.

### Princípio Aberto/Fechado (OCP)

Novos tipos de produto ou comportamentos de pedido podem ser adicionados sem modificar código existente:

- **Interfaces de repositório** (`IProductRepository`, `IOrderRepository`) permitem trocar implementações sem mudar services.
- **Pattern Strategy no auth**: `JwtStrategy` pode ser substituída por uma estratégia diferente sem mudar `AuthService` ou controllers.
- **ValidationPipe** é configurado globalmente — novos DTOs são automaticamente validados adicionando decorators `class-validator`, sem mudanças na infraestrutura.

### Princípio da Substituição de Liskov (LSP)

Repositórios mock nos testes são substituíveis por repositórios reais:

- Services dependem de interfaces, não de classes concretas. `ProductService` depende de `ProductRepository` (a classe), mas nos testes recebe um mock com a mesma forma. Ambos satisfazem o mesmo contrato.
- `OrderService` recebe `ProductRepository` via injeção de dependência e usa apenas o método `findByIds` — qualquer implementação desse método funciona.

### Princípio da Segregação de Interfaces (ISP)

Cada interface de repositório expõe apenas o que seus consumidores precisam:

- `IProductRepository` tem `create`, `findAll`, `findById`, `findByIds`, `update`, `delete` — nenhum método não relacionado a acesso de produto.
- `IOrderRepository` tem `createWithItems`, `findAll`, `findById`, `findByIdWithItems` — nenhum método de produto vazou.
- DTOs são divididos por caso de uso: `CreateProductDto` (todos campos obrigatórios) vs `UpdateProductDto` (todos opcionais) vs `CreateOrderItemDto` (validação aninhada).

### Princípio da Inversão de Dependência (DIP)

Módulos de alto nível dependem de abstrações, não de implementações:

- `OrderService` depende de `ProductRepository` (injetado), não de `DataSource` ou SQL direto para buscas de produto.
- `ProductService` depende da interface `ProductRepository`, não de `Repository<Product>` do TypeORM diretamente.
- `JwtAuthGuard` depende de `Reflector` (abstração do NestJS) para checar os metadados `@Public()`, não de classes controller concretas.

## Banco de Dados

### PostgreSQL 16 via TypeORM

PostgreSQL foi escolhido por ser um banco relacional (conforme exigido pelo desafio) e suportar os recursos necessários: lock em nível de linha, constraints CHECK e tipos ENUM.

TypeORM com `synchronize: true` é usado em desenvolvimento para criar tabelas automaticamente a partir das definições de entidade.

### Nomenclatura de Tabelas: `orders` (plural)

O plano original usava `order` como nome da tabela, mas `ORDER` é uma palavra reservada no PostgreSQL. Usá-la exigiria aspas em toda query, adicionando complexidade e risco de erros de sintaxe SQL.

**Decisão**: Renomeado para `orders`. Todas as colunas de chave estrangeira permanecem inalteradas.

### Convenção de Nomenclatura de Colunas

Todas as colunas usam um prefixo `tipo_` para clareza:

| Prefixo | Tipo         | Exemplo                                              |
| ------- | ------------ | ---------------------------------------------------- |
| `str_`  | varchar/text | `str_name`, `str_category`, `str_status`             |
| `int_`  | integer      | `int_value_cents`, `int_total_cents`, `int_order_id` |
| `dec_`  | decimal      | `dec_stock`, `dec_quantity`                          |
| `dt_`   | timestamp    | `dt_created_at`, `dt_updated_at`                     |

**Por quê**: Prefixos deixam imediatamente claro que tipo uma coluna armazena sem verificar o schema. Isso é especialmente útil para `dec_stock` vs `int_value_cents` — ambos relacionados a números mas com requisitos de precisão muito diferentes.

### Valores Monetários em Centavos

Todos os valores monetários (`int_value_cents`, `int_total_item_cents`, `int_total_cents`) são armazenados como inteiros representando centavos.

**Por quê**: Aritmética de ponto flutuante causa erros de arredondamento com dinheiro. Armazenar em centavos evita isso totalmente. Por exemplo, R$ 1,99 é armazenado como 199.

### Precisão Decimal para Quantidades

`dec_stock` e `dec_quantity` usam `decimal(12,3)` — até 3 casas decimais.

**Por quê**: Produtos vendidos por peso (kilo) precisam de quantidades fracionárias (ex: 1,500 kg). Três casas decimais fornecem precisão suficiente para este caso de uso.

### Validação de Estoque por Tipo de Unidade

- **unit** e **box**: estoque deve ser inteiro (não se pode vender 2,5 unidades de uma caixa).
- **kilo**: estoque pode ser fracionário (1,500 kg).

**Por quê**: Isso impõe restrições do mundo real no nível da aplicação. Uma constraint CHECK no banco só cobre regras genéricas, então validação no nível da aplicação é necessária para regras específicas por tipo.

### Constraints CHECK

- `product`: `int_value_cents > 0` e `dec_stock >= 0`
- `order_items`: `dec_quantity >= 0.001`

**Por quê**: Constraints em nível de banco fornecem uma rede de segurança mesmo se o código da aplicação tiver bugs. Elas impedem que dados inválidos sejam inseridos por qualquer caminho de código.

## Regras de Negócio

### Ciclo de Status de Pedido

```
pending -> completed  (debita estoque)
pending -> cancelled  (sem alteração de estoque)
completed -> cancelled (restaura estoque)
```

Um pedido cancelado não pode ser transicionado para nenhum outro status. Isso é imposto por uma máquina de estados em `OrderService.updateStatus`.

**Por quê**: Isso previne estados inválidos como "cancelled -> completed" que debitariam estoque duas vezes para um pedido já cancelado.

### Gerenciamento de Estoque na Criação do Pedido

Quando um pedido é criado (status `pending`), o estoque é **verificado** mas **não debitado**. O estoque só é debitado quando o pedido transiciona para `completed`.

**Por quê**: Um pedido pendente representa uma intenção de compra, não uma compra confirmada. O cliente pode cancelar antes do pagamento. Debitar na criação travaria estoque desnecessariamente e exigiria restauração no cancelamento de pedidos pendentes.

### Arredondamento para Baixo em Totais de Item

Cálculo do total do item: `Math.floor(preco_unitario_cents * quantidade)`

**Por quê**: Ao multiplicar um preço inteiro por uma quantidade decimal (ex: 800 cents \* 1,333 kg), o resultado pode ter centavos fracionários. `Math.floor` sempre arredonda para baixo, dando o benefício ao negócio. Isso é determinístico e fácil de auditar.

Exemplo: 800 \* 1,333 = 1066,4 -> 1066 cents (o negócio fica com 0,4 cents).

### Lock em Nível de Linha para Débitos de Estoque

Ao completar ou cancelar um pedido, o estoque do produto é atualizado dentro de uma transação com `SELECT ... FOR UPDATE` (lock pessimista de escrita). Produtos são travados em ordem ascendente de ID para previnir deadlocks.

**Por quê**: Sem locking, dois pedidos simultâneos poderiam ambos ler estoque=5 e cada debitar 3, resultando em estoque=-1. Lock em nível de linha garante acesso serial às atualizações de estoque. Travando em ordem ascendente de ID previne deadlocks de condições de espera circular.

### Escopo da Transação

Operações de estoque e atualização de status do pedido acontecem em uma única transação de banco. Se o débito de estoque falhar, a mudança de status é revertida também.

**Por quê**: Commits parciais (estoque debitado mas status inalterado) deixariam o sistema em um estado inconsistente. A transação garante atomicidade.

## Autenticação

### JWT com Credenciais Fixas

Autenticação usa um único usuário com credenciais definidas em variáveis de ambiente (`AUTH_USERNAME`, `AUTH_PASSWORD`). O secret JWT também vem de uma variável de ambiente (`JWT_SECRET`).

**Por quê**: O desafio pede "autenticação simples com JWT." Credenciais fixas são a abordagem mais simples que ainda demonstra o fluxo JWT (login -> token -> requisições autenticadas). O secret não tem fallback — a aplicação recusa a iniciar sem ele, prevenindo uso acidental de secrets fracos padrão.

### Guard Global com Decorator @Public

`JwtAuthGuard` é aplicado globalmente via `APP_GUARD`. Um decorator customizado `@Public()` marca endpoints que devem bypassar a autenticação (apenas `/auth/login`).

**Por quê**: Isso é mais seguro do que adicionar guards manualmente a cada controller. Novos endpoints são protegidos por padrão. O decorator `@Public()` deve ser explicitamente aplicado, tornando mais difícil expor um endpoint acidentalmente.

## Design da API

### Convenções RESTful

- `POST /products` (201), `GET /products` (200), `GET /products/:id` (200), `PUT /products/:id` (200), `DELETE /products/:id` (204)
- `POST /orders` (201), `GET /orders` (200), `GET /orders/:id` (200), `PATCH /orders/:id/status` (200)
- `POST /auth/login` (200)

**Por quê**: Métodos HTTP e códigos de status padrão. `PATCH` para atualizações de status porque é uma atualização parcial. `204 No Content` para DELETE porque não há corpo de resposta.

### Formato de Resposta de Erro

```json
{ "statusCode": 400, "message": ["detalhe do erro"], "error": "Bad Request" }
```

**Por quê**: Este é o formato de erro padrão do NestJS, que é consistente e bem documentado. Formatos customizados exigiriam interceptors que adicionam complexidade sem benefício.

## Infraestrutura

### Docker Compose (API + PostgreSQL)

Dois serviços: `api` (build multi-stage Node.js) e `db` (PostgreSQL 16). O serviço API depende do healthcheck do DB (`pg_isready`).

**Por quê**: Build multi-stage mantém a imagem de produção pequena (apenas dependências de runtime). O healthcheck garante que a API não inicie antes do PostgreSQL estar pronto. Um volume nomeado persiste dados do banco entre reinicializações dos containers.

### Variáveis de Ambiente via `.env`

Toda configuração (banco, JWT, auth) vem de um arquivo `.env` carregado pelo `docker-compose.yml` via `env_file`. Apenas `DB_HOST=db` é sobrescrito no compose (porque dentro do Docker o host é o nome do serviço, não `localhost`).

**Por quê**: Mantém secrets fora do controle de versão. `.gitignore` e `.dockerignore` excluem `.env` do git e da imagem Docker.

### Middleware de Logging de Requisições

Registra método HTTP, URL e duração da resposta para cada requisição via middleware NestJS.

**Por quê**: Este é o middleware mais simples que satisfaz o requisito de "pelo menos um middleware." Fornece visibilidade do uso da API sem adicionar dependências externas.

## Testes

### Jest com Repositórios Mockados

Services são testados com repositórios mockados usando `@nestjs/testing`. Cada teste de service cria um `TestingModule` com providers `useValue` para todas as dependências.

**Por quê**: Mockar repositórios isola a camada de service, permitindo que os testes foquem na lógica de negócio sem precisar de um banco rodando. Isso torna os testes rápidos e determinísticos.

### 48 Testes em 7 Suites

- `product.service.spec.ts`: CRUD, validação (preço > 0, estoque >= 0, estoque inteiro para unit/box)
- `order.service.spec.ts`: Criação, validação de estoque, arredondamento para baixo, transições de status, débito/restauração, rollback em falha
- `auth.service.spec.ts`: Login, credenciais inválidas, assinatura JWT
- `logging.middleware.spec.ts`: Logging de requisição, rastreamento de duração
- `validation-pipe.spec.ts`: Transform, whitelist, forbidNonWhitelisted
- `app.module.spec.ts`: Compilação do módulo
- `app.controller.spec.ts`: Resposta padrão

**Por quê**: O desafio exige "pelo menos 2 testes unitários." Superamos isso significativamente para demonstrar qualidade e cobertura dos testes. Os testes cobrem caminhos felizes, caminhos de erro e casos extremos (arredondamento decimal, estoque concorrente, rollback).

## Segurança

### Helmet (Headers de Segurança)

`helmet` é aplicado globalmente via middleware para adicionar headers de segurança HTTP em todas as respostas: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, entre outros.

**Por quê**: Sem helmet, a API não envia headers de proteção contra content-sniffing, clickjacking e outras vulnerabilidades baseadas em headers. Helmet aplica essas proteções com uma única linha de configuração.

### Rate Limiting via Throttler

`@nestjs/throttler` é aplicado globalmente via `APP_GUARD` (`ThrottlerGuard`) com três camadas:

| Camada   | TTL | Limite  | Uso              |
| -------- | --- | ------- | ---------------- |
| `short`  | 1s  | 3 req   | Prevenir floods  |
| `medium` | 10s | 20 req  | Uso normal       |
| `long`   | 60s | 100 req | Batch operations |

Todos os endpoints são protegidos, incluindo `/auth/login`. Em caso de excesso, a API retorna `429 Too Many Requests`.

**Por quê**: Sem rate limiting, endpoints autenticados e públicos estão vulneráveis a brute-force e denial of service. O ThrottlerGuard global protege automaticamente todos os endpoints, incluindo os novos.

### `synchronize` Condicional por Ambiente

TypeORM usa `synchronize: process.env.NODE_ENV !== 'production'`. Em desenvolvimento (`synchronize: true`), tabelas são criadas automaticamente. Em produção (`NODE_ENV=production`), `synchronize: false` previne alterações acidentais de schema.

**Por quê**: `synchronize: true` em produção pode causar perda irreversível de dados se uma entidade for modificada. Em ambiente de demonstração no Railway, `NODE_ENV` deve ser definido explicitamente. A primeira vez que o ambiente de produção for criado, as tabelas devem ser geradas manualmente (via migration ou `synchronize: true` temporário).

### Validação de Comprimento em DTOs (`@MaxLength`)

Todos os campos string dos DTOs possuem `@MaxLength` alinhado ao limite da coluna no banco:

| DTO              | Campo             | Limite | Coluna DB      |
| ---------------- | ----------------- | ------ | -------------- |
| CreateProductDto | `str_name`        | 255    | `varchar(255)` |
| CreateProductDto | `str_category`    | 100    | `varchar(100)` |
| CreateProductDto | `str_description` | 5000   | `text`         |
| UpdateProductDto | `str_name`        | 255    | `varchar(255)` |
| UpdateProductDto | `str_category`    | 100    | `varchar(100)` |
| UpdateProductDto | `str_description` | 5000   | `text`         |
| LoginDto         | `username`        | 255    | Credencial     |
| LoginDto         | `password`        | 255    | Credencial     |

**Por quê**: Sem `@MaxLength`, strings extremamente longas causam erros de banco de dados que podem vazar informações de schema. Validar no nível da aplicação é mais rápido e retorna erros claros (400) em vez de erros internos (500).

### Limite de Itens por Pedido (`@ArrayMaxSize`)

O array `items` em `CreateOrderDto` possui `@ArrayMaxSize(50)`, limitando cada pedido a no máximo 50 itens.

**Por quê**: Sem limite, um payload com milhares de itens causaria alto carregamento no banco de dados (N+1 saves na transação). 50 itens é generoso para pedidos reais e previne denial of service por payload excessivo.

### CORS Não Configurado (Decisão Consciente)

O CORS permanece permissivo (padrão NestJS) sem configuração explícita.

**Por quê**: CORS permissivo foi mantido para facilitar acesso no ambiente de demonstração do Railway. Em um cenário de produção com frontend específico, `app.enableCors({ origin: ['https://seufrontend.com'] })` deve ser configurado.

### Senha em Texto Puro (Decisão Consciente)

As credenciais de autenticação (`AUTH_USERNAME`, `AUTH_PASSWORD`) são comparadas diretamente como texto puro via variáveis de ambiente.

**Por quê**: O desafio pede autenticação simples com JWT e um único usuário admin. Credenciais fixas em variáveis de ambiente são aceitáveis nesse contexto. Se o sistema evoluir para multi-usuário, deve-se migrar para bcrypt com hashes de senha armazenados no banco de dados.

### Swagger Público (Decisão Consciente)

A documentação Swagger permanece acessível publicamente em `/api-docs` sem autenticação.

**Por quê**: O Swagger público facilita a demonstração e os testes no ambiente do Railway. Em produção, pode ser desabilitado condicionalmente via `if (process.env.NODE_ENV !== 'production')` ao redor da configuração do Swagger no `main.ts`.

## Convenções

### Sem Comentários no Código

O código não usa comentários. Código deve ser autoexplicativo através de nomes claros e estrutura.

### Sem Imports Não Utilizados

ESLint impõe a remoção de imports não utilizados.

### Entidade como Schema do Swagger

Entidades usam decorators `@ApiProperty` para que o Swagger UI mostre schemas completos de requisição/resposta com todos os campos.

### Referências Lazy no Swagger

Relacionamentos circulares de entidades (Order <-> OrderItem) usam `type: () => Class` no `@ApiProperty` para evitar erros de dependência circular na geração do schema do Swagger.

### `ProductRepository` Exportado de `ProductModule`

O `ProductModule` exporta `ProductRepository` para que o `OrderModule` possa injetá-lo para buscas de estoque.

**Por quê**: Isso segue o padrão NestJS de exportar providers que outros módulos precisam, em vez de ter módulos acessando diretamente as entidades ou repositórios uns dos outros.

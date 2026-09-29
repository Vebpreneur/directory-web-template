---
id: mappers-system
title: "Sistema de mapeadores"
sidebar_label: "Sistema de mapeadores"
sidebar_position: 48
---

# Sistema de mapeadores

## Visão geral

O Mappers System fornece funções de transformação puras e sem efeitos colaterais que convertem modelos de dados de aplicativos internos em cargas externas de CRM (Customer Relationship Management). Atualmente, ele implementa mapeadores para a integração do Twenty CRM, convertendo entidades `ClientProfile` e `Company` em cargas `Person` e `Company` compatíveis com Twenty com mapeamento de campo seguro para nulos e validação de campo obrigatório.

## Arquitetura

O módulo mapeadores reside em `lib/mappers/` e segue um padrão estrito de separação de preocupações:

- **Mapeadores** são funções puras: sem E/S, sem chamadas de banco de dados, sem solicitações HTTP.
- **Serviços** (em `lib/services/`) consomem mapeadores para preparar dados antes de enviar para APIs externas.
- **Tipos** são importados do esquema do banco de dados (`lib/db/schema`) e das definições de tipo de CRM (`lib/types/twenty-crm-entities.types`).

```
lib/mappers/
  |-- twenty-crm.mapper.ts
      |-- ensureExternalId()                (ID validation)
      |-- extractCityFromLocation()         (Location parsing)
      |-- mapClientProfileToPerson()        (ClientProfile -> TwentyPerson)
      |-- mapCompanyToTwentyCompany()       (Company -> TwentyCompany)
```

O fluxo de dados é:

```
Database Entity  -->  Mapper Function  -->  CRM Payload  -->  Service  -->  External API
(ClientProfile)     (mapClientProfile     (TwentyPerson)  (CRM Service)  (Twenty CRM)
                     ToPerson)
```

## Referência de API

### Exportações de `lib/mappers/twenty-crm.mapper.ts`

#### `ensureExternalId(id: string | undefined | null, entityType: string): string`

Valida que um ID de entidade está presente e não vazio. Esta é uma verificação de segurança crítica, garantindo que cada registro de CRM tenha um `external_id` válido vinculado ao sistema local.

**Parâmetros:**
- `id` -- O ID da entidade local (pode ser indefinido ou nulo)
- `entityType` -- Nome do tipo de entidade para mensagens de erro (por exemplo, `'ClientProfile'`)

**Retorna:** String de ID cortada

**Lança:** `Error` se o ID estiver ausente, nulo, indefinido ou uma string vazia.

#### `extractCityFromLocation(location: string | undefined | null): string | null`

Analisa uma sequência de localização de formato livre para extrair o nome da cidade. Lida com vários formatos dividindo por vírgulas e pegando a primeira parte.

**Formatos suportados:**
- `"San Francisco"` --> `"San Francisco"`
- `"San Francisco, CA"` --> `"San Francisco"`
- `"San Francisco, CA, USA"` --> `"San Francisco"`

**Retorna:** O nome da cidade ou `null` se o local estiver vazio/indefinido.

#### `mapClientProfileToPerson(clientProfile: ClientProfile): TwentyPerson`

Mapeia uma entidade de banco de dados local `ClientProfile` para uma carga útil Twenty CRM `Person`.

**Mapeamento de campo:**

|Campo Perfil do Cliente|Campo TwentyPerson|Obrigatório|
|--------------------|--------------------|----------|
|`id`|`external_id`|Sim (joga se faltar)|
|`name`|`name`|Sim|
|`email`|`email`|Sim|
|`phone`|`phone`|Opcional|
|`jobTitle`|`job_title`|Opcional|
|`company`|`company_name`|Opcional|
|`website`|`website`|Opcional|
|`location`|`city` (extraído)|Opcional|
|`accountType`|`account_type`|Opcional|
|`plan`|`plan`|Opcional|
|`totalSubmissions`|`total_submissions`|Opcional|

**Retorna:** Um objeto `TwentyPerson` com apenas campos preenchidos.

**Lançamentos:** `Error` se `clientProfile.id` estiver faltando.

#### `mapCompanyToTwentyCompany(company: Company): TwentyCompany`

Mapeia uma entidade `Company` local para uma carga útil Twenty CRM `Company`.

**Mapeamento de campo:**

|Campo da empresa|Campo TwentyCompany|Obrigatório|
|--------------|---------------------|----------|
|`id`|`external_id`|Sim (joga se faltar)|
|`name`|`name`|Sim|
|`domain`|`domain_name`|Opcional|
|`website`|`website`|Opcional|
|`status`|`status`|Opcional|

**Retorna:** Um objeto `TwentyCompany` com apenas campos preenchidos.

**Lançamentos:** `Error` se `company.id` estiver faltando.

## Detalhes de implementação

**Mapeamento seguro para nulos**: os campos opcionais usam verificações `if` explícitas antes da atribuição, garantindo que `null`, `undefined` e valores vazios nunca sejam enviados ao CRM. Isso mantém as cargas limpas e evita a substituição de dados de CRM existentes por valores nulos.

**Aplicação de ID externa**: todo mapeador chama `ensureExternalId()` como sua primeira operação. Isso gera imediatamente IDs inválidos, seguindo um padrão de falha rápida que evita registros órfãos no CRM.

**Sem mutação**: As funções do mapeador criam novos objetos em vez de modificar a entrada. O objeto de entrada `ClientProfile` ou `Company` nunca é alterado.

**Remoção de campo opcional**: Os campos só são adicionados ao objeto de saída quando possuem valores verdadeiros. Isso produz cargas mínimas que atualizam apenas campos não nulos no CRM.

**Heurística de extração de cidade**: a função `extractCityFromLocation()` usa uma abordagem simples de divisão por vírgula. Isso lida com os formatos de localização mais comuns (Cidade, Cidade + Estado, Cidade + Estado + País), mas não tenta analisar formatos de endereço complexos.

## Configuração

Nenhuma configuração é necessária. Os mapeadores são funções puras que dependem apenas de seus tipos de entrada. A configuração da conexão Twenty CRM (URL da API, tokens) é gerenciada pela camada de serviço de integração.

## Exemplos de uso

```typescript
import {
  mapClientProfileToPerson,
  mapCompanyToTwentyCompany,
  ensureExternalId,
  extractCityFromLocation,
} from '@/lib/mappers/twenty-crm.mapper';

// Map a client profile to a CRM person
const clientProfile = await db.query.clientProfiles.findFirst({
  where: eq(clientProfiles.id, userId),
});

const personPayload = mapClientProfileToPerson(clientProfile);
// {
//   external_id: "usr_abc123",
//   name: "Jane Doe",
//   email: "jane@example.com",
//   job_title: "CTO",
//   company_name: "Acme Corp",
//   city: "San Francisco",
//   plan: "premium",
// }

// Map a company to a CRM company
const company = await db.query.companies.findFirst({
  where: eq(companies.id, companyId),
});

const companyPayload = mapCompanyToTwentyCompany(company);
// {
//   external_id: "comp_xyz789",
//   name: "Acme Corp",
//   domain_name: "acme.com",
//   website: "https://acme.com",
//   status: "active",
// }

// Use utility functions independently
const city = extractCityFromLocation("Berlin, Germany");
// "Berlin"

const validId = ensureExternalId(user.id, "User");
// "usr_abc123" or throws Error
```

## Melhores práticas

- Sempre use as funções do mapeador em vez de construir manualmente cargas de CRM para garantir nomenclatura de campo consistente e segurança nula.
- Lidar com `Error` lançado por `ensureExternalId()` na camada de serviço; registre-o e ignore a sincronização do CRM para esse registro, em vez de travar o lote inteiro.
- Ao adicionar novos campos a um mapeador, siga o padrão existente: verifique a veracidade antes de atribuir ao objeto de saída.
- Escreva testes unitários para mapeadores, pois são funções puras sem dependências, tornando-os fáceis de testar isoladamente.
- Se for necessária uma nova integração com o CRM, crie um novo arquivo mapeador (por exemplo, `hubspot.mapper.ts`) no mesmo diretório seguindo os mesmos padrões.

## Módulos Relacionados

- [Config Manager System](./config-manager-system.md) - Configuração de integração via `configService.integrations`
- [API Client Layer](/template/architecture/api-client-layer) -- Cliente HTTP usado por serviços de CRM

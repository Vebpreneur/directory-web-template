---
id: guards-system-deep-dive
title: "Aprofundamento do Sistema de Guardas"
sidebar_label: "Aprofundamento do Sistema de Guardas"
sidebar_position: 47
---

# Aprofundamento do Sistema de Guardas

## Visão geral

O Sistema Guards implementa controle de acesso a recursos baseado em plano de assinatura. Ele define uma matriz de recursos centralizada de mapeamento de recursos para planos de assinatura (Gratuito, Padrão, Premium), fornece limites numéricos por plano e oferece APIs funcionais e baseadas em classe para verificar e impor o acesso. O sistema oferece suporte à aplicação do lado do servidor por meio de proteção e uso do lado do cliente por meio de objetos de resultado compatíveis com React.

## Arquitetura

O módulo guards reside em `lib/guards/` com dois arquivos:

- **`lib/guards/plan-features.guard.ts`** -- A implementação principal contendo todas as definições de recursos, a matriz de acesso, limites do plano, funções de verificação de acesso e a fábrica de proteção.
- **`lib/guards/index.ts`** -- Exportação de barril que reexporta tudo do arquivo de proteção.

O sistema de proteção depende de `PaymentPlan` de `@/lib/constants` para definições de tipo de plano e é consumido por rotas de API, serviços e ganchos React para controle de recursos.

```
lib/guards/
  |-- index.ts                  (barrel export)
  |-- plan-features.guard.ts    (core implementation)
      |-- PLAN_LEVELS           (hierarchy: FREE=1, STANDARD=2, PREMIUM=3)
      |-- FEATURES              (feature constants)
      |-- FEATURE_ACCESS        (feature -> plan mapping matrix)
      |-- PLAN_LIMITS           (numeric limits per plan)
      |-- canAccessFeature()    (check function)
      |-- createPlanGuard()     (guard factory)
      |-- createPlanGuardResult() (React hook helper)
      |-- PlanGuardError        (typed error class)
```

## Referência de API

### Constantes

#### `FEATURES`

Um objeto contendo todas as constantes de strings de recursos:

|Categoria|Recursos|
|----------|----------|
|Envio|`SUBMIT_PRODUCT`, `EXTENDED_DESCRIPTION`, `UNLIMITED_DESCRIPTION`, `UPLOAD_IMAGES`, `UPLOAD_VIDEO`, `VERIFIED_BADGE`, `SPONSORED_BADGE`|
|Revisão|`PRIORITY_REVIEW`, `INSTANT_REVIEW`|
|Visibilidade|`SEARCH_VISIBILITY`, `CATEGORY_PLACEMENT`, `SPONSORED_POSITION`, `HOMEPAGE_FEATURED`, `NEWSLETTER_MENTION`|
|Análise|`VIEW_STATISTICS`, `ADVANCED_ANALYTICS`|
|Suporte|`EMAIL_SUPPORT`, `PRIORITY_EMAIL_SUPPORT`, `PHONE_SUPPORT`|
|Sociais|`SOCIAL_SHARING`, `LEARN_MORE_BUTTON`|
|Outro|`FREE_MODIFICATIONS`, `UNLIMITED_SUBMISSIONS`|

#### `PLAN_LEVELS: Record<string, number>`

Valores de hierarquia do plano: `FREE = 1`, `STANDARD = 2`, `PREMIUM = 3`.

#### `FEATURE_ACCESS: Record<Feature, FeatureAccess>`

A matriz de acesso mapeia cada recurso para seus planos permitidos. Tipos de acesso:
- `'all'` -- Todos os planos podem acessar
- `PaymentPlan` -- Somente esse plano específico
- `PaymentPlan[]` -- Apenas planos listados
- `{ minPlan: PaymentPlan }` -- Esse plano e acima

#### `PLAN_LIMITS: Record<PaymentPlan, FeatureLimits>`

Limites numéricos por plano:

|Limite|Grátis|Padrão|Prêmio|
|-------|------|----------|---------|
|`max_images`| 1 | 5 |ilimitado|
|`max_description_words`| 200 | 500 |ilimitado|
|`max_submissions`| 1 | 10 |ilimitado|
|`review_days`| 7 | 3 | 1 |
|`free_modification_days`| 0 | 30 | 365 |

### Tipos

#### `Feature`

```typescript
type Feature = (typeof FEATURES)[keyof typeof FEATURES];
// Union of all feature string values
```

#### `PlanGuardResult`

```typescript
interface PlanGuardResult {
  canAccess: (feature: Feature) => boolean;
  getLimit: <K extends keyof FeatureLimits>(limitName: K) => FeatureLimits[K];
  isWithinLimit: (limitName: keyof FeatureLimits, value: number) => boolean;
  accessibleFeatures: Feature[];
}
```

### Funções

#### `canAccessFeature(feature: Feature, userPlan: string): boolean`

Verifica se um plano tem acesso a um recurso com base na matriz de acesso.

#### `getFeatureLimit<K>(limitName: K, userPlan: string): FeatureLimits[K]`

Retorna o limite numérico para uma chave de limite de recurso específica. Retorna `null` ilimitado.

#### `isWithinLimit(limitName: keyof FeatureLimits, value: number, userPlan: string): boolean`

Verifica se um valor está dentro do limite do plano. Retorna `true` se o limite for `null` (ilimitado).

#### `getAccessibleFeatures(userPlan: string): Feature[]`

Retorna uma matriz de todos os recursos acessíveis pelo plano determinado.

#### `getMinimumPlanForFeature(feature: Feature): PaymentPlan`

Retorna o plano mais baixo que pode acessar um recurso. Útil para solicitações de atualização.

#### `getPlanLevel(plan: string): number`

Retorna o nível de hierarquia numérica de um plano (0 se for desconhecido).

#### `planMeetsRequirement(userPlan: string, requiredPlan: string): boolean`

Verifica se o plano do usuário atende ou excede o nível de plano exigido.

#### `createPlanGuard(userPlan: string)`

Função de fábrica que retorna um objeto guard vinculado a um plano de usuário específico:

```typescript
const guard = createPlanGuard('standard');
guard.canAccess(feature)          // boolean check
guard.requireFeature(feature)     // throws PlanGuardError if denied
guard.getLimit(limitName)         // get numeric limit
guard.isWithinLimit(name, value)  // check within limit
guard.requireWithinLimit(name, v) // throws if exceeded
guard.getAccessibleFeatures()     // all accessible features
guard.getPlan()                   // current plan string
guard.getPlanLevel()              // current plan level number
```

#### `createPlanGuardResult(userPlan: string): PlanGuardResult`

Cria um objeto de resultado adequado para ganchos React, pré-computando a lista de recursos acessíveis.

### Classes de erro

#### `PlanGuardError`

```typescript
class PlanGuardError extends Error {
  feature: Feature;
  userPlan: string;
  requiredPlan: PaymentPlan;
}
```

Lançado por `requireFeature()` quando o acesso é negado. Contém todas as informações necessárias para mostrar um prompt de atualização.

## Detalhes de implementação

**Resolução de acesso**: `canAccessFeature()` avalia o tipo de acesso na ordem: `'all'` -> correspondência de string de plano único -> matriz inclui verificação -> `{ minPlan }` comparação de hierarquia. Recursos desconhecidos retornam `false` com um aviso no console.

**Comparação baseada em hierarquia**: `planMeetsRequirement()` compara os níveis numéricos de `PLAN_LEVELS`, permitindo que os recursos sejam limitados por "este plano e superiores" sem listar explicitamente todos os planos.

**Nulo para ilimitado**: Os limites usam `null` para representar valores ilimitados. `isWithinLimit()` causa curto-circuito em `true` quando o limite é `null`.

**Protótipo seguro contra poluição**: As chaves de recursos vêm do objeto constante `FEATURES` e nunca são derivadas da entrada do usuário.

## Configuração

As regras de acesso a recursos são configuradas modificando os objetos `FEATURE_ACCESS` e `PLAN_LIMITS` em `plan-features.guard.ts`. Para adicionar um novo recurso:

1. Adicione uma constante a `FEATURES`
2. Adicione uma regra de acesso a `FEATURE_ACCESS`
3. Opcionalmente, adicione limites numéricos a `PLAN_LIMITS` (se o recurso tiver restrições de quantidade)

## Exemplos de uso

```typescript
// Simple feature check in an API route
import { canAccessFeature, FEATURES } from '@/lib/guards';

export async function POST(request: Request) {
  const userPlan = await getUserPlan(session);

  if (!canAccessFeature(FEATURES.UPLOAD_VIDEO, userPlan)) {
    return Response.json(
      { error: 'Video upload requires Premium plan' },
      { status: 403 }
    );
  }
  // ... handle upload
}

// Using the guard factory in a service
import { createPlanGuard, FEATURES } from '@/lib/guards';

async function submitProduct(data: ProductData, userPlan: string) {
  const guard = createPlanGuard(userPlan);

  // This throws PlanGuardError if not allowed
  guard.requireFeature(FEATURES.SUBMIT_PRODUCT);

  // Check numeric limits
  guard.requireWithinLimit('max_images', data.images.length);
  guard.requireWithinLimit('max_description_words', countWords(data.description));

  // Proceed with submission
  return await saveProduct(data);
}

// React hook usage
import { createPlanGuardResult, FEATURES } from '@/lib/guards';

function SubmissionForm({ userPlan }: { userPlan: string }) {
  const guard = createPlanGuardResult(userPlan);
  const imageLimit = guard.getLimit('max_images');

  return (
    <form>
      {guard.canAccess(FEATURES.UPLOAD_VIDEO) && <VideoUploader />}
      <ImageUploader maxImages={imageLimit ?? Infinity} />
      {!guard.canAccess(FEATURES.VERIFIED_BADGE) && (
        <UpgradePrompt feature="Verified Badge" />
      )}
    </form>
  );
}

// Get minimum plan for upgrade messaging
import { getMinimumPlanForFeature, FEATURES } from '@/lib/guards';

const requiredPlan = getMinimumPlanForFeature(FEATURES.ADVANCED_ANALYTICS);
// Returns PaymentPlan.PREMIUM
```

## Melhores práticas

- Sempre use constantes `FEATURES` em vez de strings brutas para obter segurança de tipo e preenchimento automático.
- Use `createPlanGuard()` com `requireFeature()` em rotas e serviços de API para aplicação do lado do servidor que gera erros.
- Use `createPlanGuardResult()` nos componentes React para controle de UI do lado do cliente sem exceções.
- Ao adicionar novos recursos, comece adicionando à constante `FEATURES` e à matriz `FEATURE_ACCESS` antes de escrever qualquer lógica de porta.
- Capture `PlanGuardError` no nível da rota da API e traduza-o em uma resposta 403 com informações de atualização (`requiredPlan`).

## Módulos Relacionados

- [Config Manager System](./config-manager-system.md) – Sinalizadores de recursos para recursos dependentes de banco de dados
- [Query Client System](./query-client-system.md) - Busca de dados de assinatura que alimenta os protetores do plano

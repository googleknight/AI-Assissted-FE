# 09 — Vue Quick Reference (Composition API, Vue 3)

> Light coverage in case the repo is Vue. The mental model is different enough from React that you don't want to be discovering this in the interview. 15 minutes of skim should be enough.

---

## Mental model: reactivity, not re-rendering

React: component function re-runs when state changes. You write functional code; React diffs the output.

Vue: state objects are wrapped in proxies. Mutations are tracked. Components subscribe to the reactive bits they read; only those subscribers re-run when those bits change.

**Implication:** In Vue, you can mutate state. In React, you must replace. Don't bring React reflexes (`setX([...arr, item])`) into Vue (`arr.push(item)` is fine and reactive).

---

## The three reactive primitives

### `ref` — single reactive value

```js
import { ref } from 'vue';
const count = ref(0);
console.log(count.value); // 0 — note .value in JS
count.value++;             // mutation tracked
```

In templates, `.value` is auto-unwrapped:
```vue
<template>{{ count }}</template>  <!-- no .value -->
```

### `reactive` — reactive object

```js
import { reactive } from 'vue';
const state = reactive({ count: 0, user: null });
state.count++; // tracked
state.user = { name: 'Alice' }; // tracked
```

No `.value`. But:
- Destructuring loses reactivity (`const { count } = state` → `count` is no longer reactive).
- Use `toRefs(state)` to destructure while keeping reactivity.

### `computed` — derived value

```js
import { computed } from 'vue';
const double = computed(() => count.value * 2);
console.log(double.value); // 0
```

Lazy + cached. Re-evaluates only when reactive deps change.

---

## Watchers

### `watch` — explicit deps

```js
import { watch } from 'vue';
watch(count, (newVal, oldVal) => {
  console.log('count changed', newVal);
});

watch([count, name], ([newCount, newName]) => { ... });

watch(() => obj.field, (val) => { ... }); // getter form
```

### `watchEffect` — auto-track deps

```js
import { watchEffect } from 'vue';
watchEffect(() => {
  console.log(count.value); // re-runs when count changes
});
```

Like React's `useEffect` but the deps are detected by what's read.

### Common pitfalls
- **Watching a reactive object:** Before Vue 3.5, `watch(state, fn)` on a `reactive` was implicitly deep — it fired on any nested mutation. In Vue 3.5+ this was reverted and behavior aligned with refs: by default it only fires on identity change (assignment). Always pass `{ deep: true }` if you need deep, or watch a getter (`() => state.field`).
- `watch(() => obj.field, fn)` watching a getter does NOT deep-watch the returned value by default — it only re-runs when the getter's return value changes (by `Object.is`). Pass `{ deep: true }` if you also want nested mutations of the returned object to trigger.
- Watchers run after Vue's reactive batch — by default after the DOM update.
- Stopping watchers: `const stop = watch(...); stop();` Or use lifecycle hooks.

---

## Component anatomy (SFC, `<script setup>`)

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({ userId: Number });
const emit = defineEmits(['save']);

const name = ref('');
const isValid = computed(() => name.value.length > 0);

onMounted(() => {
  console.log('mounted');
});

function handleSubmit() {
  if (isValid.value) emit('save', { name: name.value });
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="name" :placeholder="`User ${userId}`" />
    <button :disabled="!isValid">Save</button>
  </form>
</template>

<style scoped>
button:disabled { opacity: 0.5; }
</style>
```

Key directives:
- `v-model` — two-way binding.
- `v-if` / `v-else-if` / `v-else` — conditional render.
- `v-show` — toggle `display: none` (no unmount, faster toggle but keeps DOM).
- `v-for="item in items" :key="item.id"` — list.
- `@click="fn"` — event.
- `:prop="val"` — bind prop / attribute.
- `v-bind="obj"` — spread props.

---

## Lifecycle hooks (Composition API)

```js
import { onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue';
onMounted(() => { /* like React's useEffect(..., []) */ });
onUnmounted(() => { /* cleanup */ });
```

---

## Pinia (the state management library)

Replaced Vuex.

```js
// stores/user.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const isLoggedIn = computed(() => user.value !== null);
  function login(u) { user.value = u; }
  function logout() { user.value = null; }
  return { user, isLoggedIn, login, logout };
});
```

```vue
<script setup>
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';

const store = useUserStore();
const { user, isLoggedIn } = storeToRefs(store);  // keep reactivity in destructure
const { login, logout } = store;                  // actions are fine to destructure
</script>
```

Selector subscriptions: components only re-render when the reactive bits they read change.

---

## v-for keys (the same rules as React)

```vue
<li v-for="item in items" :key="item.id">{{ item.name }}</li>
```

Same rule: stable, unique keys. `:key="index"` has the same gotchas as React's `key={i}`.

---

## v-html (the XSS escape hatch)

```vue
<div v-html="userContent"></div>
```

Same risk as React's `dangerouslySetInnerHTML`. Sanitize with DOMPurify before rendering.

---

## v-model gotchas

- On a custom component, `v-model` binds to a `modelValue` prop and emits `update:modelValue`.
- Multiple v-models: `v-model:name`, `v-model:email`.
- `v-model.lazy` updates on blur, not input.
- `v-model.trim` / `.number` modifiers.

---

## Composables (like React custom hooks)

Vue's equivalent of custom hooks. Naming convention: `useXxx`.

```js
// composables/useFetch.js
import { ref, watchEffect } from 'vue';
export function useFetch(urlRef) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);

  watchEffect(async () => {
    loading.value = true;
    error.value = null;
    try {
      const r = await fetch(urlRef.value);
      data.value = await r.json();
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  });

  return { data, error, loading };
}
```

Race conditions and AbortController patterns are identical to React (doc 06).

---

## Nuxt (Vue's Next.js equivalent) — one-paragraph version

Nuxt is to Vue what Next.js is to React. SSR/SSG, file-based routing, server routes, auto-imports. If the repo is Nuxt, the structure (`pages/`, `server/api/`, `composables/`) mirrors what you've seen.

---

## Common Vue brownfield bugs

| Bug | Fix |
|---|---|
| Destructured `reactive` → lost reactivity | Use `toRefs` |
| `watch` on `reactive` doesn't fire on nested change | `{ deep: true }` or watch a getter |
| `v-for` without `:key` | Add stable key |
| `v-html` with user input | Sanitize |
| `ref` modified without `.value` in JS | Add `.value` |
| Direct DOM access during setup | Use `onMounted` or `ref="..."` + template ref |
| `props` destructured in script setup | Lose reactivity — keep as `props.x` |

---

## React → Vue translation cheat sheet

| React | Vue |
|---|---|
| `useState(0)` | `ref(0)` (use `.value` in JS) |
| `useState({...})` | `reactive({...})` |
| `useMemo(() => ..., [deps])` | `computed(() => ...)` |
| `useEffect(() => ..., [deps])` | `watch(deps, ...)` |
| `useEffect(() => ..., [])` | `onMounted(...)` |
| `useEffect(() => () => ..., [])` | `onUnmounted(...)` |
| `useCallback` | (rarely needed — Vue's reactivity is finer-grained) |
| Custom hook | Composable |
| `React.memo` | (not needed — same reason as above) |
| Context | Provide / inject, or Pinia |
| Redux/Zustand | Pinia |
| React Query | TanStack Query (cross-framework) or VueQuery |

---

## If the repo is Vue, this is your first 5 minutes

1. Check Vue version: `package.json` (Vue 2 vs Vue 3 is a chasm — Composition API only in 3+).
2. SFC structure: `<script setup>` is the modern style.
3. State: Pinia stores in `/stores`?
4. Routing: Vue Router config.
5. Run the app, browse, then start review.

You won't write much Vue code in 60 minutes. If you can read it confidently and apply the same review framework (doc 01) with Vue-aware specifics, you're fine.

Next: `10-common-bugs-cheatsheet.md`.

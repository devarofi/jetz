# Jetz

A composable javascript framework.

## Install

```sh
npm install jetz
# or
pnpm add jetz
```

## Usage

```js
import { Jetz, stateOf } from 'jetz';
import { div, button, find } from 'jetz/ui';
import { Router, route } from 'jetz/router';

const count = stateOf(0);
Jetz.mount(div('Count : ', count, button('Click me', { onclick() { count.value++; } })), find('#app'));
```

## Entry points

- `jetz` — core: `Jetz`, state, components, conditionals, lifecycle, utilities
- `jetz/ui` — element factories, attribute/event helpers, `find`/`findAll`, `text`
- `jetz/router` — `Router`, `route()`, `link()`
- `jetz/session` — `JetzSession`, `sessionOf()`
- `jetz/middleware` — `Middleware`, `middleware()`
- `jetz/test` — `JTest` DOM test helper

See the [main README](../../README.md) for the full API documentation.

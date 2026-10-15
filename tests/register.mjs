// register.mjs — imported with `node --import ./register.mjs` so the pg
// redirect is active before any api/ module is loaded.
import { register } from 'node:module';
register('./resolve-hooks.mjs', import.meta.url);

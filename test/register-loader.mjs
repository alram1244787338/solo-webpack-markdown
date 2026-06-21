// Register the test ESM loader via --import so it is active before the runner runs.
import { register } from 'node:module';

register(new URL('./loader.mjs', import.meta.url).href);

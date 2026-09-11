import { defineConfig } from '@vscode/test-cli';

// Integration tests run inside a real VS Code host.
// Pure unit tests live in out/test/unit and run with plain mocha (npm run test:unit).
export default defineConfig({
	files: 'out/test/integration/**/*.test.js',
});

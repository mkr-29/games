import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '');
    const currentEnv = env.ENV || env.VITE_ENV || mode || 'dev';

    return {
        define: {
            'import.meta.env.ENV': JSON.stringify(currentEnv),
            'import.meta.env.VITE_ENV': JSON.stringify(currentEnv),
            'process.env.ENV': JSON.stringify(currentEnv)
        },
        envPrefix: ['VITE_', 'ENV']
    };
});

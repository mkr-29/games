// env.js - Centralized Environment Configuration & Utilities

export const getEnv = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        if (import.meta.env.ENV) return import.meta.env.ENV.toLowerCase();
        if (import.meta.env.VITE_ENV) return import.meta.env.VITE_ENV.toLowerCase();
        if (import.meta.env.MODE) return import.meta.env.MODE.toLowerCase();
    }
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.ENV) return process.env.ENV.toLowerCase();
        if (process.env.VITE_ENV) return process.env.VITE_ENV.toLowerCase();
        if (process.env.NODE_ENV) return process.env.NODE_ENV.toLowerCase();
    }
    return 'dev';
};

export const isDev = () => {
    const env = getEnv();
    return env === 'dev' || env === 'development';
};

export const getConfig = () => {
    const isDevelopment = isDev();
    return {
        env: getEnv(),
        isDev: isDevelopment,
        title: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_TITLE) || 'MotoGP Manager - Paddock Tycoon',
        version: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_VERSION) || '1.1.0',
        autoSaveIntervalSec: Number((typeof import.meta !== 'undefined' && import.meta.env?.VITE_AUTO_SAVE_INTERVAL_SEC) || 15),
        debugMode: isDevelopment || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEBUG_MODE === 'true')
    };
};

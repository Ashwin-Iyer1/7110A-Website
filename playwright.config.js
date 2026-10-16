import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'tests/browser',use:{baseURL:'http://127.0.0.1:4198',viewport:{width:1280,height:1000}},webServer:{command:'npm run build && npx vite preview --host 127.0.0.1 --port 4198 --strictPort',url:'http://127.0.0.1:4198',reuseExistingServer:false},reporter:'list' });

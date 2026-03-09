/// <reference types="vite/client" />

declare interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_ANON_KEY: string;
	// 다른 환경 변수도 여기에 추가 가능
}

declare interface ImportMeta {
	readonly env: ImportMetaEnv;
}

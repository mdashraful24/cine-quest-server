import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	node_env: process.env.NODE_ENV,
	port: process.env.PORT,
	database_url: process.env.DATABASE_URL,
	frontend_url: process.env.FRONTEND_URL,
	api_prefix: process.env.API_PREFIX,
	trust_proxy: process.env.TRUST_PROXY,
	seed_on_start: process.env.SEED_ON_START ?? "false",
};

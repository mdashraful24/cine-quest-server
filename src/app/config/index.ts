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
	cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
	cloudinary_api_key: process.env.CLOUDINARY_API_KEY ?? "",
	cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
	seed_on_start: process.env.SEED_ON_START ?? "false",
};

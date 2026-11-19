import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

type PrismaClientLike = {
	$connect: () => Promise<void>;
	$disconnect: () => Promise<void>;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const clientModule = (await import("@prisma/client")) as unknown as {
	PrismaClient: new (options: { adapter: PrismaPg }) => PrismaClientLike;
};

export const prisma = new clientModule.PrismaClient({ adapter });

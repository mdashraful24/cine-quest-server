import { prisma } from "../../src/app/lib/prisma";
import { seedDatabase } from "./seed";

try {
	await seedDatabase();
} finally {
	await prisma.$disconnect();
}

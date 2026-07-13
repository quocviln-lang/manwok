import { PrismaClient } from "../generated/prisma/client.js";

// @ts-ignore: Temporary bypass until a database adapter is provided
const prisma = new PrismaClient({});

export default prisma;

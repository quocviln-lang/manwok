import prisma from "./src/prisma/prisma.js";

async function run() {
  await prisma.user.updateMany({
    data: { isActive: true },
  });
  console.log("All users activated");
}

run();

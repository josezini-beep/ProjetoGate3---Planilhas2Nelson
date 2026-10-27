import prisma from "./db/prisma";

async function main() {
    try {
        const total = await prisma.clientes.count();

        console.log("Total de clientes:", total);

    } catch (erro) {
        console.error("Erro ao consultar clientes:", erro);

    } finally {
        await prisma.$disconnect();
    }
}

main();
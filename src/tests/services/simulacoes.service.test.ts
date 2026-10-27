import prisma from "../../db/prisma";
import {
    listarSimulacoes,
    buscarSimulacaoPorId,
    buscarSimulacoesPorUc,
    buscarSimulacoesPorCpf,
    editarSimulacao
} from "../../services/simulacoes/simulacoes.service";

jest.mock("../../db/prisma", () => ({
    __esModule: true,
    default: {
        simulacoes: {
            findMany: jest.fn(),
            findFirst: jest.fn()
        }
    }
}));

describe("Service de simulações", () => {

    it("deve listar as simulações não apagadas", async () => {

        const simulacoes = [
            { id: 1, uc: "12345", apagado: false }
        ];

        (prisma.simulacoes.findMany as jest.Mock)
            .mockResolvedValue(simulacoes);

        const resultado = await listarSimulacoes();

        expect(resultado).toEqual(simulacoes);

        expect(prisma.simulacoes.findMany).toHaveBeenCalledWith({
            where: {
                apagado: false
            },
            orderBy: {
                id: "asc"
            }
        });
    });

    it("deve buscar uma simulação pelo ID", async () => {

        const simulacao = {
            id: 1,
            uc: "12345",
            apagado: false
        };

        (prisma.simulacoes.findFirst as jest.Mock)
            .mockResolvedValue(simulacao);

        const resultado = await buscarSimulacaoPorId(1);

        expect(resultado).toEqual(simulacao);

        expect(prisma.simulacoes.findFirst).toHaveBeenCalledWith({
            where: {
                id: 1,
                apagado: false
            }
        });
    });
    it("deve retornar null quando a simulação não existir", async () => {
        (prisma.simulacoes.findFirst as jest.Mock)
            .mockResolvedValue(null);

        const resultado = await buscarSimulacaoPorId(999);

        expect(resultado).toBeNull();

        expect(prisma.simulacoes.findFirst).toHaveBeenCalledWith({
            where: {
                id: 999,
                apagado: false
            }
        });
    });
    it("deve buscar todas as simulações de uma UC", async () => {

    const simulacoes = [
        { id: 1, uc: "12345", apagado: false },
        { id: 2, uc: "12345", apagado: false }
    ];

    (prisma.simulacoes.findMany as jest.Mock)
        .mockResolvedValue(simulacoes);

    const resultado = await buscarSimulacoesPorUc("12345");

    expect(resultado).toEqual(simulacoes);

    expect(prisma.simulacoes.findMany).toHaveBeenCalledWith({
        where: {
            uc: "12345",
            apagado: false
        },
        orderBy: {
            id: "asc"
        }
    });
    });

    it("deve retornar um array vazio quando a UC não existir", async () => {

    (prisma.simulacoes.findMany as jest.Mock)
        .mockResolvedValue([]);

    const resultado = await buscarSimulacoesPorUc("99999");

    expect(resultado).toEqual([]);
    });

    it("deve retornar todas as simulções de um cpf",async () =>{

    const simulacoes = [
        { id: 1, uc: "12345", cpf: "12345", apagado: false },
        { id: 2, uc: "12345", cpf: "12345", apagado: false }
    ];

    (prisma.simulacoes.findMany as jest.Mock)
        .mockResolvedValue(simulacoes);

    const resultado = await buscarSimulacoesPorCpf("12345");

    expect(resultado).toEqual(simulacoes);

    expect(prisma.simulacoes.findMany).toHaveBeenCalledWith({
        where: {
            cpf: "12345",
            apagado: false
        },
        orderBy: {
            id: "asc"
        }
    });
    });
    it("deve retornar 200 quando editar corretamente",async( =>{
        
    }))
 
});


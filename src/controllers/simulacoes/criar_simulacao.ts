import { criarSimulacaoService, listarSimulacoes, buscarSimulacaoPorId } from "../../services/simulacoes/simulacoes.service";
import { Request, Response } from "express";
import  ErroHttp  from "../../errors/erro-http";


export const simulacoesController = {
    listar: async (_req: Request, res: Response) => {
        try {
            const resultado = await listarSimulacoes();
            return res.json(resultado);
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({
            erro: "Erro ao listar simulações."
            });
        }
    },
     buscarPorId: async (req: Request, res: Response) => {
        const parametroId = Array.isArray(req.params.id)
         ? req.params.id[0]
        : req.params.id;

        const id = Number(parametroId);

        if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
            return res.status(400).json({ erro: "ID inválido." });
        }
        try {
            const resultado = await buscarSimulacaoPorId(id);
            if (!resultado) {
            return res.status(404).json({
                erro: "Simulação não encontrada."
            });
            }
            return res.json(resultado);
        } catch (erro) {
            console.error(erro);
         return res.status(500).json({
            erro: "Erro ao buscar simulação."
        });
        }
     },
    create: async (req: Request, res: Response) => {
        console.log("Controller executado!");
        try {
            const resultado = await criarSimulacaoService.create(req.body);  
            return res.status(200).json(resultado);      
        } catch (erro) {
            console.error("ERRO NO CONTROLLER:", erro);
            if (erro instanceof ErroHttp) {
                return res.status(erro.status).json({ erro: erro.message });
            }
            return res.status(500).json({
                erro: "Erro ao cadastrar simulação."
            });
        }
    }
};

import { criarSimulacaoService, listarSimulacoes } from "../../services/simulacoes/simulacoes.service";
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

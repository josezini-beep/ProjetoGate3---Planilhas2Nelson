import { criarSimulacaoService } from "../../services/simulacoes.service";
import { Request, Response } from "express";

export const simulacoesController = {
  create: async (req: Request, res: Response) => {
    try{
    const resultado = await criarSimulacaoService.create(req.body);  
    res.status(200).json(resultado);      
        }
    catch (erro) {
     console.error(erro);
     return res.status(500).json({
      erro: "Erro ao cadastrar simulação."
  });
}
}
};

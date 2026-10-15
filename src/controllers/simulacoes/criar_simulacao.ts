import { criarSimulacaoService } from "../../services/simulacoes.service";
import { Request, Response } from "express";
import  ErroHttp  from "../../errors/erro-http";

export const simulacoesController = {
  create: async (req: Request, res: Response) => {
       try{
       const resultado = await criarSimulacaoService.create(req.body);  
       return res.status(200).json(resultado);      
           }
        catch (erro) {
    if (erro instanceof ErroHttp) {
        return res.status(erro.status).json({
        erro: erro.message
     });
 }
      return res.status(500).json({
        erro: "Erro ao cadastrar simulação."});
 }

}
};

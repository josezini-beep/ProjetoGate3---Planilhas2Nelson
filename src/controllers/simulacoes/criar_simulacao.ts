import { criarSimulacaoService, listarSimulacoes, buscarSimulacaoPorId, buscarSimulacoesPorUc, editarSimulacao,buscarSimulacoesPorCpf,excluirSimulacao } from "../../services/simulacoes/simulacoes.service";
import { Request, Response } from "express";
import  ErroHttp  from "../../errors/erro-http";


export const simulacoesController = {
    
editar: async (req: Request, res: Response) => {
    const parametroId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    const id = Number(parametroId);

    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
        return res.status(400).json({
            erro: "ID inválido."
        });
    }

    try {
        const resultado = await editarSimulacao(id, req.body);

        if (!resultado) {
            return res.status(404).json({
                erro: "Simulação não encontrada."
            });
        }

        return res.status(200).json(resultado);

    } catch (erro) {
        const falha = erro as Error & { status?: number };

        console.error(erro);

        return res.status(falha.status ?? 500).json({
            erro: falha.message || "Erro ao editar simulação."
        });
    }
},
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
    buscarPorUc: async (req: Request, res: Response) => {
  const uc = Array.isArray(req.params.uc)
    ? req.params.uc[0] : req.params.uc;
  try {
    const resultado = await buscarSimulacoesPorUc(uc);
    return res.json(resultado);
 } catch (erro) {
        console.error(erro);
      return res.status(500).json({
        erro: "Erro ao buscar por UC."
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
    },
    buscarPorCpf: async (req: Request, res: Response) => {
  const cpf = Array.isArray(req.params.cpf)
    ? req.params.cpf[0]
    : req.params.cpf;

  try {
    const resultado = await buscarSimulacoesPorCpf(cpf);
    return res.json(resultado);
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao buscar por CPF."
    });
  }
    },
    excluir: async (req: Request, res: Response) => {
  const parametroId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  const id = Number(parametroId);

  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    return res.status(400).json({
      erro: "ID inválido."
    });
  }

  try {
    const resultado = await excluirSimulacao(id);

    if (!resultado) {
      return res.status(404).json({
        erro: "Simulação não encontrada ou já apagada."
      });
    }

    return res.status(200).json({
      mensagem: "Simulação marcada como apagada.",
      id: resultado.id
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao apagar simulação."
    });
  }
    },
};

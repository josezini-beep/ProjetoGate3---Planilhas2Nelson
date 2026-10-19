import { Request, Response } from "express";
import {
  importarClientes,
  consultarImportacao as consultarImportacaoService
} from "../../services/clientes/clientes.service";

export const clientesController = {
  importar: async (_req: Request, res: Response) => {
    try {
      const resultado = await importarClientes();
      res.status(200).json(resultado);
    } catch (erro) {
      console.error(erro);

      const falha = erro as Error & {
        status?: number;
        importacaoId?: string;
        inseridos?: number;
        duplicados?: number;
        invalidos?: number;
      };

      if (falha.status === 429) {
        res.status(429).json({ erro: falha.message });
        return;
      }

      if (falha.importacaoId) {
        res.status(500).json({
          erro: falha.message,
          mensagem: "Os registros já inseridos permanecem no banco.",
          importacao_id: falha.importacaoId,
          inseridos: falha.inseridos,
          duplicados: falha.duplicados,
          invalidos: falha.invalidos
        });
        return;
      }

      res.status(500).json({
        erro: "Erro ao importar clientes."
      });
    }
  },

  consultarImportacao: (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

const resultado = consultarImportacaoService(id);
      res.json(resultado);
    } catch (erro) {
      const falha = erro as Error & { status?: number };

      res.status(falha.status ?? 500).json({
        erro: falha.message
      });
    }
  }
};
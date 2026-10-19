
import { Router } from "express";
import {
  importarClientes,
  consultarImportacao
} from "../../services/clientes/clientes.service";

const router = Router();

router.post("/clientes/importar", async (_req, res) => {
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
});

router.get("/clientes/importacoes/:id", (req, res) => {
  try {
    const resultado = consultarImportacao(req.params.id);
    res.json(resultado);
  } catch (erro) {
    const falha = erro as Error & { status?: number };

    res.status(falha.status ?? 500).json({
      erro: falha.message
    });
  }
});

export default router;

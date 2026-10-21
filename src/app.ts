import express from "express";
import { simulacoesController } from "./controllers/simulacoes/criar_simulacao";
import { clientesController } from "./controllers/clientes/clientes.controller";

const app = express();

app.use(express.json());

// Lista todas as simulações.
app.get("/simulacoes", simulacoesController.listar);

//Cadastra uma simulação.

app.post("/simulacoes", simulacoesController.create);

// Busca uma simulação pelo ID.
app.get("/simulacoes/:id", simulacoesController.buscarPorId);

// Lista as simulações de uma UC.
app.get("/simulacoes/uc/:uc", simulacoesController.buscarPorUc);

// Lista as simulações de um CPF.
app.get("/simulacoes/cpf/:cpf", simulacoesController.buscarPorCpf); 

// Edita uma simulação pelo ID.
app.put("/simulacoes/:id", simulacoesController.editar);

//exlui uma simulação pelo id
app.delete("/simulacoes/:id", simulacoesController.excluir);

// Importar lista de clientes

app.post("/clientes/importar",clientesController.importar);

// consultar um cliente importado

app.get("/clientes/importacoes/:id",clientesController.consultarImportacao);

export default app;
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const criar_simulacao_1 = require("./controllers/simulacoes/criar_simulacao");
const clientes_controller_1 = require("./controllers/clientes/clientes.controller");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Lista todas as simulações.
app.get("/simulacoes", criar_simulacao_1.simulacoesController.listar);
//Cadastra uma simulação.
app.post("/simulacoes", criar_simulacao_1.simulacoesController.create);
// Busca uma simulação pelo ID.
app.get("/simulacoes/:id", criar_simulacao_1.simulacoesController.buscarPorId);
// Lista as simulações de uma UC.
app.get("/simulacoes/uc/:uc", criar_simulacao_1.simulacoesController.buscarPorUc);
// Lista as simulações de um CPF.
app.get("/simulacoes/cpf/:cpf", criar_simulacao_1.simulacoesController.buscarPorCpf);
// Edita uma simulação pelo ID.
app.put("/simulacoes/:id", criar_simulacao_1.simulacoesController.editar);
//exlui uma simulação pelo id
app.delete("/simulacoes/:id", criar_simulacao_1.simulacoesController.excluir);
// Importar lista de clientes
app.post("/clientes/importar", clientes_controller_1.clientesController.importar);
// consultar um cliente importado
app.get("/clientes/importacoes/:id", clientes_controller_1.clientesController.consultarImportacao);
exports.default = app;

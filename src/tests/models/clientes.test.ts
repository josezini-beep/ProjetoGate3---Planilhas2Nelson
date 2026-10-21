
import request from "supertest";
import app from "../../app";
import {
  importarClientes,
  consultarImportacao as consultarImportacaoService,
} from "../../services/clientes/clientes.service";

jest.mock("../services/clientes/clientes.service", () => ({
  importarClientes: jest.fn(),
  consultarImportacao: jest.fn(),
}));

const servico = require("../services/clientes/clientes.service");

describe("POST /clientes/importar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve importar clientes com sucesso", async () => {
    const resultado = {
      mensagem: "Importação concluída.",
      inseridos: 10,
      duplicados: 2,
      invalidos: 1,
    };

    servico.importarClientes.mockResolvedValue(resultado);

    const resposta = await request(app).post("/clientes/importar");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(resultado);
    expect(importarClientes).toHaveBeenCalledTimes(1);
  });

  it("deve retornar 429 quando houver limite de requisições", async () => {
    const erro = Object.assign(
      new Error("Muitas requisições."),
      { status: 429 },
    );

    servico.importarClientes.mockRejectedValue(erro);

    const resposta = await request(app).post("/clientes/importar");

    expect(resposta.status).toBe(429);
    expect(resposta.body).toEqual({
      erro: "Muitas requisições.",
    });
  });

  it("deve retornar 500 e os detalhes quando a importação falhar parcialmente", async () => {
    const erro = Object.assign(
      new Error("Falha durante a importação."),
      {
        importacaoId: "importacao-123",
        inseridos: 5,
        duplicados: 2,
        invalidos: 1,
      },
    );

    servico.importarClientes.mockRejectedValue(erro);

    const resposta = await request(app).post("/clientes/importar");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: "Falha durante a importação.",
      mensagem: "Os registros já inseridos permanecem no banco.",
      importacao_id: "importacao-123",
      inseridos: 5,
      duplicados: 2,
      invalidos: 1,
    });
  });

  it("deve retornar 500 quando ocorrer um erro inesperado", async () => {
    servico.importarClientes.mockRejectedValue(
      new Error("Erro interno."),
    );

    const resposta = await request(app).post("/clientes/importar");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: "Erro ao importar clientes.",
    });
  });
});

describe("GET /clientes/importacoes/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve consultar uma importação com sucesso", async () => {
    const resultado = {
      id: "importacao-123",
      status: "concluida",
      totais: {
        inseridos: 10,
        duplicados: 2,
        invalidos: 1,
      },
    };

    servico.consultarImportacao.mockReturnValue(resultado);

    const resposta = await request(app).get(
      "/clientes/importacoes/importacao-123",
    );

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(resultado);
    expect(consultarImportacaoService).toHaveBeenCalledWith(
      "importacao-123",
    );
  });

  it("deve retornar o status de erro lançado pelo service", async () => {
    const erro = Object.assign(
      new Error("Importação não encontrada."),
      { status: 404 },
    );

    servico.consultarImportacao.mockImplementation(() => {
      throw erro;
    });

    const resposta = await request(app).get(
      "/clientes/importacoes/importacao-inexistente",
    );

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      erro: "Importação não encontrada.",
    });
  });

  it("deve retornar 500 quando ocorrer um erro inesperado na consulta", async () => {
    servico.consultarImportacao.mockImplementation(() => {
      throw new Error("Erro interno.");
    });

    const resposta = await request(app).get(
      "/clientes/importacoes/importacao-123",
    );

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: "Erro interno.",
    });
  });
});

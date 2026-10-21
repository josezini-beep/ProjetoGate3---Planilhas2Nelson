
import request from "supertest";
import app from "../app";
import {
  listarSimulacoes,
  criarSimulacaoService
} from "../services/simulacoes/simulacoes.service";
import ErroHttp from "../errors/erro-http";

jest.mock("../services/simulacoes/simulacoes.service", () => ({
  criarSimulacaoService: {
    create: jest.fn(),
  },
  listarSimulacoes: jest.fn(),
  buscarSimulacaoPorId: jest.fn(),
  buscarSimulacoesPorUc: jest.fn(),
  editarSimulacao: jest.fn(),
  buscarSimulacoesPorCpf: jest.fn(),
  excluirSimulacao: jest.fn(),
}));

const {
  buscarSimulacaoPorId,
  buscarSimulacoesPorUc,
  buscarSimulacoesPorCpf,
  editarSimulacao,
  excluirSimulacao,
} = require("../services/simulacoes/simulacoes.service");

// GET /simulacoes
describe("GET /simulacoes", () => {
  it("deve retornar a lista de simulações", async () => {
    (listarSimulacoes as jest.Mock).mockResolvedValue([
      { id: 1, uc: "12345" },
      { id: 2, uc: "67890" },
    ]);

    const resposta = await request(app).get("/simulacoes");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([
      { id: 1, uc: "12345" },
      { id: 2, uc: "67890" },
    ]);
  });

  it("deve retornar 500 quando ocorrer um erro ao listar", async () => {
    (listarSimulacoes as jest.Mock).mockRejectedValue(
      new Error("Erro inesperado")
    );

    const resposta = await request(app).get("/simulacoes");

    expect(resposta.status).toBe(500);
  });
});

// POST /simulacoes
describe("POST /simulacoes", () => {
  it("deve retornar 400 quando os dados forem inválidos", async () => {
    (criarSimulacaoService.create as jest.Mock).mockRejectedValue(
      new ErroHttp("Dados inválidos", 400)
    );

    const resposta = await request(app)
      .post("/simulacoes")
      .send({ kwh: -5 });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      erro: "Dados inválidos",
    });
  });

  it("deve criar uma simulação e retornar 200", async () => {
    const simulacao = {
      id: 1,
      uc: "12345",
      concessionaria: "Copel",
      encargos: 10,
      impostos: 5,
      kwh: 100,
      valor_kwh: 0.8,
      desconto_percentual: 10,
      economia_mensal: "8.00",
      economia_anual: "96.00",
    };

    (criarSimulacaoService.create as jest.Mock).mockResolvedValue(
      simulacao
    );

    const resposta = await request(app)
      .post("/simulacoes")
      .send({
        uc: "12345",
        concessionaria: "Copel",
        encargos: 10,
        impostos: 5,
        kwh: 100,
        valor_kwh: 0.8,
        desconto_percentual: 10,
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(simulacao);
  });

  it("deve retornar 500 quando ocorrer um erro inesperado", async () => {
    (criarSimulacaoService.create as jest.Mock).mockRejectedValue(
      new Error("Erro inesperado")
    );

    const resposta = await request(app)
      .post("/simulacoes")
      .send({
        uc: "12345",
        concessionaria: "Copel",
        encargos: 10,
        impostos: 5,
        kwh: 100,
        valor_kwh: 0.8,
        desconto_percentual: 10,
      });

    expect(resposta.status).toBe(500);
  });
});

// GET /simulacoes/:id
describe("GET /simulacoes/:id", () => {
  it("deve retornar 400 quando o ID for inválido", async () => {
    const resposta = await request(app).get("/simulacoes/abc");

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      erro: "ID inválido.",
    });
  });

  it("deve retornar 404 quando a simulação não existir", async () => {
    (buscarSimulacaoPorId as jest.Mock).mockResolvedValue(null);

    const resposta = await request(app).get("/simulacoes/999");

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      erro: "Simulação não encontrada.",
    });
  });

  it("deve retornar uma simulação quando o ID existir", async () => {
    const simulacao = {
      id: 1,
      uc: "12345",
      concessionaria: "Copel",
      kwh: 100,
    };

    (buscarSimulacaoPorId as jest.Mock).mockResolvedValue(simulacao);

    const resposta = await request(app).get("/simulacoes/1");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(simulacao);
  });

  it("deve retornar 500 quando ocorrer um erro inesperado", async () => {
    (buscarSimulacaoPorId as jest.Mock).mockRejectedValue(
      new Error("Erro inesperado")
    );

    const resposta = await request(app).get("/simulacoes/1");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: "Erro ao buscar simulação.",
    });
  });
});

// GET /simulacoes/uc/:uc
describe("GET /simulacoes/uc/:uc", () => {
  it("deve retornar as simulações da UC informada", async () => {
    const simulacoes = [
      { id: 1, uc: "12345" },
      { id: 2, uc: "12345" },
    ];

    (buscarSimulacoesPorUc as jest.Mock).mockResolvedValue(simulacoes);

    const resposta = await request(app).get("/simulacoes/uc/12345");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(simulacoes);
  });

  it("deve retornar uma lista vazia quando não houver simulações", async () => {
    (buscarSimulacoesPorUc as jest.Mock).mockResolvedValue([]);

    const resposta = await request(app).get("/simulacoes/uc/99999");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it("deve retornar 500 quando ocorrer um erro inesperado", async () => {
    (buscarSimulacoesPorUc as jest.Mock).mockRejectedValue(
      new Error("Erro inesperado")
    );

    const resposta = await request(app).get("/simulacoes/uc/12345");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: "Erro ao buscar por UC.",
    });
  });
});

// GET /simulacoes/cpf/:cpf
describe("GET /simulacoes/cpf/:cpf", () => {
  it("deve retornar as simulações do CPF informado", async () => {
    const simulacoes = [
      { id: 1, cpf: "12345678900", uc: "12345" },
    ];

    (buscarSimulacoesPorCpf as jest.Mock).mockResolvedValue(simulacoes);

    const resposta = await request(app).get(
      "/simulacoes/cpf/12345678900"
    );

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(simulacoes);
  });

  it("deve retornar uma lista vazia quando não houver simulações", async () => {
    (buscarSimulacoesPorCpf as jest.Mock).mockResolvedValue([]);

    const resposta = await request(app).get(
      "/simulacoes/cpf/99999999999"
    );

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it("deve retornar 500 quando ocorrer um erro inesperado", async () => {
    (buscarSimulacoesPorCpf as jest.Mock).mockRejectedValue(
      new Error("Erro inesperado")
    );

    const resposta = await request(app).get(
      "/simulacoes/cpf/12345678900"
    );

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: "Erro ao buscar por CPF.",
    });
  });
});

// PUT /simulacoes/:id
describe("PUT /simulacoes/:id", () => {
  it("deve retornar 400 quando o ID for inválido", async () => {
    const resposta = await request(app)
      .put("/simulacoes/abc")
      .send({
        uc: "12345",
        concessionaria: "Copel",
        kwh: 200,
      });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      erro: "ID inválido.",
    });
  });

  it("deve editar uma simulação com sucesso", async () => {
    const simulacao = {
      id: 1,
      uc: "12345",
      concessionaria: "Copel",
      kwh: 200,
    };

    (editarSimulacao as jest.Mock).mockResolvedValue(simulacao);

    const resposta = await request(app)
      .put("/simulacoes/1")
      .send({
        uc: "12345",
        concessionaria: "Copel",
        kwh: 200,
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(simulacao);
  });

  it("deve retornar 404 quando a simulação não existir", async () => {
    (editarSimulacao as jest.Mock).mockResolvedValue(null);

    const resposta = await request(app)
      .put("/simulacoes/999")
      .send({
        uc: "12345",
        concessionaria: "Copel",
        kwh: 200,
      });

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      erro: "Simulação não encontrada.",
    });
  });

  it("deve retornar 500 quando ocorrer um erro ao editar", async () => {
    (editarSimulacao as jest.Mock).mockRejectedValue(
      new Error("Erro inesperado")
    );

    const resposta = await request(app)
      .put("/simulacoes/1")
      .send({
        uc: "12345",
        concessionaria: "Copel",
        kwh: 200,
      });

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: "Erro inesperado",
    });
  });
});

// DELETE /simulacoes/:id
describe("DELETE /simulacoes/:id", () => {
  it("deve retornar 400 quando o ID for inválido", async () => {
    const resposta = await request(app).delete("/simulacoes/abc");

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      erro: "ID inválido.",
    });
  });

  it("deve excluir uma simulação com sucesso", async () => {
    (excluirSimulacao as jest.Mock).mockResolvedValue({ id: 1 });

    const resposta = await request(app).delete("/simulacoes/1");

    expect(resposta.status).toBe(200);
  });

  it("deve retornar 404 quando a simulação não existir", async () => {
    (excluirSimulacao as jest.Mock).mockResolvedValue(null);

    const resposta = await request(app).delete("/simulacoes/999");

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      erro: "Simulação não encontrada ou já apagada.",
    });
  });

  it("deve retornar 500 quando ocorrer um erro ao excluir", async () => {
    (excluirSimulacao as jest.Mock).mockRejectedValue(
      new Error("Erro inesperado")
    );

    const resposta = await request(app).delete("/simulacoes/1");

    expect(resposta.status).toBe(500);
  });
});

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
  excluirSimulacao: jest.fn()
}));

describe("GET /simulacoes", () => {
  it("deve retornar a lista de simulações", async () => {
    (listarSimulacoes as jest.Mock).mockResolvedValue([
      { id: 1, uc: "12345" },
      { id: 2, uc: "67890" } 
    ]);

    const resposta = await request(app).get("/simulacoes");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([
      { id: 1, uc: "12345" },
      { id: 2, uc: "67890" }
    ]);
  });
});



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
      erro: "Dados inválidos"
    });
  });
});

describe("POST /simulacoes - sucesso", () => {
  it("deve criar uma simulação e retornar 200", async () => {
    (criarSimulacaoService.create as jest.Mock).mockResolvedValue({
      id: 1,
      uc: "12345",
      concessionaria: "Copel",
      encargos: 10,
      impostos: 5,
      kwh: 100,
      valor_kwh: 0.8,
      desconto_percentual: 10,
      economia_mensal: "8.00",
      economia_anual: "96.00"
    });

    const resposta = await request(app)
      .post("/simulacoes")
      .send({
        uc: "12345",
        concessionaria: "Copel",
        encargos: 10,
        impostos: 5,
        kwh: 100,
        valor_kwh: 0.8,
        desconto_percentual: 10
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body.id).toBe(1);
    expect(resposta.body.economia_mensal).toBe("8.00");
    expect(resposta.body.economia_anual).toBe("96.00");
  });
});

describe("GET /simulacoes/:id", () => {
  it("deve retornar 400 quando o ID for inválido", async () => {
    const resposta = await request(app).get("/simulacoes/abc");

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      erro: "ID inválido."
    });
  });

  it("deve retornar 404 quando a simulação não existir", async () => {
    const { buscarSimulacaoPorId } =
      require("../services/simulacoes/simulacoes.service");

    buscarSimulacaoPorId.mockResolvedValue(null);

    const resposta = await request(app).get("/simulacoes/999");

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      erro: "Simulação não encontrada."
    });
  })
  it("deve retornar uma simulação quando o ID existir", async () => {
  const { buscarSimulacaoPorId } =
    require("../services/simulacoes/simulacoes.service");

  const simulacao = {
    id: 1,
    uc: "12345",
    concessionaria: "Copel",
    kwh: 100
  };

  buscarSimulacaoPorId.mockResolvedValue(simulacao);

  const resposta = await request(app).get("/simulacoes/1");

  expect(resposta.status).toBe(200);
  expect(resposta.body).toEqual(simulacao);
});
  it("deve retornar 500 quando ocorrer um erro inesperado", async () => {
    const { buscarSimulacaoPorId } =
      require("../services/simulacoes/simulacoes.service");

    buscarSimulacaoPorId.mockRejectedValue(
      new Error("Erro inesperado")
    );

    const resposta = await request(app).get("/simulacoes/1");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: "Erro ao buscar simulação."
    });
  });
  describe("GET /simulacoes/uc/:uc", () => {
  it("deve retornar as simulações da UC informada", async () => {
    const { buscarSimulacoesPorUc } =
      require("../services/simulacoes/simulacoes.service");

    const simulacoes = [
      { id: 1, uc: "12345" },
      { id: 2, uc: "12345" }
    ];

    buscarSimulacoesPorUc.mockResolvedValue(simulacoes);

    const resposta = await request(app).get("/simulacoes/uc/12345");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(simulacoes);
  });
});
  it("deve retornar uma lista vazia quando não houver simulações para a UC", async () => {
    const { buscarSimulacoesPorUc } =
      require("../services/simulacoes/simulacoes.service");

    buscarSimulacoesPorUc.mockResolvedValue([]);

    const resposta = await request(app).get("/simulacoes/uc/99999");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });
});

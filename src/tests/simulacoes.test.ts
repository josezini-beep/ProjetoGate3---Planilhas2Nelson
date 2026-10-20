import request from "supertest";
import app from "../app";
import { listarSimulacoes } from "../services/simulacoes/simulacoes.service";

jest.mock("../services/simulacoes/simulacoes.service", () => ({
  criarSimulacaoService: jest.fn(),
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

import request from "supertest";
import app from "../app";


describe("POST /simulacoes", () => {
  it("deve retornar 400 quando os dados forem inválidos", async () => {
    const resposta = await request(app)
      .post("/simulacoes")
      .send({ kwh: -5 });

    expect(resposta.status).toBe(400);
  });
});

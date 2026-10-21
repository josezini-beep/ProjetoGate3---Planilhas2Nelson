import app from "./app";
import pool from "./db/db";

async function iniciar() {
  try {
    await pool.query("SELECT 1");
    console.log("Conectado ao PostgreSQL!");

    app.listen(3000, () => {
      console.log("Servidor rodando na porta 3000");
    });
  } catch (erro) {
    console.error("Erro ao iniciar:", erro);
    await pool.end();
    process.exitCode = 1;
  }
}

iniciar();
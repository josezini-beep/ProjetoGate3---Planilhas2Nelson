
import pool from "../../db";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type DetalheImportacao = {
  arquivo: string;
  linha: number;
  dados: string[];
  motivo?: string;
};

export type ResultadoImportacao = {
  id: string;
  status: "processando" | "concluida" | "interrompida";
  expiraEm: number;
  totais: {
    inseridos: number;
    duplicados: number;
    invalidos: number;
  };
  detalhes: {
    inseridos: DetalheImportacao[];
    duplicados: DetalheImportacao[];
    invalidos: DetalheImportacao[];
  };
};

const importacoes = new Map<string, ResultadoImportacao>();

const TEMPO_EXPIRACAO = 30 * 60 * 1000;
const LIMITE_DETALHES = 100;
const LIMITE_IMPORTACOES = 20;

function limparExpiradas(): void {
  for (const [id, resultado] of importacoes) {
    if (
      resultado.status !== "processando" &&
      resultado.expiraEm <= Date.now()
    ) {
      importacoes.delete(id);
    }
  }
}

setInterval(limparExpiradas, 60 * 1000).unref();

export async function importarClientes() {
  limparExpiradas();

  if (importacoes.size >= LIMITE_IMPORTACOES) {
    const erro = new Error(
      "Limite de importações em memória atingido. Aguarde a expiração."
    );
    Object.assign(erro, { status: 429 });
    throw erro;
  }

  const importacaoId = randomUUID();

  const registro: ResultadoImportacao = {
    id: importacaoId,
    status: "processando",
    expiraEm: 0,
    totais: {
      inseridos: 0,
      duplicados: 0,
      invalidos: 0
    },
    detalhes: {
      inseridos: [],
      duplicados: [],
      invalidos: []
    }
  };

  importacoes.set(importacaoId, registro);

  let inseridos = 0;
  let duplicados = 0;
  let invalidos = 0;

  try {
    for (let i = 1; i <= 10; i++) {
      const caminho = path.join(
        __dirname,
        "../../../dados",
        `pessoas_${i}.csv`
      );

      const conteudo = fs.readFileSync(caminho, "utf8");
      const linhas = conteudo.split(/\r?\n/);

      linhas.shift();

      for (const [indice, linha] of linhas.entries()) {
        if (linha.trim() === "") continue;

        const dados = linha.split(",");

        const detalhe: DetalheImportacao = {
          arquivo: `pessoas_${i}.csv`,
          linha: indice + 2,
          dados
        };

        if (dados.length !== 6) {
          invalidos++;

          if (registro.detalhes.invalidos.length < LIMITE_DETALHES) {
            registro.detalhes.invalidos.push({
              ...detalhe,
              motivo: "Quantidade de campos diferente de seis."
            });
          }

          continue;
        }

        const pessoa = {
          nome: dados[0].trim(),
          email: dados[1].trim(),
          cidade: dados[2].trim(),
          profissao: dados[3].trim(),
          idade: dados[4].trim(),
          cpf: dados[5].trim()
        };

        const idade = pessoa.idade === ""
          ? null
          : Number(pessoa.idade);

        const cpfInvalido = !/^\d{11}$/.test(pessoa.cpf);

        const idadeInvalida = idade !== null && (
          !Number.isInteger(idade) ||
          idade < 0 ||
          idade > 2147483647
        );

        if (cpfInvalido || idadeInvalida) {
          invalidos++;

          if (registro.detalhes.invalidos.length < LIMITE_DETALHES) {
            const motivos: string[] = [];

            if (cpfInvalido) {
              motivos.push("CPF deve conter exatamente 11 números.");
            }

            if (idadeInvalida) {
              motivos.push(
                "Idade deve ser um inteiro entre 0 e 2147483647."
              );
            }

            registro.detalhes.invalidos.push({
              ...detalhe,
              motivo: motivos.join(" ")
            });
          }

          continue;
        }

        const resultado = await pool.query(
          `INSERT INTO clientes (
            nome, email, cidade, profissao,
            idade, documento, tipo_pessoa
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (documento) DO NOTHING`,
          [
            pessoa.nome || null,
            pessoa.email || null,
            pessoa.cidade || null,
            pessoa.profissao || null,
            idade,
            pessoa.cpf,
            "PF"
          ]
        );

        if (resultado.rowCount === 1) {
          inseridos++;

          if (registro.detalhes.inseridos.length < LIMITE_DETALHES) {
            registro.detalhes.inseridos.push(detalhe);
          }
        } else {
          duplicados++;

          if (registro.detalhes.duplicados.length < LIMITE_DETALHES) {
            registro.detalhes.duplicados.push({
              ...detalhe,
              motivo: "Documento já cadastrado."
            });
          }
        }
      }
    }

    registro.status = "concluida";

    return {
      mensagem: "Importação concluída.",
      importacao_id: importacaoId,
      inseridos,
      duplicados,
      invalidos
    };
  } catch (erro) {
    registro.status = "interrompida";

    // Preserva o comportamento anterior: informa os totais
    // parciais e mantém os registros já inseridos no banco.
    throw Object.assign(
      new Error("Importação interrompida."),
      {
        status: 500,
        importacaoId,
        inseridos,
        duplicados,
        invalidos,
        cause: erro
      }
    );
  } finally {
    registro.totais = { inseridos, duplicados, invalidos };
    registro.expiraEm = Date.now() + TEMPO_EXPIRACAO;
  }
}

export function consultarImportacao(id: string) {
  limparExpiradas();

  const registro = importacoes.get(id);

  if (!registro) {
    const erro = new Error(
      "Importação não encontrada ou resultado já removido."
    );
    Object.assign(erro, { status: 404 });
    throw erro;
  }

  return {
    ...registro,
    limite_detalhes_por_categoria: LIMITE_DETALHES
  };
}

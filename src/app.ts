import express from "express";
import pool from "./db";
import Decimal from "decimal.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const app = express();

app.use(express.json());

type DetalheImportacao = {
  arquivo: string;
  linha: number;
  dados: string[];
  motivo?: string;
};

type ResultadoImportacao = {
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

// Remove resultados expirados a cada minuto.
setInterval(() => {
  for (const [id, resultado] of importacoes) {
    if (
      resultado.status !== "processando" &&
      resultado.expiraEm <= Date.now()
    ) {
      importacoes.delete(id);
    }
  }
}, 60 * 1000).unref();

// Lista todas as simulações.
app.get("/simulacoes", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM simulacoes WHERE apagado = FALSE ORDER BY id",
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao listar simulações." });
  }
});

app.post("/clientes/importar", async (req, res) => {
  // Limpa os resultados expirados antes de conferir o limite.
  for (const [id, resultado] of importacoes) {
    if (
      resultado.status !== "processando" &&
      resultado.expiraEm <= Date.now()
    ) {
      importacoes.delete(id);
    }
  }

  if (importacoes.size >= LIMITE_IMPORTACOES) {
    res.status(429).json({
      erro: "Limite de importações em memória atingido. Aguarde a expiração."
    });
    return;
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
        "..",
        "dados",
        `pessoas_${i}.csv`
      );

      const conteudo = fs.readFileSync(caminho, "utf8");
      const linhas = conteudo.split(/\r?\n/);

      // Remove o cabeçalho.
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
              motivos.push("Idade deve ser um inteiro entre 0 e 2147483647.");
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

    res.status(200).json({
      mensagem: "Importação concluída.",
      importacao_id: importacaoId,
      inseridos,
      duplicados,
      invalidos
    });
  } catch (erro) {
    console.error(erro);
    registro.status = "interrompida";

    res.status(500).json({
      erro: "Importação interrompida.",
      mensagem: "Os registros já inseridos permanecem no banco.",
      importacao_id: importacaoId,
      inseridos,
      duplicados,
      invalidos
    });
  } finally {
    registro.totais = { inseridos, duplicados, invalidos };
    registro.expiraEm = Date.now() + TEMPO_EXPIRACAO;
  }
});

// Cadastra uma simulação.
app.post("/simulacoes", async (req, res) => {
  const {
    uc,
    concessionaria,
    encargos,
    impostos,
    kwh,
    valor_kwh,
    desconto_percentual
  } = req.body ?? {};

  const valores = [
    encargos,
    impostos,
    kwh,
    valor_kwh,
    desconto_percentual
  ];

  if (
    typeof uc !== "string" ||
    uc.trim().length === 0 ||
    uc.length > 30 ||
    typeof concessionaria !== "string" ||
    concessionaria.trim().length === 0 ||
    !valores.every(
      (valor) => typeof valor === "number" && Number.isFinite(valor)
    ) ||
    encargos < 0 ||
    impostos < 0 ||
    kwh <= 0 ||
    valor_kwh <= 0 ||
    desconto_percentual < 0 ||
    desconto_percentual > 100
  ) {
    res.status(400).json({ erro: "Dados inválidos." });
    return;
  }

  // Confere os limites e as casas decimais das colunas.
  const limites = [
    { valor: encargos, casas: 2, maximo: "9999999999.99" },
    { valor: impostos, casas: 2, maximo: "9999999999.99" },
    { valor: kwh, casas: 3, maximo: "999999999.999" },
    { valor: valor_kwh, casas: 6, maximo: "999999.999999" },
    { valor: desconto_percentual, casas: 2, maximo: "100" }
  ];

  if (
    limites.some(({ valor, casas, maximo }) => {
      const decimal = new Decimal(valor);
      return decimal.decimalPlaces() > casas || decimal.gt(maximo);
    })
  ) {
    res.status(400).json({
      erro: "Valor acima do limite ou com casas decimais demais."
    });
    return;
  }

  try {
    // Desconto apenas sobre a energia.
    const valorEnergia = new Decimal(kwh).times(valor_kwh);

    const economiaMensal = valorEnergia
      .times(desconto_percentual)
      .dividedBy(100)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);


    // Projeção com a mesma economia nos 12 meses.
    const economiaAnual = economiaMensal.times(12);

if (economiaAnual.gt("9999999999.99")) {
  res.status(400).json({
    erro: "Economia acima do limite permitido."
  });
  return;
}
const resultado = await pool.query(
  `INSERT INTO simulacoes (
    uc, concessionaria, encargos, impostos, kwh, valor_kwh,
    desconto_percentual, economia_mensal, economia_anual
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)

  ON CONFLICT (
    TRIM(uc),
    LOWER(TRIM(concessionaria))
  )
  DO UPDATE SET
    encargos = EXCLUDED.encargos,
    impostos = EXCLUDED.impostos,
    kwh = EXCLUDED.kwh,
    valor_kwh = EXCLUDED.valor_kwh,
    desconto_percentual = EXCLUDED.desconto_percentual,
    economia_mensal = EXCLUDED.economia_mensal,
    economia_anual = EXCLUDED.economia_anual
    WHERE simulacoes.apagado = FALSE
    RETURNING *`,
  [
    uc.trim(),
    concessionaria.trim(),
    encargos,
    impostos,
    kwh,
    valor_kwh,
    desconto_percentual,
    economiaMensal.toFixed(2),
    economiaAnual.toFixed(2)
  ]
);
  if (resultado.rows.length === 0) {
  res.status(409).json({
    erro: "Existe uma simulação apagada para essa UC e concessionária. Restaure-a antes de atualizar."
  });
  return;
}
    res.status(200).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao cadastrar simulação." });
  }
});

// Busca pelo ID.
app.get("/simulacoes/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    res.status(400).json({ erro: "ID inválido." });
    return;
  }

  try {
    const resultado = await pool.query(
      "SELECT * FROM simulacoes WHERE id = $1 AND apagado = FALSE",
      [id]
    );

    if (resultado.rows.length === 0) {
      res.status(404).json({ erro: "Simulação não encontrada." });
      return;
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar simulação." });
  }
});

// Lista as simulações de uma UC.
app.get("/simulacoes/uc/:uc", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM simulacoes WHERE uc = $1 AND apagado = FALSE ORDER BY id",
      [req.params.uc]
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar por UC." });
  }
});

// Lista as simulações de um CPF.
app.get("/simulacoes/cpf/:cpf", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM simulacoes WHERE cpf = $1 AND apagado = FALSE ORDER BY id",
      [req.params.cpf]
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar por CPF." });
  }
});
app.get("/clientes/importacoes/:id", (req, res) => {
  const registro = importacoes.get(req.params.id);

  if (!registro) {
    res.status(404).json({
      erro: "Importação não encontrada ou resultado já removido."
    });
    return;
  }

  if (
    registro.status !== "processando" &&
    registro.expiraEm <= Date.now()
  ) {
    importacoes.delete(registro.id);

    res.status(404).json({
      erro: "Resultado da importação expirado."
    });
    return;
  }

  res.json({
    ...registro,
    limite_detalhes_por_categoria: LIMITE_DETALHES
  });
});

// Edita uma simulação pelo ID.
app.put("/simulacoes/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    res.status(400).json({ erro: "ID inválido." });
    return;
  }

  const {
    uc,
    concessionaria,
    encargos,
    impostos,
    kwh,
    valor_kwh,
    desconto_percentual
  } = req.body ?? {};

  const valores = [
    encargos,
    impostos,
    kwh,
    valor_kwh,
    desconto_percentual
  ];

  if (
    typeof uc !== "string" ||
    uc.trim().length === 0 ||
    uc.length > 30 ||
    typeof concessionaria !== "string" ||
    concessionaria.trim().length === 0 ||
    !valores.every(
      (valor) => typeof valor === "number" && Number.isFinite(valor)
    ) ||
    encargos < 0 ||
    impostos < 0 ||
    kwh <= 0 ||
    valor_kwh <= 0 ||
    desconto_percentual < 0 ||
    desconto_percentual > 100
  ) {
    res.status(400).json({ erro: "Dados inválidos." });
    return;
  }

  const limites = [
    { valor: encargos, casas: 2, maximo: "9999999999.99" },
    { valor: impostos, casas: 2, maximo: "9999999999.99" },
    { valor: kwh, casas: 3, maximo: "999999999.999" },
    { valor: valor_kwh, casas: 6, maximo: "999999.999999" },
    { valor: desconto_percentual, casas: 2, maximo: "100" }
  ];

  if (
    limites.some(({ valor, casas, maximo }) => {
      const decimal = new Decimal(valor);

      return decimal.decimalPlaces() > casas || decimal.gt(maximo);
    })
  ) {
    res.status(400).json({
      erro: "Valor acima do limite ou com casas decimais demais."
    });
    return;
  }

  try {
    const valorEnergia = new Decimal(kwh).times(valor_kwh);

    const economiaMensal = valorEnergia
      .times(desconto_percentual)
      .dividedBy(100)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const economiaAnual = economiaMensal.times(12);

    if (economiaAnual.gt("9999999999.99")) {
      res.status(400).json({
        erro: "Economia acima do limite permitido."
      });
      return;
    }

    const resultado = await pool.query(
      `UPDATE simulacoes
       SET
         uc = $1,
         concessionaria = $2,
         encargos = $3,
         impostos = $4,
         kwh = $5,
         valor_kwh = $6,
         desconto_percentual = $7,
         economia_mensal = $8,
         economia_anual = $9
       WHERE id = $10 AND apagado = FALSE
       RETURNING *`,
      [
        uc.trim(),
        concessionaria.trim(),
        encargos,
        impostos,
        kwh,
        valor_kwh,
        desconto_percentual,
        economiaMensal.toFixed(2),
        economiaAnual.toFixed(2),
        id
      ]
    );

    if (resultado.rows.length === 0) {
      res.status(404).json({
        erro: "Simulação não encontrada."
      });
      return;
    }

    res.status(200).json(resultado.rows[0]);
  } catch (erro) {
    if (
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro &&
      erro.code === "23505"
    ) {
      res.status(409).json({
        erro: "Já existe outra simulação para essa UC e concessionária."
      });
      return;
    }

    console.error(erro);

    res.status(500).json({
      erro: "Erro ao editar simulação."
    });
  }
});

app.delete("/simulacoes/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    res.status(400).json({ erro: "ID inválido." });
    return;
  }

  try {
    const resultado = await pool.query(
      `UPDATE simulacoes
       SET apagado = TRUE
       WHERE id = $1 AND apagado = FALSE
       RETURNING id`,
      [id]
    );

    if (resultado.rows.length === 0) {
      res.status(404).json({
        erro: "Simulação não encontrada ou já apagada."
      });
      return;
    }

    res.status(200).json({
      mensagem: "Simulação marcada como apagada.",
      id: resultado.rows[0].id
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Erro ao apagar simulação."
    });
  }
});

export default app;
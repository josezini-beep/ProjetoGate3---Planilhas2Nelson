import pool from "../../db";
import Decimal from "decimal.js";
import ErroHttp from "../../errors/erro-http";


type DadosSimulacao = {
  uc: string;
  concessionaria: string;
  encargos: number;
  impostos: number;
  kwh: number;
  valor_kwh: number;
  desconto_percentual: number;
};

export const criarSimulacaoService = {
  create: async (dados: DadosSimulacao) => {
    
    const {
      uc,
      concessionaria,
      encargos,
      impostos,
      kwh,
      valor_kwh,
      desconto_percentual
    } = dados ?? {};

    //Validações iniciais Limites e entradas
    validacoesDadosEntradaSimulacoes(dados) 

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
        throw new ErroHttp("Economia acima do limite permitido.", 400);
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
        throw new ErroHttp("Existe uma simulação apagada para essa UC e concessionária. Restaure-a antes de atualizar.", 400);
      }
      return resultado.rows[0];
    } catch (erro) {
      console.error(erro);
      throw erro;
    }
  }
};

function validacoesDadosEntradaSimulacoes(dados: DadosSimulacao){

  const {
    uc,
    concessionaria,
    encargos,
    impostos,
    kwh,
    valor_kwh,
    desconto_percentual
  } = dados ?? {};
  const valores = [
    encargos,
    impostos,
    kwh,
    valor_kwh,
    desconto_percentual
  ];

  if (typeof uc !== "string") {
    throw new ErroHttp("UC não é um texto", 400);
  }
  if (uc.trim().length === 0) {
    throw new ErroHttp("UC não pode estar vazia!", 400);
  }
  if (uc.length > 30) {
    throw new ErroHttp("UC Inválida", 400);
  }
  if (typeof concessionaria !== "string") {
    throw new ErroHttp("Concessionária  Inválida", 400);
  }
  if (concessionaria.trim().length === 0) {
    throw new ErroHttp("Concessionária  não pode estar vazia", 400);
  }
  if (!valores.every((valor) => typeof valor === "number" && Number.isFinite(valor))) {
    throw new ErroHttp("Dados quantitativos incorretos", 400);
  }
  if (
    encargos < 0 ||
    impostos < 0 ||
    kwh <= 0 ||
    valor_kwh <= 0 ||
    desconto_percentual < 0 
  ) {
    throw new ErroHttp("Dados quantitativos não podem ser negativos", 400);
  }
  if (desconto_percentual > 100) {
    throw new ErroHttp("Desconto não pode ser maior que 100%", 400);
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
    throw new ErroHttp
    (
      "Valor acima do limite ou com casas decimais demais.", 401
    );
  }
}

export async function listarSimulacoes() {
  const resultado = await pool.query(
    "SELECT * FROM simulacoes WHERE apagado = FALSE ORDER BY id"
  );

  return resultado.rows;
}

export async function buscarSimulacaoPorId(id: number) {
  const resultado = await pool.query(
    "SELECT * FROM simulacoes WHERE id = $1 AND apagado = FALSE",
    [id]
  );

  return resultado.rows[0] ?? null;
}

export async function buscarSimulacoesPorUc(uc: string) {
  const resultado = await pool.query(
    "SELECT * FROM simulacoes WHERE uc = $1 AND apagado = FALSE ORDER BY id",
    [uc]
  );

  return resultado.rows;
}

export async function editarSimulacao(id: number, dados: any) {
  const {
    uc,
    concessionaria,
    encargos,
    impostos,
    kwh,
    valor_kwh,
    desconto_percentual
  } = dados ?? {};

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
    throw Object.assign(
      new Error("Dados inválidos."),
      { status: 400 }
    );
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
    throw Object.assign(
      new Error("Valor acima do limite ou com casas decimais demais."),
      { status: 400 }
    );
  }

  const valorEnergia = new Decimal(kwh).times(valor_kwh);

  const economiaMensal = valorEnergia
    .times(desconto_percentual)
    .dividedBy(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const economiaAnual = economiaMensal.times(12);

  if (economiaAnual.gt("9999999999.99")) {
    throw Object.assign(
      new Error("Economia acima do limite permitido."),
      { status: 400 }
    );
  }

  let resultado;

  try {
    resultado = await pool.query(
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
  } catch (erro) {
    if (
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro &&
      erro.code === "23505"
    ) {
      throw Object.assign(
        new Error(
          "Já existe outra simulação para essa UC e concessionária."
        ),
        { status: 409 }
      );
    }

    throw Object.assign(
      new Error("Erro ao editar simulação."),
      { status: 500 }
    );
  }

  if (resultado.rows.length === 0) {
    throw Object.assign(
      new Error("Simulação não encontrada."),
      { status: 404 }
    );
  }

  return resultado.rows[0];
}

export async function buscarSimulacoesPorCpf(cpf: string) {
  const resultado = await pool.query(
    "SELECT * FROM simulacoes WHERE cpf = $1 AND apagado = FALSE ORDER BY id",
    [cpf]
  );

  return resultado.rows;
}

export async function excluirSimulacao(id: number) {
  const resultado = await pool.query(
    `UPDATE simulacoes
     SET apagado = TRUE
     WHERE id = $1 AND apagado = FALSE
     RETURNING id`,
    [id]
  );

  if (resultado.rows.length === 0) {
    return null;
  }

  return resultado.rows[0];
}
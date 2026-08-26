import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

const SALT_ROUNDS = 12;

function senhaJaPossuiHash(senha) {
  return /^\$2[aby]\$\d{2}\$/.test(senha);
}

async function prepararSenhas() {
  const usuarios = await prisma.usuario.findMany();

  let convertidos = 0;
  let ignorados = 0;

  for (const usuario of usuarios) {
    if (senhaJaPossuiHash(usuario.Senha)) {
      ignorados++;
      continue;
    }

    const senhaHash = await bcrypt.hash(
      usuario.Senha,
      SALT_ROUNDS
    );

    await prisma.usuario.update({
      where: {
        id: usuario.id,
      },
      data: {
        Senha: senhaHash,
      },
    });

    convertidos++;
  }

  return {
    convertidos,
    ignorados,
  };
}

async function prepararLicencas() {
  const oficinas = await prisma.oficina.findMany();

  let criadas = 0;
  let ativadas = 0;

  for (const oficina of oficinas) {
    const licenca = await prisma.licenca.findUnique({
      where: {
        oficinaId: oficina.id,
      },
    });

    if (!licenca) {
      await prisma.licenca.create({
        data: {
          oficinaId: oficina.id,
          status: "ATIVA",
          valor: 0,
          codigoCompra: `MIGRACAO-OFICINA-${oficina.id}`,
          compradaEm: new Date(),
          ativadaEm: new Date(),
        },
      });

      criadas++;
      continue;
    }

    if (licenca.status !== "ATIVA") {
      await prisma.licenca.update({
        where: {
          id: licenca.id,
        },
        data: {
          status: "ATIVA",
          ativadaEm: licenca.ativadaEm ?? new Date(),
        },
      });

      ativadas++;
    }
  }

  return {
    criadas,
    ativadas,
  };
}

async function main() {
  const senhas = await prepararSenhas();
  const licencas = await prepararLicencas();

  console.log("");
  console.log("Preparação concluída");
  console.log("");
  console.log("Senhas convertidas:", senhas.convertidos);
  console.log("Senhas já protegidas:", senhas.ignorados);
  console.log("Licenças criadas:", licencas.criadas);
  console.log("Licenças ativadas:", licencas.ativadas);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
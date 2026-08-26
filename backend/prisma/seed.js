import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function criarSenha(senha) {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

async function main() {
  let oficina = await prisma.oficina.findFirst({
    where: {
      nomeFantasia: "Oficina MotorMind",
    },
  });

  if (!oficina) {
    oficina = await prisma.oficina.create({
      data: {
        nomeFantasia: "Oficina MotorMind",
        razaoSocial: "Oficina MotorMind LTDA",
        email: "contato@oficinamotormind.com",
        telefone: "11999999999",
        whatsapp: "11999999999",
        cidade: "São Paulo",
        uf: "SP",
        status: "ATIVA",
      },
    });
  }

  await prisma.licenca.upsert({
    where: {
      oficinaId: oficina.id,
    },
    update: {
      status: "ATIVA",
    },
    create: {
      oficinaId: oficina.id,
      status: "ATIVA",
      valor: 499.90,
      codigoCompra: `SEED-${oficina.id}`,
      compradaEm: new Date(),
      ativadaEm: new Date(),
    },
  });

  const usuarios = [
    {
      Nome: "Proprietário MotorMind",
      Email: "owner@motormind.com",
      Senha: "owner123",
      Role: "OWNER",
    },
    {
      Nome: "Administrador MotorMind",
      Email: "admin@motormind.com",
      Senha: "admin123",
      Role: "ADMIN",
    },
    {
      Nome: "Operador MotorMind",
      Email: "operador@motormind.com",
      Senha: "operador123",
      Role: "OPERADOR",
    },
    {
      Nome: "Técnico MotorMind",
      Email: "tecnico@motormind.com",
      Senha: "tecnico123",
      Role: "TECNICO",
    },
  ];

  for (const dados of usuarios) {
    const senhaHash = await criarSenha(dados.Senha);

    const usuario = await prisma.usuario.upsert({
      where: {
        Email: dados.Email,
      },
      update: {
        Nome: dados.Nome,
        Senha: senhaHash,
        Role: dados.Role,
        oficinaId: oficina.id,
      },
      create: {
        Nome: dados.Nome,
        Email: dados.Email,
        Senha: senhaHash,
        Role: dados.Role,
        oficinaId: oficina.id,
      },
    });

    if (dados.Role !== "OWNER") {
      await prisma.funcionario.upsert({
        where: {
          usuarioId: usuario.id,
        },
        update: {
          oficinaId: oficina.id,
        },
        create: {
          usuarioId: usuario.id,
          oficinaId: oficina.id,
          DataAdmissao: new Date(),
        },
      });
    }
  }
  console.log("Usuários criados com sucesso !")
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
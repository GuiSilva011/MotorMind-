import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function criarOuAtualizarUsuario({ Nome, Email, Senha, Role }) {
  await prisma.usuario.upsert({
    where: {
      Email,
    },
    update: {
      Nome,
      Senha,
      Role,
    },
    create: {
      Nome,
      Email,
      Senha,
      Role,
    },
  });
}

async function main() {
  await criarOuAtualizarUsuario({
    Nome: 'Administrador',
    Email: 'admin@motormind.com',
    Senha: 'admin123',
    Role: 'ADMIN',
  });

  await criarOuAtualizarUsuario({
    Nome: 'Operador do Sistema',
    Email: 'operador@motormind.com',
    Senha: 'operador123',
    Role: 'OPERADOR',
  });

  await criarOuAtualizarUsuario({
    Nome: 'Funcionário Técnico',
    Email: 'tecnico@motormind.com',
    Senha: 'tecnico123',
    Role: 'TECNICO',
  });

  console.log('Usuários padrão criados/atualizados com sucesso!');
}

main()
  .catch((error) => {
    console.error('Erro ao criar usuários padrão:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
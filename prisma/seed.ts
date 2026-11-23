import {
  MotivoBaixa,
  PerfilUsuario,
  PrismaClient,
  StatusProduto,
  TipoMovimentacao,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaAdminHash = await bcrypt.hash("Admin@123", 10);
  const senhaOperadorHash = await bcrypt.hash("Operador@123", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@estok.local" },
    update: {
      nome: "Administrador Estok",
      perfil: PerfilUsuario.ADMIN,
      ativo: true,
    },
    create: {
      nome: "Administrador Estok",
      email: "admin@estok.local",
      senhaHash: senhaAdminHash,
      perfil: PerfilUsuario.ADMIN,
      ativo: true,
    },
  });

  const operador = await prisma.usuario.upsert({
    where: { email: "operador@estok.local" },
    update: {
      nome: "Operador Estok",
      perfil: PerfilUsuario.OPERADOR,
      ativo: true,
    },
    create: {
      nome: "Operador Estok",
      email: "operador@estok.local",
      senhaHash: senhaOperadorHash,
      perfil: PerfilUsuario.OPERADOR,
      ativo: true,
    },
  });

  const produtosExemplo = [
    {
      nome: "Teclado Mecânico RGB",
      descricao: "Teclado mecânico ABNT2 com switches blue e iluminação RGB.",
      categoria: "Periféricos",
      sku: "EST-PER-001",
      codigoBarras: "7891000100011",
      quantidadeEstoque: 25,
      estoqueMinimo: 5,
      precoCusto: "145.00",
      precoVenda: "249.90",
      status: StatusProduto.ATIVO,
    },
    {
      nome: "Mouse Sem Fio Ergonômico",
      descricao: "Mouse óptico sem fio 2.4GHz com ajuste de DPI.",
      categoria: "Periféricos",
      sku: "EST-PER-002",
      codigoBarras: "7891000100028",
      quantidadeEstoque: 4,
      estoqueMinimo: 8,
      precoCusto: "68.50",
      precoVenda: "129.90",
      status: StatusProduto.ATIVO,
    },
    {
      nome: 'Monitor LED 24" Full HD',
      descricao: "Monitor IPS 24 polegadas 75Hz com entradas HDMI e DisplayPort.",
      categoria: "Monitores",
      sku: "EST-MON-003",
      codigoBarras: "7891000100035",
      quantidadeEstoque: 12,
      estoqueMinimo: 4,
      precoCusto: "520.00",
      precoVenda: "849.00",
      status: StatusProduto.ATIVO,
    },
    {
      nome: "Cabo HDMI 2.1 2m",
      descricao: "Cabo HDMI alta velocidade com suporte a 4K/120Hz.",
      categoria: "Acessórios",
      sku: "EST-ACE-004",
      codigoBarras: "7891000100042",
      quantidadeEstoque: 3,
      estoqueMinimo: 10,
      precoCusto: "18.00",
      precoVenda: "44.90",
      status: StatusProduto.ATIVO,
    },
    {
      nome: "Headset USB Corporativo",
      descricao: "Headset com microfone com cancelamento de ruído e controle de volume.",
      categoria: "Áudio",
      sku: "EST-AUD-005",
      codigoBarras: "7891000100059",
      quantidadeEstoque: 15,
      estoqueMinimo: 5,
      precoCusto: "89.00",
      precoVenda: "159.00",
      status: StatusProduto.ATIVO,
    },
    {
      nome: "Adaptador VGA para HDMI",
      descricao: "Item descontinuado mantido apenas para preservação do histórico.",
      categoria: "Acessórios",
      sku: "EST-ACE-006",
      codigoBarras: "7891000100066",
      quantidadeEstoque: 0,
      estoqueMinimo: 2,
      precoCusto: "22.00",
      precoVenda: "49.90",
      status: StatusProduto.INATIVO,
    },
  ];

  const produtosCriados = [];
  for (const item of produtosExemplo) {
    const produto = await prisma.produto.upsert({
      where: { sku: item.sku },
      update: {
        nome: item.nome,
        descricao: item.descricao,
        categoria: item.categoria,
        codigoBarras: item.codigoBarras,
        estoqueMinimo: item.estoqueMinimo,
        precoCusto: item.precoCusto,
        precoVenda: item.precoVenda,
        status: item.status,
      },
      create: item,
    });
    produtosCriados.push(produto);
  }

  const totalMovimentacoes = await prisma.movimentacao.count();
  if (totalMovimentacoes === 0 && produtosCriados.length >= 3) {
    const [teclado, mouse, monitor] = produtosCriados;

    await prisma.movimentacao.createMany({
      data: [
        {
          tipo: TipoMovimentacao.ENTRADA,
          quantidade: 30,
          saldoAnterior: 0,
          saldoPosterior: 30,
          observacao: "Carga inicial de estoque",
          produtoId: teclado.id,
          responsavelId: admin.id,
        },
        {
          tipo: TipoMovimentacao.SAIDA,
          quantidade: 5,
          saldoAnterior: 30,
          saldoPosterior: 25,
          observacao: "Atendimento de pedido interno",
          produtoId: teclado.id,
          responsavelId: operador.id,
        },
        {
          tipo: TipoMovimentacao.ENTRADA,
          quantidade: 6,
          saldoAnterior: 0,
          saldoPosterior: 6,
          observacao: "Reposição inicial",
          produtoId: mouse.id,
          responsavelId: admin.id,
        },
        {
          tipo: TipoMovimentacao.BAIXA,
          quantidade: 2,
          saldoAnterior: 6,
          saldoPosterior: 4,
          motivoBaixa: MotivoBaixa.AVARIA,
          observacao: "Unidades danificadas no transporte",
          produtoId: mouse.id,
          responsavelId: operador.id,
        },
        {
          tipo: TipoMovimentacao.ENTRADA,
          quantidade: 12,
          saldoAnterior: 0,
          saldoPosterior: 12,
          observacao: "Recebimento de nota fiscal #1024",
          produtoId: monitor.id,
          responsavelId: admin.id,
        },
      ],
    });
  }

  console.log("Seed concluído com sucesso:", {
    usuarios: [admin.email, operador.email],
    produtos: produtosCriados.length,
  });
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

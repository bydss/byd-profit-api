import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_coEmXR4ZPYz6@ep-spring-pond-accyjsii-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function seedDatabase() {
  try {
    // Criar usuário de teste
    const [user] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES ('Usuário Teste', 'teste@example.com', 'senha123')
      RETURNING *
    `;
    console.log('Usuário criado:', user);

    // Criar produtos de teste
    const products = await sql`
      INSERT INTO products (name, description, price, stock)
      VALUES 
        ('Produto 1', 'Descrição do Produto 1', 99.99, 10),
        ('Produto 2', 'Descrição do Produto 2', 149.99, 5),
        ('Produto 3', 'Descrição do Produto 3', 199.99, 8)
      RETURNING *
    `;
    console.log('Produtos criados:', products);

    // Criar um pedido de teste
    const [order] = await sql`
      INSERT INTO orders (user_id, status, total_amount)
      VALUES (${user.id}, 'pending', 99.99)
      RETURNING *
    `;
    console.log('Pedido criado:', order);

    // Adicionar item ao pedido
    const [orderItem] = await sql`
      INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
      VALUES (${order.id}, ${products[0].id}, 1, ${products[0].price})
      RETURNING *
    `;
    console.log('Item do pedido criado:', orderItem);

    // Criar um pagamento PIX de teste
    const [payment] = await sql`
      INSERT INTO payments (order_id, amount, status, payment_method, pix_key)
      VALUES (${order.id}, 99.99, 'pending', 'pix', 'chave-pix-teste')
      RETURNING *
    `;
    console.log('Pagamento criado:', payment);

    // Criar uma transação PIX de teste
    const [pixTransaction] = await sql`
      INSERT INTO pix_transactions (payment_id, transaction_id, status, pix_key, amount)
      VALUES (${payment.id}, '${Date.now()}', 'pending', 'chave-pix-teste', 99.99)
      RETURNING *
    `;
    console.log('Transação PIX criada:', pixTransaction);

    console.log('Dados de teste inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir dados de teste:', error);
    throw error;
  }
}

// Executar o seed
seedDatabase(); 
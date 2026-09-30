/**
 * Supabase REST API Client for CompFast E-commerce
 */

const SUPABASE_URL = 'https://frrriqikyfofwqgixumg.supabase.co/rest/v1';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_N-qH64Rk-uzkLsR2zVvZ0Q_GSy8F0uL';

const API_KEY = SUPABASE_PUBLISHABLE_KEY;

const headers = {
  'apikey': API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function apiRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Supabase API Error [${response.status}] ${endpoint}:`, errorText);
      throw new Error(`API Error: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error(`Fetch error on ${endpoint}:`, error);
    throw error;
  }
}

export const db = {
  // --- CATEGORIES ---
  async getCategories() {
    return await apiRequest('categories?select=*&order=sort_order.asc,name.asc');
  },
  async createCategory(data) {
    return await apiRequest('categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateCategory(id, data) {
    return await apiRequest(`categories?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  async deleteCategory(id) {
    return await apiRequest(`categories?id=eq.${id}`, {
      method: 'DELETE'
    });
  },

  // --- PRODUCTS ---
  async getProducts() {
    return await apiRequest('products?select=*,category:categories(*),product_images(*)&order=created_at.desc');
  },
  async getProductById(id) {
    const res = await apiRequest(`products?id=eq.${id}&select=*,category:categories(*),product_images(*)`);
    return res && res.length > 0 ? res[0] : null;
  },
  async createProduct(data) {
    return await apiRequest('products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateProduct(id, data) {
    return await apiRequest(`products?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  async deleteProduct(id) {
    await apiRequest(`product_images?product_id=eq.${id}`, { method: 'DELETE' });
    return await apiRequest(`products?id=eq.${id}`, {
      method: 'DELETE'
    });
  },

  // --- PRODUCT IMAGES ---
  async createProductImage(data) {
    const payload = {
      storage_path: data.storage_path || data.url || 'external_url',
      ...data
    };
    return await apiRequest('product_images', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async deleteProductImage(id) {
    return await apiRequest(`product_images?id=eq.${id}`, {
      method: 'DELETE'
    });
  },

  // --- COUPONS ---
  async getCoupons() {
    return await apiRequest('coupons?select=*&order=created_at.desc');
  },
  async getCouponByCode(code) {
    const res = await apiRequest(`coupons?code=ilike.${encodeURIComponent(code.trim())}&select=*`);
    return res && res.length > 0 ? res[0] : null;
  },
  async createCoupon(data) {
    return await apiRequest('coupons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateCoupon(id, data) {
    return await apiRequest(`coupons?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  async deleteCoupon(id) {
    return await apiRequest(`coupons?id=eq.${id}`, {
      method: 'DELETE'
    });
  },

  // --- PROMOTIONS ---
  async getPromotions() {
    return await apiRequest('promotions?select=*,promotion_products(*),promotion_categories(*)&order=created_at.desc');
  },
  async createPromotion(data, productIds = [], categoryIds = []) {
    const created = await apiRequest('promotions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (created && created.length > 0) {
      const promoId = created[0].id;
      if (productIds.length > 0) {
        for (const pid of productIds) {
          await apiRequest('promotion_products', {
            method: 'POST',
            body: JSON.stringify({ promotion_id: promoId, product_id: pid })
          });
        }
      }
      if (categoryIds.length > 0) {
        for (const cid of categoryIds) {
          await apiRequest('promotion_categories', {
            method: 'POST',
            body: JSON.stringify({ promotion_id: promoId, category_id: cid })
          });
        }
      }
    }
    return created;
  },
  async updatePromotion(id, data) {
    return await apiRequest(`promotions?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  async deletePromotion(id) {
    await apiRequest(`promotion_products?promotion_id=eq.${id}`, { method: 'DELETE' });
    await apiRequest(`promotion_categories?promotion_id=eq.${id}`, { method: 'DELETE' });
    return await apiRequest(`promotions?id=eq.${id}`, {
      method: 'DELETE'
    });
  },

  // --- CUSTOMERS ---
  async getCustomers() {
    return await apiRequest('customers?select=*,orders(*)&order=created_at.desc');
  },
  async getCustomerByEmail(email) {
    const res = await apiRequest(`customers?email=eq.${encodeURIComponent(email)}&select=*`);
    return res && res.length > 0 ? res[0] : null;
  },
  async createCustomer(data) {
    const existing = await apiRequest(`customers?email=eq.${encodeURIComponent(data.email)}&select=*`);
    if (existing && existing.length > 0) {
      return existing;
    }
    const payload = { ...data };
    if (!payload.id) {
      delete payload.id;
    }
    return await apiRequest('customers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async updateCustomer(id, data) {
    return await apiRequest(`customers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // --- ORDERS / VENDAS ---
  async getOrders() {
    return await apiRequest('orders?select=*,customer:customers(*),order_items(*)&order=created_at.desc');
  },
  async getOrderById(id) {
    const res = await apiRequest(`orders?id=eq.${id}&select=*,customer:customers(*),order_items(*)`);
    return res && res.length > 0 ? res[0] : null;
  },
  async getOrdersByCustomerId(customerId) {
    return await apiRequest(`orders?customer_id=eq.${customerId}&select=*,order_items(*)&order=created_at.desc`);
  },
  async createOrder(orderData, orderItemsData) {
    const createdOrders = await apiRequest('orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    if (createdOrders && createdOrders.length > 0) {
      const order = createdOrders[0];
      for (const item of orderItemsData) {
        await apiRequest('order_items', {
          method: 'POST',
          body: JSON.stringify({
            ...item,
            order_id: order.id
          })
        });
        if (item.product_id) {
          try {
            const p = await this.getProductById(item.product_id);
            if (p) {
              const newQty = Math.max(0, (p.stock_quantity || 0) - item.quantity);
              await this.updateProduct(item.product_id, { stock_quantity: newQty });
            }
          } catch (e) {
            console.error('Failed to update product stock:', e);
          }
        }
      }
      return order;
    }
    return null;
  },
  async updateOrderStatus(orderId, status) {
    return await apiRequest(`orders?id=eq.${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};

export async function seedDatabaseIfEmpty() {
  try {
    const categories = await db.getCategories();
    if (!categories || categories.length === 0) {
      console.log('Database empty. Inoculando dados iniciais...');

      const catSmartphones = await db.createCategory({
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Celulares e Acessórios',
        icon: 'smartphone',
        sort_order: 1,
        is_active: true
      });
      const catEletronicos = await db.createCategory({
        name: 'Eletrônicos',
        slug: 'eletronicos',
        description: 'Áudio, Vídeo e Periféricos',
        icon: 'headphones',
        sort_order: 2,
        is_active: true
      });
      const catInformatica = await db.createCategory({
        name: 'Informática',
        slug: 'informatica',
        description: 'Notebooks, Teclados e Peças',
        icon: 'laptop_mac',
        sort_order: 3,
        is_active: true
      });
      const catModa = await db.createCategory({
        name: 'Moda',
        slug: 'moda',
        description: 'Roupas e Acessórios de estilo',
        icon: 'checkroom',
        sort_order: 4,
        is_active: true
      });

      const catSmartId = catSmartphones?.[0]?.id;
      const catEletId = catEletronicos?.[0]?.id;
      const catInfoId = catInformatica?.[0]?.id;

      const p1 = await db.createProduct({
        name: 'Fone de Ouvido Sem Fio Bluetooth Pro Bass',
        slug: 'fone-pro-bass',
        description: 'Cancelamento de Ruído Ativo (ANC) híbrido com até 35dB de redução sonora. Drivers de 40mm com assinatura sonora Pro Bass.',
        price: 279.00,
        compare_at_price: 389.90,
        stock_quantity: 48,
        sku: 'AUD-BASS-PRO',
        is_active: true,
        is_featured: true,
        category_id: catEletId
      });
      if (p1?.[0]?.id) {
        await db.createProductImage({
          product_id: p1[0].id,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNqCD9TLXl_xJ5aT41TlbsnPDfVlYn-Esih2xLIPaaGO0LiWxC6iBNRRRAGldZTQXu8BoXAT2zWgSiYnm271jlMMiCA14sMETVFjrGaHS3cNGS7LHm1Rinrs1YQ4ZzaobCzsCLmK-ciGYDIMZmEXgxE0gKHnSZ-YqMEtvvy7oTK1KCEr8-kvqJWEfQzff78XFIazChaTrhWKKqyNhU0Yr69qiN0a8rbkixNmKdTQhBRglXMI9tpEbD',
          is_primary: true,
          sort_order: 0
        });
      }

      const p2 = await db.createProduct({
        name: 'Smartphone Titan Pro 5G 256GB Black',
        slug: 'smartphone-titan-pro-5g',
        description: 'Titanium frame, tela 6.7 AMOLED 120Hz, câmera tripla de 108MP com zoom óptico e bateria de longa duração.',
        price: 3899.90,
        compare_at_price: 4799.00,
        stock_quantity: 14,
        sku: 'TITAN-PRO-5G',
        is_active: true,
        is_featured: true,
        category_id: catSmartId
      });
      if (p2?.[0]?.id) {
        await db.createProductImage({
          product_id: p2[0].id,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBi4ZW9vAw-tsCOOtWOkoEQNeeeNyqUGJ9wg0Feb1tWDKe_E_fKE2aRwDun9iW5zNx-tSCsqAsfb27xdUzFBQv-lRjUi543Y-JKtswPqYqlQKdezMraUJP3_hYYuBuatGnAcMNSxI5cM3PF7WXrmUC6gj2a6zA0iKssov9H2Au4tj-hB8pTYv1SVdRtfRCPpXYNyCV1kunEGU9Wv3RxbIMj7nP52nITFSHOMLtJS6f53lLBo4r2Jscr',
          is_primary: true,
          sort_order: 0
        });
      }

      const p3 = await db.createProduct({
        name: 'Teclado Mecânico Compact RGB Switch Blue',
        slug: 'teclado-mecanico-rgb',
        description: 'Teclado mecânico gamer formato 60%, keycaps double-shot e iluminação RGB customizável.',
        price: 159.00,
        compare_at_price: 220.00,
        stock_quantity: 25,
        sku: 'TEC-RGB-60',
        is_active: true,
        is_featured: false,
        category_id: catInfoId
      });
      if (p3?.[0]?.id) {
        await db.createProductImage({
          product_id: p3[0].id,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZ1UqGjl5Q6dbJ_3LVh9xlqpI5pzu5UEf7fHmrgzP0Ycwn_dnlBuixLGp4zjuTnpMzgxm62h2W9U2NB4pLoMfxYQy1_e1N-32hPUxCYoWTWiEfA3Jp6ITRLL8HqJgIZpwWtd_sEG6yedm0E2_tuheAP_te_fZr2HG4QtFW8tsbQh1wHlRNDmMCzIcLWtqcoVGJk0RSd_APDenIGxkwC1FansGIwGlc6pFcuk4DZTbTyuzGie_NF7Q6',
          is_primary: true,
          sort_order: 0
        });
      }

      const p4 = await db.createProduct({
        name: 'Cabo USB-C Trançado 2m 100W Ultra Resistente',
        slug: 'cabo-usbc-2m-100w',
        description: 'Cabo reforçado em nylon trançado com conector metálico, suporta carregamento rápido até 100W PD.',
        price: 84.00,
        compare_at_price: 110.00,
        stock_quantity: 60,
        sku: 'CAB-USBC-100W',
        is_active: true,
        is_featured: false,
        category_id: catEletId
      });
      if (p4?.[0]?.id) {
        await db.createProductImage({
          product_id: p4[0].id,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuN7XT5Af0nAltvQU-yBBnme3fHh81DC3GRp9DFGMdADpQJPlUGbpJSgPZ_ipNAIhwFjigVeXrJn3GyFj_t4CcNSJYb0V2pBOk6xJnYH7dwk51iXYb3HZGdbAzqUv5yJSadEEEJBkmHqleHujRrVMXhRnGMzGFEX5wRkMWzMxkLYv0RKS1K6JOgFIKhp-eR4kwGJTxn05CXkJprYE_UVYwb_4pFaW70jJO1K_VkppuSJ_gDSohw_II',
          is_primary: true,
          sort_order: 0
        });
      }

      await db.createCoupon({
        code: 'COMPFAST15',
        description: 'Desconto fixo de R$ 15 em compras',
        discount_type: 'fixed_amount',
        discount_value: 15.00,
        min_purchase_amount: 50.00,
        max_uses: 100,
        uses_count: 12,
        is_active: true,
        expires_at: new Date(Date.now() + 30*24*3600*1000).toISOString()
      });

      await db.createCoupon({
        code: 'FLEX20',
        description: '20% OFF em qualquer pedido',
        discount_type: 'percentage',
        discount_value: 20.00,
        min_purchase_amount: 100.00,
        max_uses: 50,
        uses_count: 5,
        is_active: true,
        expires_at: new Date(Date.now() + 15*24*3600*1000).toISOString()
      });

      await db.createPromotion({
        name: 'Ofertas Relâmpago de Eletrônicos',
        description: 'Desconto de 15% em todos os eletrônicos por tempo limitado',
        discount_type: 'percentage',
        discount_value: 15.00,
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7*24*3600*1000).toISOString(),
        is_active: true,
        applies_to: 'categories'
      }, [], [catEletId]);

      const customer = await db.createCustomer({
        full_name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 98765-4321',
        cpf: '123.456.789-00',
        addresses: 'Av. Paulista, 1000 - São Paulo, SP - CEP 01310-100'
      });

      if (customer?.[0]?.id) {
        await db.createOrder({
          customer_id: customer[0].id,
          order_number: 'CF-9821',
          status: 'paid',
          subtotal: 279.00,
          discount_amount: 15.00,
          shipping_amount: 9.90,
          total: 273.90,
          coupon_code: 'COMPFAST15',
          shipping_address: 'Av. Paulista, 1000 - São Paulo, SP - CEP 01310-100',
          notes: 'Entregar na recepção'
        }, [
          {
            product_id: p1?.[0]?.id || null,
            product_name: 'Fone de Ouvido Sem Fio Bluetooth Pro Bass',
            product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNqCD9TLXl_xJ5aT41TlbsnPDfVlYn-Esih2xLIPaaGO0LiWxC6iBNRRRAGldZTQXu8BoXAT2zWgSiYnm271jlMMiCA14sMETVFjrGaHS3cNGS7LHm1Rinrs1YQ4ZzaobCzsCLmK-ciGYDIMZmEXgxE0gKHnSZ-YqMEtvvy7oTK1KCEr8-kvqJWEfQzff78XFIazChaTrhWKKqyNhU0Yr69qiN0a8rbkixNmKdTQhBRglXMI9tpEbD',
            quantity: 1,
            unit_price: 279.00,
            discount_amount: 15.00,
            total_price: 264.00
          }
        ]);
      }

      console.log('Dados iniciais inoculados com sucesso no Supabase!');
    }
  } catch (err) {
    console.error('Erro ao verificar/inocular dados no Supabase:', err);
  }
}

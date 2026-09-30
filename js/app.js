/**
 * CompFast Main Application Controller
 */

import { db, seedDatabaseIfEmpty } from './supabase.js';

class App {
  constructor() {
    this.currentView = 'lojista-dashboard';
    this.categories = [];
    this.products = [];
    this.coupons = [];
    this.promotions = [];
    this.orders = [];
    this.customers = [];

    this.cart = this.loadCartFromStorage();
    this.appliedCoupon = this.loadCouponFromStorage();
    this.selectedShippingCost = 9.90;
    this.lojistaCategoryFilter = 'all';
    this.clienteCategoryFilter = 'all';

    this.init();
  }

  async init() {
    this.bindEvents();

    // Seed DB if empty
    await seedDatabaseIfEmpty();

    // Fetch initial state from Supabase
    await this.refreshData();

    // Initial view rendering
    this.navigate(this.currentView);
  }

  // --- LOCAL STORAGE HELPERS ---
  loadCartFromStorage() {
    try {
      const saved = localStorage.getItem('compfast_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveCartToStorage() {
    try {
      localStorage.setItem('compfast_cart', JSON.stringify(this.cart));
    } catch (e) {}
    this.updateCartBadges();
  }

  loadCouponFromStorage() {
    try {
      const saved = localStorage.getItem('compfast_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  saveCouponToStorage(coupon) {
    this.appliedCoupon = coupon;
    try {
      if (coupon) {
        localStorage.setItem('compfast_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('compfast_coupon');
      }
    } catch (e) {}
  }

  // --- DATA REFRESH FROM SUPABASE ---
  async refreshData() {
    try {
      const [cats, prods, coups, promos, ords, custs] = await Promise.all([
        db.getCategories(),
        db.getProducts(),
        db.getCoupons(),
        db.getPromotions(),
        db.getOrders(),
        db.getCustomers()
      ]);

      this.categories = cats || [];
      this.products = prods || [];
      this.coupons = coups || [];
      this.promotions = promos || [];
      this.orders = ords || [];
      this.customers = custs || [];

      this.updateCartBadges();
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
      this.showToast('Erro ao carregar dados do Supabase', 'error');
    }
  }

  // --- ROUTING & NAVIGATION ---
  navigate(viewId) {
    this.currentView = viewId;

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
      sec.style.display = 'none';
    });

    const targetSec = document.getElementById(`view-${viewId}`);
    if (targetSec) {
      targetSec.style.display = 'flex';
      setTimeout(() => targetSec.classList.add('active'), 10);
    }

    // Toggle Headers & Bottom Navs based on mode
    const isLojista = viewId.startsWith('lojista');
    document.getElementById('header-lojista').style.display = isLojista ? 'flex' : 'none';
    document.getElementById('header-cliente').style.display = isLojista ? 'none' : 'flex';
    document.getElementById('nav-lojista').style.display = isLojista ? 'block' : 'none';
    document.getElementById('nav-cliente').style.display = isLojista ? 'none' : 'block';

    // Highlight active nav buttons
    if (isLojista) {
      document.querySelectorAll('.lojista-nav-item').forEach(btn => {
        const path = btn.getAttribute('data-path');
        if (path === viewId) {
          btn.className = 'lojista-nav-item flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 text-secondary font-semibold';
        } else {
          btn.className = 'lojista-nav-item flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 text-on-surface-variant hover:text-secondary';
        }
      });
    } else {
      document.querySelectorAll('.cliente-nav-item').forEach(btn => {
        const path = btn.getAttribute('data-path');
        if (path === viewId) {
          btn.className = 'cliente-nav-item flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-secondary font-semibold';
        } else {
          btn.className = 'cliente-nav-item flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-on-surface-variant relative';
        }
      });
    }

    // View-specific renders
    switch (viewId) {
      case 'lojista-dashboard':
        this.renderLojistaDashboard();
        break;
      case 'lojista-produtos':
        this.renderLojistaProducts();
        break;
      case 'lojista-promocoes-cupons':
        this.renderLojistaPromotionsAndCoupons();
        break;
      case 'lojista-vendas':
        this.renderLojistaOrders();
        break;
      case 'lojista-clientes':
        this.renderLojistaCustomers();
        break;
      case 'cliente-vitrine':
        this.renderClienteVitrine();
        break;
      case 'cliente-carrinho':
        this.renderClienteCart();
        break;
      case 'cliente-checkout':
        this.renderClienteCheckout();
        break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- EVENT BINDINGS ---
  bindEvents() {
    // Mode switcher buttons
    document.getElementById('btn-switch-to-cliente').addEventListener('click', () => this.navigate('cliente-vitrine'));
    document.getElementById('btn-switch-to-lojista').addEventListener('click', () => this.navigate('lojista-dashboard'));
    document.getElementById('nav-brand-home').addEventListener('click', () => this.navigate('cliente-vitrine'));
    document.getElementById('btn-header-cart').addEventListener('click', () => this.navigate('cliente-carrinho'));

    // Search listeners
    const lojistaSearch = document.getElementById('lojista-product-search');
    if (lojistaSearch) {
      lojistaSearch.addEventListener('input', (e) => this.filterLojistaProducts(e.target.value));
    }

    const clienteSearch = document.getElementById('cliente-search-input');
    if (clienteSearch) {
      clienteSearch.addEventListener('input', (e) => this.filterClienteProducts(e.target.value));
    }

    // Product Form submit
    const productForm = document.getElementById('product-form');
    if (productForm) {
      productForm.addEventListener('submit', (e) => this.handleProductFormSubmit(e));
    }

    // Image URL preview listener
    const imgUrlInput = document.getElementById('prod-image-url');
    if (imgUrlInput) {
      imgUrlInput.addEventListener('input', (e) => this.previewProductImage(e.target.value));
    }

    const imgFileInput = document.getElementById('prod-image-file');
    if (imgFileInput) {
      imgFileInput.addEventListener('change', (e) => this.handleImageFileSelect(e));
    }

    // Modal Forms
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
      categoryForm.addEventListener('submit', (e) => this.handleCategoryFormSubmit(e));
    }

    const promotionForm = document.getElementById('promotion-form');
    if (promotionForm) {
      promotionForm.addEventListener('submit', (e) => this.handlePromotionFormSubmit(e));
    }

    const couponForm = document.getElementById('coupon-form');
    if (couponForm) {
      couponForm.addEventListener('submit', (e) => this.handleCouponFormSubmit(e));
    }

    // Checkout Form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => this.handleCheckoutSubmit(e));
    }
  }

  // --- TOAST NOTIFICATIONS ---
  showToast(message, type = 'success') {
    const toast = document.getElementById('global-toast');
    const msgEl = document.getElementById('global-toast-msg');
    const iconEl = document.getElementById('global-toast-icon');

    msgEl.textContent = message;
    if (type === 'error') {
      iconEl.textContent = 'error';
      iconEl.className = 'material-symbols-outlined text-[20px] text-error';
    } else {
      iconEl.textContent = 'check_circle';
      iconEl.className = 'material-symbols-outlined text-[20px] text-tertiary-container';
    }

    toast.classList.remove('opacity-0', 'pointer-events-none', 'scale-90');
    toast.classList.add('opacity-100', 'scale-100');

    setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none', 'scale-90');
      toast.classList.remove('opacity-100', 'scale-100');
    }, 2500);
  }


  // ================= LOJISTA DASHBOARD =================
  renderLojistaDashboard() {
    // Calculate total metrics
    const totalRev = this.orders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
    const totalOrders = this.orders.length;
    const avgTicket = totalOrders > 0 ? totalRev / totalOrders : 0;
    const totalCusts = this.customers.length;

    document.getElementById('dash-total-revenue').textContent = this.formatCurrency(totalRev);
    document.getElementById('dash-total-orders').textContent = `${totalOrders} un.`;
    document.getElementById('dash-avg-ticket').textContent = this.formatCurrency(avgTicket);
    document.getElementById('dash-total-customers').textContent = totalCusts;

    // Recent orders container
    const container = document.getElementById('dash-recent-orders-container');
    if (this.orders.length === 0) {
      container.innerHTML = `<div class="bg-surface-container-lowest p-6 rounded-xl text-center text-on-surface-variant font-body-md">Nenhuma venda realizada ainda.</div>`;
      return;
    }

    container.innerHTML = this.orders.slice(0, 5).map(o => `
      <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col space-y-space-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-space-xs">
            <span class="font-label-lg text-label-lg font-bold text-on-surface">#${o.order_number || o.id.substring(0, 8)}</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant">• ${this.formatDate(o.created_at)}</span>
          </div>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold bg-tertiary-container text-on-tertiary-container">
            <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span> ${o.status || 'Aprovado'}
          </span>
        </div>
        <div class="flex items-center justify-between py-1">
          <div class="flex flex-col">
            <span class="font-label-md text-label-md text-on-surface font-semibold">${o.customer?.full_name || 'Cliente'}</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant">${o.order_items?.length || 1} item(s)</span>
          </div>
          <span class="font-label-lg text-label-lg font-bold text-on-surface">${this.formatCurrency(o.total)}</span>
        </div>
      </div>
    `).join('');
  }


  // ================= LOJISTA PRODUTOS & CATEGORIAS =================
  renderLojistaProducts() {
    document.getElementById('lojista-product-count').textContent = `${this.products.length} produtos`;

    // Render category pills
    const pillsContainer = document.getElementById('lojista-categories-pills');
    let pillsHtml = `
      <button onclick="app.filterLojistaCategory('all')" class="cat-pill px-3.5 py-1.5 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all shadow-sm ${this.lojistaCategoryFilter === 'all' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-lowest text-on-surface'}">
        <span>Todas</span>
        <span class="px-1.5 py-0.2 rounded-full font-label-sm text-label-sm bg-on-secondary/20">${this.products.length}</span>
      </button>
    `;

    this.categories.forEach(cat => {
      const count = this.products.filter(p => p.category_id === cat.id).length;
      pillsHtml += `
        <button onclick="app.filterLojistaCategory('${cat.id}')" class="cat-pill px-3.5 py-1.5 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all shadow-sm ${this.lojistaCategoryFilter === cat.id ? 'bg-secondary text-on-secondary' : 'bg-surface-container-lowest text-on-surface'}">
          <span>${cat.name}</span>
          <span class="px-1.5 py-0.2 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant">${count}</span>
        </button>
      `;
    });

    pillsContainer.innerHTML = pillsHtml;

    // Render product cards
    this.filterLojistaProducts(document.getElementById('lojista-product-search')?.value || '');
  }

  filterLojistaCategory(catId) {
    this.lojistaCategoryFilter = catId;
    this.renderLojistaProducts();
  }

  filterLojistaProducts(query) {
    const q = query.toLowerCase().trim();
    const filtered = this.products.filter(p => {
      const matchCat = this.lojistaCategoryFilter === 'all' || p.category_id === this.lojistaCategoryFilter;
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
    this.renderLojistaProductList(filtered);
  }

  renderLojistaProductList(productList) {
    const container = document.getElementById('lojista-products-list');
    if (!productList || productList.length === 0) {
      container.innerHTML = `<div class="bg-surface-container-lowest p-8 rounded-xl text-center text-on-surface-variant font-body-md">Nenhum produto encontrado.</div>`;
      return;
    }

    container.innerHTML = productList.map(p => {
      const primaryImg = p.product_images && p.product_images.length > 0 ? p.product_images[0].url : 'https://placehold.co/300x300?text=Sem+Foto';
      const catName = p.category ? p.category.name : 'Geral';
      const isLowStock = p.stock_quantity <= 5;

      return `
        <div class="product-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm relative transition-all ${!p.is_active ? 'opacity-70' : ''}">
          <div class="flex items-start gap-space-sm">
            <div class="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-container">
              <img src="${primaryImg}" class="w-full h-full object-cover" alt="${p.name}"/>
            </div>
            <div class="flex flex-col flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <span class="font-label-sm text-label-sm text-on-surface-variant truncate">${catName}</span>
                <span class="px-2 py-0.5 rounded-full ${isLowStock ? 'bg-error-container text-error font-bold animate-pulse' : 'bg-tertiary-container/30 text-on-tertiary-container'} font-label-sm text-label-sm font-semibold">
                  ${p.stock_quantity} un
                </span>
              </div>
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold truncate mt-0.5">${p.name}</h3>
              <span class="font-body-sm text-body-sm text-on-surface-variant font-mono">SKU: ${p.sku || 'N/A'}</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-headline-sm text-headline-sm text-on-surface font-bold">${this.formatCurrency(p.price)}</span>
                ${p.compare_at_price ? `<span class="font-body-sm text-body-sm text-on-surface-variant line-through">${this.formatCurrency(p.compare_at_price)}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="pt-space-xs flex items-center justify-between gap-2 bg-surface-container-low/60 -mx-space-md -mb-space-md px-space-md py-2 rounded-b-xl">
            <div class="flex items-center gap-2">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" ${p.is_active ? 'checked' : ''} onchange="app.toggleProductActive('${p.id}', this.checked)" class="sr-only peer"/>
                <div class="w-9 h-5 bg-surface-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
              </label>
              <span class="font-label-sm text-label-sm font-medium ${p.is_active ? 'text-on-surface' : 'text-on-surface-variant'}">${p.is_active ? 'Ativo na Loja' : 'Inativo na Loja'}</span>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="app.editProduct('${p.id}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-secondary hover:bg-surface-container" title="Editar">
                <span class="material-symbols-outlined text-[19px]">edit</span>
              </button>
              <button onclick="app.deleteProduct('${p.id}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container" title="Excluir">
                <span class="material-symbols-outlined text-[19px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Toggle active product status
  async toggleProductActive(id, isActive) {
    try {
      await db.updateProduct(id, { is_active: isActive });
      const p = this.products.find(x => x.id === id);
      if (p) p.is_active = isActive;
      this.showToast(`Status do produto atualizado!`);
    } catch (e) {
      this.showToast('Erro ao atualizar status do produto', 'error');
    }
  }

  // Open product form (new)
  openProductForm() {
    document.getElementById('product-form-title').textContent = 'Cadastrar Produto';
    document.getElementById('prod-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('prod-image-preview-container').classList.add('hidden');

    // Populate category select
    const catSelect = document.getElementById('prod-category');
    catSelect.innerHTML = this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    this.navigate('lojista-produtos-form');
  }

  // Edit existing product
  editProduct(id) {
    const p = this.products.find(x => x.id === id);
    if (!p) return;

    document.getElementById('product-form-title').textContent = 'Editar Produto';
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-sku').value = p.sku || '';
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-compare-price').value = p.compare_at_price || '';
    document.getElementById('prod-stock').value = p.stock_quantity;
    document.getElementById('prod-active').checked = p.is_active;
    document.getElementById('prod-desc').value = p.description || '';

    // Categories dropdown
    const catSelect = document.getElementById('prod-category');
    catSelect.innerHTML = this.categories.map(c => `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${c.name}</option>`).join('');

    // Image URL preview
    const primaryImg = p.product_images && p.product_images.length > 0 ? p.product_images[0].url : '';
    document.getElementById('prod-image-url').value = primaryImg;
    if (primaryImg) {
      this.previewProductImage(primaryImg);
    } else {
      document.getElementById('prod-image-preview-container').classList.add('hidden');
    }

    this.navigate('lojista-produtos-form');
  }

  previewProductImage(url) {
    const container = document.getElementById('prod-image-preview-container');
    const img = document.getElementById('prod-image-preview');
    if (url && url.trim() !== '') {
      img.src = url;
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  }

  handleImageFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        document.getElementById('prod-image-url').value = dataUrl;
        this.previewProductImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  }

  async handleProductFormSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('btn-save-product');
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Salvando...</span>`;

    try {
      const id = document.getElementById('prod-id').value;
      const name = document.getElementById('prod-name').value.trim();
      const categoryId = document.getElementById('prod-category').value;
      const sku = document.getElementById('prod-sku').value.trim();
      const price = parseFloat(document.getElementById('prod-price').value);
      const comparePrice = document.getElementById('prod-compare-price').value ? parseFloat(document.getElementById('prod-compare-price').value) : null;
      const stock = parseInt(document.getElementById('prod-stock').value, 10);
      const active = document.getElementById('prod-active').checked;
      const desc = document.getElementById('prod-desc').value.trim();
      const imageUrl = document.getElementById('prod-image-url').value.trim();

      const payload = {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category_id: categoryId,
        sku,
        price,
        compare_at_price: comparePrice,
        stock_quantity: stock,
        is_active: active,
        description: desc
      };

      if (id) {
        // Update
        await db.updateProduct(id, payload);
        if (imageUrl) {
          await db.createProductImage({
            product_id: id,
            url: imageUrl,
            is_primary: true
          });
        }
        this.showToast('Produto atualizado com sucesso!');
      } else {
        // Create
        const created = await db.createProduct(payload);
        if (created && created.length > 0 && imageUrl) {
          await db.createProductImage({
            product_id: created[0].id,
            url: imageUrl,
            is_primary: true
          });
        }
        this.showToast('Produto cadastrado com sucesso!');
      }

      await this.refreshData();
      this.navigate('lojista-produtos');
    } catch (err) {
      console.error(err);
      this.showToast('Erro ao salvar produto no Supabase', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">cloud_upload</span><span>Salvar no Supabase</span>`;
    }
  }

  async deleteProduct(id) {
    if (confirm('Tem certeza que deseja excluir este produto do banco de dados?')) {
      try {
        await db.deleteProduct(id);
        this.showToast('Produto excluído com sucesso!');
        await this.refreshData();
        this.renderLojistaProducts();
      } catch (err) {
        this.showToast('Erro ao excluir produto', 'error');
      }
    }
  }


  // ================= LOJISTA CATEGORIAS MODAL =================
  openCategoryModal() {
    document.getElementById('modal-category').classList.remove('hidden');
    document.getElementById('modal-category').classList.add('flex');
    document.getElementById('category-form').reset();
  }

  closeCategoryModal() {
    document.getElementById('modal-category').classList.add('hidden');
    document.getElementById('modal-category').classList.remove('flex');
  }

  async handleCategoryFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name').value.trim();
    const icon = document.getElementById('cat-icon').value.trim() || 'grid_view';
    const description = document.getElementById('cat-desc').value.trim();

    try {
      await db.createCategory({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon,
        description,
        is_active: true
      });

      this.showToast('Categoria criada com sucesso!');
      this.closeCategoryModal();
      await this.refreshData();
      this.renderLojistaProducts();
    } catch (err) {
      this.showToast('Erro ao criar categoria', 'error');
    }
  }


  // ================= LOJISTA PROMOÇÕES & CUPONS =================
  switchPromoTab(tab) {
    const promosContent = document.getElementById('promos-tab-content');
    const cuponsContent = document.getElementById('cupons-tab-content');
    const btnPromos = document.getElementById('tab-promos-btn');
    const btnCupons = document.getElementById('tab-cupons-btn');

    if (tab === 'promos') {
      promosContent.classList.remove('hidden');
      cuponsContent.classList.add('hidden');
      btnPromos.className = 'flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 bg-surface-container-lowest text-secondary shadow-sm font-label-lg text-label-lg font-bold';
      btnCupons.className = 'flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg font-bold';
    } else {
      promosContent.classList.add('hidden');
      cuponsContent.classList.remove('hidden');
      btnCupons.className = 'flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 bg-surface-container-lowest text-secondary shadow-sm font-label-lg text-label-lg font-bold';
      btnPromos.className = 'flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg font-bold';
    }
  }

  renderLojistaPromotionsAndCoupons() {
    this.renderPromotionsList();
    this.renderCouponsList();
  }

  renderPromotionsList() {
    const container = document.getElementById('promotions-list-container');
    if (this.promotions.length === 0) {
      container.innerHTML = `<div class="bg-surface-container-lowest p-6 rounded-xl text-center text-on-surface-variant font-body-md">Nenhuma promoção cadastrada.</div>`;
      return;
    }

    container.innerHTML = this.promotions.map(p => {
      const isActive = p.is_active && new Date(p.expires_at) > new Date();
      const targetLabel = p.applies_to === 'categories' ? 'Por Categoria' : (p.applies_to === 'products' ? 'Por Produto' : 'Todos os Produtos');

      return `
        <div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-headline-sm text-headline-sm font-bold text-on-surface">${p.name}</h4>
                <span class="px-2 py-0.5 rounded-full ${isActive ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container text-on-surface-variant'} font-label-sm text-label-sm font-bold">
                  ${isActive ? 'Ativa' : 'Expirada / Inativa'}
                </span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">${p.description || targetLabel}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold">
              ${p.discount_type === 'percentage' ? `-${p.discount_value}%` : `-R$ ${p.discount_value}`}
            </span>
          </div>

          <div class="flex items-center justify-between text-body-sm text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg">
            <span>Expira em: <strong>${this.formatDate(p.expires_at)}</strong></span>
            <button onclick="app.deletePromotion('${p.id}')" class="text-error font-label-sm text-label-sm font-bold hover:underline">Excluir</button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCouponsList() {
    const container = document.getElementById('coupons-list-container');
    if (this.coupons.length === 0) {
      container.innerHTML = `<div class="bg-surface-container-lowest p-6 rounded-xl text-center text-on-surface-variant font-body-md">Nenhum cupom cadastrado.</div>`;
      return;
    }

    container.innerHTML = this.coupons.map(c => `
      <div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-metric-display text-[18px] font-bold text-secondary uppercase">${c.code}</span>
              <span class="px-2 py-0.5 rounded-full ${c.is_active ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container text-on-surface-variant'} font-label-sm text-label-sm font-bold">
                ${c.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">${c.description || ''}</p>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold">
            ${c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `R$ ${c.discount_value} OFF`}
          </span>
        </div>

        <div class="flex items-center justify-between text-body-sm text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg">
          <span>Usos: <strong>${c.uses_count || 0} / ${c.max_uses || '∞'}</strong></span>
          <button onclick="app.deleteCoupon('${c.id}')" class="text-error font-label-sm text-label-sm font-bold hover:underline">Excluir</button>
        </div>
      </div>
    `).join('');
  }

  openPromotionModal() {
    const modal = document.getElementById('modal-promotion');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('promotion-form').reset();

    // Populate selects
    document.getElementById('promo-target-product').innerHTML = this.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('promo-target-category').innerHTML = this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    this.togglePromotionTargetSelects();
  }

  closePromotionModal() {
    const modal = document.getElementById('modal-promotion');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  togglePromotionTargetSelects() {
    const appliesTo = document.getElementById('promo-applies-to').value;
    const prodWrap = document.getElementById('promo-target-product-wrapper');
    const catWrap = document.getElementById('promo-target-category-wrapper');

    if (appliesTo === 'categories') {
      prodWrap.classList.add('hidden');
      catWrap.classList.remove('hidden');
    } else if (appliesTo === 'products') {
      prodWrap.classList.remove('hidden');
      catWrap.classList.add('hidden');
    } else {
      prodWrap.classList.add('hidden');
      catWrap.classList.add('hidden');
    }
  }

  async handlePromotionFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('promo-name').value.trim();
    const discountType = document.getElementById('promo-discount-type').value;
    const discountVal = parseFloat(document.getElementById('promo-discount-value').value);
    const appliesTo = document.getElementById('promo-applies-to').value;
    const productId = document.getElementById('promo-target-product').value;
    const categoryId = document.getElementById('promo-target-category').value;
    const startsAt = document.getElementById('promo-starts-at').value ? new Date(document.getElementById('promo-starts-at').value).toISOString() : new Date().toISOString();
    const expiresAt = new Date(document.getElementById('promo-expires-at').value).toISOString();

    try {
      const promoData = {
        name,
        discount_type: discountType,
        discount_value: discountVal,
        applies_to: appliesTo,
        starts_at: startsAt,
        expires_at: expiresAt,
        is_active: true
      };

      const productIds = appliesTo === 'products' && productId ? [productId] : [];
      const categoryIds = appliesTo === 'categories' && categoryId ? [categoryId] : [];

      await db.createPromotion(promoData, productIds, categoryIds);
      this.showToast('Promoção criada com sucesso!');
      this.closePromotionModal();
      await this.refreshData();
      this.renderLojistaPromotionsAndCoupons();
    } catch (err) {
      this.showToast('Erro ao criar promoção', 'error');
    }
  }

  async deletePromotion(id) {
    if (confirm('Deseja excluir esta promoção?')) {
      try {
        await db.deletePromotion(id);
        this.showToast('Promoção excluída!');
        await this.refreshData();
        this.renderLojistaPromotionsAndCoupons();
      } catch (e) {
        this.showToast('Erro ao excluir promoção', 'error');
      }
    }
  }

  openCouponModal() {
    const modal = document.getElementById('modal-coupon');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('coupon-form').reset();
  }

  closeCouponModal() {
    const modal = document.getElementById('modal-coupon');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async handleCouponFormSubmit(e) {
    e.preventDefault();
    const code = document.getElementById('coupon-code-input').value.trim().toUpperCase();
    const discountType = document.getElementById('coupon-type-input').value;
    const discountVal = parseFloat(document.getElementById('coupon-val-input').value);
    const minAmount = document.getElementById('coupon-min-input').value ? parseFloat(document.getElementById('coupon-min-input').value) : 0;
    const maxUses = document.getElementById('coupon-maxuses-input').value ? parseInt(document.getElementById('coupon-maxuses-input').value, 10) : null;

    try {
      await db.createCoupon({
        code,
        discount_type: discountType,
        discount_value: discountVal,
        min_purchase_amount: minAmount,
        max_uses: maxUses,
        uses_count: 0,
        is_active: true
      });

      this.showToast('Cupom criado com sucesso!');
      this.closeCouponModal();
      await this.refreshData();
      this.renderLojistaPromotionsAndCoupons();
    } catch (err) {
      this.showToast('Erro ao criar cupom', 'error');
    }
  }

  async deleteCoupon(id) {
    if (confirm('Deseja excluir este cupom?')) {
      try {
        await db.deleteCoupon(id);
        this.showToast('Cupom excluído!');
        await this.refreshData();
        this.renderLojistaPromotionsAndCoupons();
      } catch (e) {
        this.showToast('Erro ao excluir cupom', 'error');
      }
    }
  }


  // ================= LOJISTA VENDAS & PEDIDOS =================
  renderLojistaOrders() {
    document.getElementById('orders-total-badge').textContent = `${this.orders.length} Pedidos`;

    const container = document.getElementById('lojista-orders-list');
    if (this.orders.length === 0) {
      container.innerHTML = `<div class="bg-surface-container-lowest p-8 rounded-xl text-center text-on-surface-variant font-body-md">Nenhuma venda registrada.</div>`;
      return;
    }

    container.innerHTML = this.orders.map(o => `
      <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col space-y-space-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-space-xs">
            <span class="font-label-lg text-label-lg font-bold text-on-surface">#${o.order_number || o.id.substring(0, 8)}</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant">• ${this.formatDate(o.created_at)}</span>
          </div>
          <select onchange="app.updateOrderStatus('${o.id}', this.value)" class="px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold bg-tertiary-container text-on-tertiary-container border-none outline-none cursor-pointer">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pendente</option>
            <option value="paid" ${o.status === 'paid' ? 'selected' : ''}>Pago</option>
            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processando</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Enviado</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Entregue</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
          </select>
        </div>

        <div class="flex flex-col gap-1 py-1">
          <span class="font-label-md text-label-md text-on-surface font-semibold">${o.customer?.full_name || 'Cliente'}</span>
          <span class="font-body-sm text-body-sm text-on-surface-variant">${o.customer?.email || ''} - ${o.customer?.phone || ''}</span>
          <span class="font-body-sm text-body-sm text-on-surface-variant">Endereço: ${o.shipping_address || 'Endereço não informado'}</span>
        </div>

        <div class="bg-surface-container-low p-2 rounded-lg flex flex-col gap-1">
          <span class="font-label-sm text-label-sm text-on-surface-variant font-bold">Itens do Pedido:</span>
          ${(o.order_items || []).map(i => `
            <div class="flex justify-between text-body-sm text-on-surface">
              <span>${i.quantity}x ${i.product_name}</span>
              <span>${this.formatCurrency(i.total_price)}</span>
            </div>
          `).join('')}
        </div>

        <div class="flex items-center justify-between pt-1 font-label-lg text-label-lg font-bold text-on-surface">
          <span>Total Pago</span>
          <span class="text-secondary">${this.formatCurrency(o.total)}</span>
        </div>
      </div>
    `).join('');
  }

  async updateOrderStatus(orderId, status) {
    try {
      await db.updateOrderStatus(orderId, status);
      this.showToast('Status do pedido atualizado!');
      await this.refreshData();
    } catch (e) {
      this.showToast('Erro ao atualizar status', 'error');
    }
  }


  // ================= LOJISTA CLIENTES =================
  renderLojistaCustomers() {
    document.getElementById('customers-total-badge').textContent = `${this.customers.length} Clientes`;

    const container = document.getElementById('lojista-customers-list');
    if (this.customers.length === 0) {
      container.innerHTML = `<div class="bg-surface-container-lowest p-8 rounded-xl text-center text-on-surface-variant font-body-md">Nenhum cliente cadastrado.</div>`;
      return;
    }

    container.innerHTML = this.customers.map(c => {
      const customerOrders = this.orders.filter(o => o.customer_id === c.id);
      const totalSpent = customerOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);

      return `
        <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center font-bold">
                ${c.full_name ? c.full_name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div>
                <h4 class="font-headline-sm text-headline-sm font-bold text-on-surface">${c.full_name}</h4>
                <span class="font-body-sm text-body-sm text-on-surface-variant">${c.email} • ${c.phone || 'Sem telefone'}</span>
              </div>
            </div>
            <span class="font-label-lg text-label-lg font-bold text-tertiary">${this.formatCurrency(totalSpent)}</span>
          </div>

          <div class="bg-surface-container-low p-2.5 rounded-lg flex flex-col gap-1 text-body-sm text-on-surface-variant">
            <span><strong>Endereço:</strong> ${c.addresses || 'Não informado'}</span>
            <span><strong>Total de Pedidos:</strong> ${customerOrders.length} compra(s)</span>
          </div>
        </div>
      `;
    }).join('');
  }


  // ================= CLIENTE VITRINE & PRODUTOS =================
  renderClienteVitrine() {
    // Categories Carousel
    const catContainer = document.getElementById('cliente-categories-carousel');
    let catHtml = `
      <button onclick="app.filterClienteCategory('all')" class="flex flex-col items-center gap-1.5 shrink-0 group">
        <div class="w-14 h-14 rounded-full ${this.clienteCategoryFilter === 'all' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-lowest text-primary'} shadow-sm flex items-center justify-center transition-transform">
          <span class="material-symbols-outlined text-[26px]">grid_view</span>
        </div>
        <span class="font-label-sm text-label-sm text-on-surface">Todas</span>
      </button>
    `;

    this.categories.forEach(c => {
      catHtml += `
        <button onclick="app.filterClienteCategory('${c.id}')" class="flex flex-col items-center gap-1.5 shrink-0 group">
          <div class="w-14 h-14 rounded-full ${this.clienteCategoryFilter === c.id ? 'bg-secondary text-on-secondary' : 'bg-surface-container-lowest text-secondary'} shadow-sm flex items-center justify-center transition-transform">
            <span class="material-symbols-outlined text-[26px]">${c.icon || 'smartphone'}</span>
          </div>
          <span class="font-label-sm text-label-sm text-on-surface">${c.name}</span>
        </button>
      `;
    });

    catContainer.innerHTML = catHtml;

    // Active promotions banner
    const activePromos = this.promotions.filter(p => p.is_active && new Date(p.expires_at) > new Date());
    const promoSection = document.getElementById('cliente-flash-promos-section');
    const promoContainer = document.getElementById('cliente-promotions-highlight-container');

    if (activePromos.length > 0) {
      promoSection.classList.remove('hidden');
      promoSection.classList.add('flex');

      promoContainer.innerHTML = activePromos.map(p => `
        <div class="bg-gradient-to-r from-primary-container via-primary-fixed to-primary-container rounded-xl p-3.5 shadow-sm flex items-center justify-between text-on-primary-container">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-on-primary-container text-primary-container flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">bolt</span>
            </div>
            <div class="flex flex-col">
              <span class="font-headline-sm text-headline-sm font-bold">${p.name}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant">${p.description || 'Aproveite enquanto dura!'}</span>
            </div>
          </div>
          <span class="px-3 py-1 bg-on-primary-container text-surface-container-lowest rounded-lg font-label-sm text-label-sm font-bold">
            ${p.discount_type === 'percentage' ? `-${p.discount_value}%` : `-R$ ${p.discount_value}`}
          </span>
        </div>
      `).join('');
    } else {
      promoSection.classList.add('hidden');
      promoSection.classList.remove('flex');
    }

    // Filter products
    this.renderClienteProductGrid(document.getElementById('cliente-search-input')?.value || '');
  }

  filterClienteCategory(catId) {
    this.clienteCategoryFilter = catId;
    this.renderClienteVitrine();
  }

  filterClienteProducts(query) {
    this.renderClienteProductGrid(query);
  }

  renderClienteProductGrid(searchQuery = '') {
    const q = searchQuery.toLowerCase().trim();
    const activeProducts = this.products.filter(p => p.is_active);

    const filtered = activeProducts.filter(p => {
      const matchCat = this.clienteCategoryFilter === 'all' || p.category_id === this.clienteCategoryFilter;
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });

    document.getElementById('cliente-products-count').textContent = `${filtered.length} itens`;
    const container = document.getElementById('cliente-products-grid');

    if (filtered.length === 0) {
      container.innerHTML = `<div class="col-span-full bg-surface-container-lowest p-8 rounded-xl text-center text-on-surface-variant font-body-md">Nenhum produto disponível.</div>`;
      return;
    }

    container.innerHTML = filtered.map(p => {
      const primaryImg = p.product_images && p.product_images.length > 0 ? p.product_images[0].url : 'https://placehold.co/300x300?text=Sem+Foto';
      const promoInfo = this.calculateProductPromotionalPrice(p);

      return `
        <article class="bg-surface-container-lowest rounded-xl p-2.5 shadow-sm flex flex-col justify-between relative group">
          ${promoInfo.hasDiscount ? `<span class="absolute top-2 left-2 bg-error text-on-error font-label-sm text-label-sm font-bold px-1.5 py-0.5 rounded shadow-sm z-10">-${promoInfo.discountTag}</span>` : ''}

          <div class="w-full aspect-square rounded-lg bg-surface-container-low flex items-center justify-center p-2 mb-2 overflow-hidden">
            <img src="${primaryImg}" class="w-full h-full object-cover rounded-md" alt="${p.name}"/>
          </div>

          <div class="flex flex-col flex-1">
            <h5 class="font-body-md text-body-md text-on-surface line-clamp-2 leading-tight font-semibold">${p.name}</h5>

            <div class="mt-2">
              ${promoInfo.hasDiscount ? `<span class="font-body-sm text-body-sm line-through text-outline block">${this.formatCurrency(p.price)}</span>` : ''}
              <span class="font-headline-md text-headline-md font-bold text-on-surface block">${this.formatCurrency(promoInfo.finalPrice)}</span>
            </div>

            <button onclick="app.addToCart('${p.id}')" class="mt-3 w-full h-10 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-label-md font-bold rounded-lg shadow-sm flex items-center justify-center gap-1 transition active:scale-95">
              <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              <span>Comprar</span>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  // Calculate dynamic promotional discount for product
  calculateProductPromotionalPrice(product) {
    let finalPrice = product.price;
    let hasDiscount = false;
    let discountTag = '';

    const now = new Date();
    const activePromos = this.promotions.filter(p => p.is_active && new Date(p.expires_at) > now);

    for (const promo of activePromos) {
      let applies = false;
      if (promo.applies_to === 'products' || promo.applies_to === 'product') {
        applies = promo.promotion_products && promo.promotion_products.some(pp => pp.product_id === product.id);
      } else if (promo.applies_to === 'categories' || promo.applies_to === 'category') {
        applies = promo.promotion_categories && promo.promotion_categories.some(pc => pc.category_id === product.category_id);
      } else if (promo.applies_to === 'all') {
        applies = true;
      }

      if (applies) {
        hasDiscount = true;
        if (promo.discount_type === 'percentage') {
          finalPrice = Math.max(0, product.price * (1 - promo.discount_value / 100));
          discountTag = `${promo.discount_value}%`;
        } else {
          finalPrice = Math.max(0, product.price - promo.discount_value);
          discountTag = `R$ ${promo.discount_value}`;
        }
        break;
      }
    }

    if (!hasDiscount && product.compare_at_price && product.compare_at_price > product.price) {
      hasDiscount = true;
      const percent = Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
      discountTag = `${percent}%`;
    }

    return { finalPrice, hasDiscount, discountTag };
  }


  // ================= CLIENTE CARRINHO DE COMPRAS =================
  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = this.cart.findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += 1;
    } else {
      const promoInfo = this.calculateProductPromotionalPrice(product);
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: promoInfo.finalPrice,
        image: product.product_images && product.product_images.length > 0 ? product.product_images[0].url : '',
        quantity: 1
      });
    }

    this.saveCartToStorage();
    this.showToast(`'${product.name}' adicionado ao carrinho!`);
  }

  updateCartBadges() {
    const totalQty = this.cart.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('cart-badge-count').textContent = totalQty;
    document.getElementById('nav-cart-badge-count').textContent = totalQty;
  }

  renderClienteCart() {
    const container = document.getElementById('cart-items-container');
    if (this.cart.length === 0) {
      container.innerHTML = `<div class="bg-surface-container-lowest p-8 rounded-xl text-center text-on-surface-variant font-body-md">Seu carrinho está vazio.</div>`;
      this.updateCartSummary();
      return;
    }

    container.innerHTML = this.cart.map((item, idx) => `
      <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm relative flex flex-col gap-space-sm">
        <div class="flex items-start gap-space-sm">
          <div class="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-container">
            <img src="${item.image || 'https://placehold.co/100x100?text=Sem+Foto'}" class="w-full h-full object-cover" alt="${item.name}"/>
          </div>
          <div class="flex flex-col flex-1 min-w-0">
            <h2 class="font-headline-sm text-headline-sm text-on-surface line-clamp-2">${item.name}</h2>
            <span class="font-headline-md text-headline-md text-on-surface font-bold mt-1">${this.formatCurrency(item.price)}</span>
          </div>
        </div>

        <div class="pt-space-xs flex items-center justify-between border-t border-surface-container">
          <div class="flex items-center bg-surface-container rounded-lg p-0.5">
            <button onclick="app.updateCartQty(${idx}, -1)" class="w-8 h-8 flex items-center justify-center text-on-surface rounded-md hover:bg-surface-container-lowest active:scale-95 transition-transform">
              <span class="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span class="font-label-md text-label-md text-on-surface px-2 min-w-[24px] text-center">${item.quantity}</span>
            <button onclick="app.updateCartQty(${idx}, 1)" class="w-8 h-8 flex items-center justify-center text-on-surface rounded-md hover:bg-surface-container-lowest active:scale-95 transition-transform">
              <span class="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>

          <button onclick="app.removeCartItem(${idx})" class="font-label-sm text-label-sm text-error hover:underline flex items-center gap-0.5">
            <span class="material-symbols-outlined text-[16px]">delete_outline</span>
            <span>Excluir</span>
          </button>
        </div>
      </div>
    `).join('');

    this.updateCartSummary();
  }

  updateCartQty(index, delta) {
    if (this.cart[index]) {
      this.cart[index].quantity += delta;
      if (this.cart[index].quantity <= 0) {
        this.cart.splice(index, 1);
      }
      this.saveCartToStorage();
      this.renderClienteCart();
    }
  }

  removeCartItem(index) {
    this.cart.splice(index, 1);
    this.saveCartToStorage();
    this.renderClienteCart();
  }

  clearCart() {
    this.cart = [];
    this.saveCartToStorage();
    this.renderClienteCart();
  }

  applyCouponCode() {
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    if (!code) return;

    const coupon = this.coupons.find(c => c.code.toUpperCase() === code && c.is_active);
    if (!coupon) {
      this.showToast('Cupom inválido ou expirado', 'error');
      return;
    }

    const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
      this.showToast(`Valor mínimo para o cupom: ${this.formatCurrency(coupon.min_purchase_amount)}`, 'error');
      return;
    }

    this.saveCouponToStorage(coupon);
    this.showToast(`Cupom ${coupon.code} aplicado com sucesso!`);
    document.getElementById('coupon-input').value = '';
    this.updateCartSummary();
  }

  removeAppliedCoupon() {
    this.saveCouponToStorage(null);
    this.showToast('Cupom removido.');
    this.updateCartSummary();
  }

  updateCartSummary() {
    const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;

    if (this.appliedCoupon) {
      document.getElementById('applied-coupon-block').classList.remove('hidden');
      document.getElementById('applied-coupon-block').classList.add('flex');
      document.getElementById('applied-coupon-code').textContent = this.appliedCoupon.code;

      if (this.appliedCoupon.discount_type === 'percentage') {
        discount = subtotal * (this.appliedCoupon.discount_value / 100);
      } else {
        discount = this.appliedCoupon.discount_value;
      }
      document.getElementById('applied-coupon-desc').textContent = `Economia de ${this.formatCurrency(discount)}`;
      document.getElementById('summary-discount-row').classList.remove('hidden');
      document.getElementById('summary-discount-row').classList.add('flex');
      document.getElementById('summary-discount-val').textContent = `- ${this.formatCurrency(discount)}`;
    } else {
      document.getElementById('applied-coupon-block').classList.add('hidden');
      document.getElementById('applied-coupon-block').classList.remove('flex');
      document.getElementById('summary-discount-row').classList.add('hidden');
      document.getElementById('summary-discount-row').classList.remove('flex');
    }

    // Shipping
    const shippingRadio = document.querySelector('input[name="shipping_option"]:checked');
    this.selectedShippingCost = shippingRadio ? parseFloat(shippingRadio.value) : 9.90;

    const grandTotal = Math.max(0, subtotal - discount + this.selectedShippingCost);

    document.getElementById('summary-subtotal').textContent = this.formatCurrency(subtotal);
    document.getElementById('summary-shipping').textContent = this.selectedShippingCost === 0 ? 'Grátis' : this.formatCurrency(this.selectedShippingCost);
    document.getElementById('summary-total').textContent = this.formatCurrency(grandTotal);
    document.getElementById('floating-cart-total').textContent = this.formatCurrency(grandTotal);

    const proceedBtn = document.getElementById('btn-proceed-checkout');
    if (proceedBtn) {
      proceedBtn.disabled = this.cart.length === 0;
    }
  }

  startCheckout() {
    if (this.cart.length === 0) {
      this.showToast('Seu carrinho está vazio!', 'error');
      return;
    }
    this.navigate('cliente-checkout');
  }


  // ================= CLIENTE CHECKOUT & PEDIDO =================
  renderClienteCheckout() {
    const listContainer = document.getElementById('checkout-order-summary-list');
    const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;

    if (this.appliedCoupon) {
      if (this.appliedCoupon.discount_type === 'percentage') {
        discount = subtotal * (this.appliedCoupon.discount_value / 100);
      } else {
        discount = this.appliedCoupon.discount_value;
      }
    }

    const finalTotal = Math.max(0, subtotal - discount + this.selectedShippingCost);

    listContainer.innerHTML = this.cart.map(item => `
      <div class="flex items-center justify-between py-2 text-body-md text-on-surface">
        <span>${item.quantity}x ${item.name}</span>
        <span class="font-bold">${this.formatCurrency(item.price * item.quantity)}</span>
      </div>
    `).join('') + `
      <div class="flex justify-between text-body-sm text-on-surface-variant pt-2">
        <span>Subtotal</span>
        <span>${this.formatCurrency(subtotal)}</span>
      </div>
      ${discount > 0 ? `
        <div class="flex justify-between text-body-sm text-tertiary">
          <span>Desconto (${this.appliedCoupon.code})</span>
          <span>- ${this.formatCurrency(discount)}</span>
        </div>
      ` : ''}
      <div class="flex justify-between text-body-sm text-on-surface-variant">
        <span>Frete</span>
        <span>${this.selectedShippingCost === 0 ? 'Grátis' : this.formatCurrency(this.selectedShippingCost)}</span>
      </div>
    `;

    document.getElementById('checkout-final-total').textContent = this.formatCurrency(finalTotal);
  }

  async handleCheckoutSubmit(e) {
    e.preventDefault();
    if (this.cart.length === 0) return;

    const btn = document.getElementById('btn-finish-order');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span><span>Processando Pedido...</span>`;

    try {
      const fullName = document.getElementById('cust-full-name').value.trim();
      const email = document.getElementById('cust-email').value.trim();
      const phone = document.getElementById('cust-phone').value.trim();
      const cpf = document.getElementById('cust-cpf').value.trim();
      const address = document.getElementById('cust-address').value.trim();

      // 1. Save / Get Customer
      let customer = await db.getCustomerByEmail(email);
      if (!customer) {
        const createdCusts = await db.createCustomer({
          full_name: fullName,
          email,
          phone,
          cpf,
          addresses: address
        });
        customer = createdCusts ? createdCusts[0] : null;
      }

      // 2. Calculate Totals
      const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      let discount = 0;
      if (this.appliedCoupon) {
        if (this.appliedCoupon.discount_type === 'percentage') {
          discount = subtotal * (this.appliedCoupon.discount_value / 100);
        } else {
          discount = this.appliedCoupon.discount_value;
        }
      }
      const grandTotal = Math.max(0, subtotal - discount + this.selectedShippingCost);

      // 3. Create Order in Supabase
      const orderNumber = `CF-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderData = {
        customer_id: customer ? customer.id : null,
        order_number: orderNumber,
        status: 'paid',
        subtotal,
        discount_amount: discount,
        shipping_amount: this.selectedShippingCost,
        total: grandTotal,
        coupon_code: this.appliedCoupon ? this.appliedCoupon.code : null,
        shipping_address: address
      };

      const orderItemsData = this.cart.map(item => ({
        product_id: item.productId,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        discount_amount: 0,
        total_price: item.price * item.quantity
      }));

      const createdOrder = await db.createOrder(orderData, orderItemsData);

      // Render Order Success
      document.getElementById('order-success-details').innerHTML = `
        <div class="flex justify-between font-body-md text-on-surface">
          <span class="text-on-surface-variant">Número do Pedido:</span>
          <span class="font-bold">#${orderNumber}</span>
        </div>
        <div class="flex justify-between font-body-md text-on-surface">
          <span class="text-on-surface-variant">Cliente:</span>
          <span class="font-bold">${fullName}</span>
        </div>
        <div class="flex justify-between font-body-md text-on-surface">
          <span class="text-on-surface-variant">E-mail:</span>
          <span>${email}</span>
        </div>
        <div class="flex justify-between font-body-md text-on-surface pt-2 border-t border-surface-container">
          <span class="font-bold">Total Pago:</span>
          <span class="font-bold text-tertiary">${this.formatCurrency(grandTotal)}</span>
        </div>
      `;

      // Clear Cart & Refresh
      this.clearCart();
      this.saveCouponToStorage(null);
      await this.refreshData();

      this.navigate('cliente-sucesso');
    } catch (err) {
      console.error('Error on checkout:', err);
      this.showToast('Erro ao finalizar pedido no Supabase', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span><span>Confirmar e Finalizar Pedido</span>`;
    }
  }


  // --- FORMATTERS ---
  formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  }

  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

// Instantiate app and make it globally available
window.app = new App();

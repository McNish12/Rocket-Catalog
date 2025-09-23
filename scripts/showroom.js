/**
 * Bootstraps the Honors showroom preview with in-memory sample data.
 * The script renders the product grid, wires the detail drawer, builds the
 * pricing table & gallery, and exposes a lightweight image lightbox with ESC
 * support.
 */
(function(){
  'use strict';

  const SAMPLE_PRODUCTS = [
    {
      id: 'halo-float',
      name: 'Halo Float Award',
      tagline: 'Illuminated acrylic recognition that floats your message.',
      description: 'The Halo Float pairs an edge-lit base with a floating acrylic panel for a modern presentation. The panel is printed second-surface for depth and arrives individually boxed with power adapter.',
      imprint: 'Full-color UV print • Individually boxed • AC adapter included',
      tags: ['Acrylic', 'LED Base', 'Full Color'],
      hero: 'Assets/images/RKT_HALO_FLOAT.jpg',
      gallery: [
        'Assets/images/RKT_HALO_FLOAT.jpg',
        'Assets/images/Rocket Halo.jpg',
        'Assets/images/RKT_HALO_TOWER.jpg'
      ],
      pricing: [
        { qty: 1, price: 145 },
        { qty: 6, price: 138 },
        { qty: 25, price: 129 }
      ],
      preview3d: 'https://example.com/3d/halo-float',
      template: { label: 'Art Template (AI)', url: 'https://example.com/templates/halo-float.ai' }
    },
    {
      id: 'crystal-tower',
      name: 'Crystal Tower',
      tagline: 'Premium optical crystal with deep-etched faces.',
      description: 'A weighty optical crystal tower that sparkles from every angle. The front face is deep-etched and can be color-filled to match your brand story.',
      imprint: 'Deep etch with optional color fill • Gift boxed presentation',
      tags: ['Crystal', 'Recognition'],
      hero: 'Assets/images/Rocket Crystal Tower.png',
      gallery: [
        'Assets/images/Rocket Crystal Tower.png',
        'Assets/images/Rocket_Crystal_Tower_Slant.png',
        'Assets/images/Rocket_Crystal_Tower (packaging).jpeg'
      ],
      pricing: [
        { qty: 1, price: 119 },
        { qty: 5, price: 114 },
        { qty: 12, price: 109 }
      ],
      template: { label: 'Vector Template (PDF)', url: 'https://example.com/templates/crystal-tower.pdf' }
    },
    {
      id: 'scarborough-award',
      name: 'Scarborough Award',
      tagline: 'American-made hardwood paired with brushed metal.',
      description: 'Sustainably harvested cherry wood is paired with brushed aluminum plates for a warm yet modern look. Personalization is included and crafted in-house.',
      imprint: 'Laser engraved plate • Made in the USA',
      tags: ['Wood', 'Made in USA'],
      hero: 'Assets/images/Scarborough_8.jpg',
      gallery: [
        'Assets/images/Scarborough_6.jpg',
        'Assets/images/Scarborough_7.jpg',
        'Assets/images/Scarborough_8.jpg',
        'Assets/images/Scarborough_9.jpg',
        'Assets/images/Scarborough_10.jpg'
      ],
      pricing: [
        { qty: 1, price: 98 },
        { qty: 12, price: 92 },
        { qty: 25, price: 88 }
      ],
      preview3d: 'https://example.com/3d/scarborough-award'
    },
    {
      id: 'puzzle-acrylic',
      name: 'Puzzle Acrylic',
      tagline: 'Interlocking acrylic blocks with vivid UV print.',
      description: 'Stack, rotate, and interlock acrylic panels to build a dimensional recognition story. Each panel prints full-color on both sides for endless storytelling.',
      imprint: 'Two-sided UV print • Magnetic connectors',
      tags: ['Acrylic', 'Modular'],
      hero: 'Assets/images/RKT_Puzzle.jpg',
      gallery: [
        'Assets/images/RKT_Puzzle.jpg',
        'Assets/images/RKT_RED_ACRYLIC_BLOCK.png',
        'Assets/images/RKT_EXTRUDE.jpg'
      ],
      pricing: [
        { qty: 1, price: 75 },
        { qty: 10, price: 69 },
        { qty: 25, price: 62 }
      ]
    }
  ];

  const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/960x720/eff3f8/6b7280?text=Image+Coming+Soon';
  const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const ready = (cb)=>{
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', cb, { once: true });
    }else{
      cb();
    }
  };

  const select = (root, selectors)=>{
    const scope = root || document;
    const list = Array.isArray(selectors) ? selectors : String(selectors || '').split(',');
    for(const raw of list){
      const sel = raw.trim();
      if(!sel) continue;
      const found = scope.querySelector(sel);
      if(found) return found;
    }
    return null;
  };

  const selectAll = (root, selectors)=>{
    const scope = root || document;
    const list = Array.isArray(selectors) ? selectors : String(selectors || '').split(',');
    const results = [];
    list.forEach(raw => {
      const sel = raw.trim();
      if(!sel) return;
      scope.querySelectorAll(sel).forEach(node => results.push(node));
    });
    return results;
  };

  const toAbsolute = (path)=>{
    if(!path) return null;
    try{
      return new URL(path, document.baseURI).toString();
    }catch(err){
      console.warn('showroom.js: unable to resolve asset path', path, err);
      return path;
    }
  };

  const uniqueImages = (paths)=>{
    const out = [];
    const seen = new Set();
    paths.forEach((p)=>{
      const abs = toAbsolute(p);
      if(!abs || seen.has(abs)) return;
      seen.add(abs);
      out.push(abs);
    });
    return out;
  };

  const priceLabel = (value)=>{
    if(value == null || value === '' || Number.isNaN(Number(value))){
      return 'Quote Upon Request';
    }
    const num = Number(value);
    return Number.isFinite(num) ? USD.format(num) : 'Quote Upon Request';
  };

  const priceSummary = (product)=>{
    if(!Array.isArray(product.pricing) || !product.pricing.length){
      return 'Contact for pricing';
    }
    const tier = product.pricing[0];
    const prefix = tier.qty != null ? `${tier.qty}+ • ` : '';
    return `${prefix}${priceLabel(tier.price)}`;
  };

  ready(()=>{
    const grid = select(document, '[data-showroom-grid],#showroom-grid,.showroom-grid');
    if(!grid){
      console.warn('showroom.js: No showroom grid element found.');
      return;
    }

    const countEl = select(document, '[data-showroom-count],#showroom-count');
    if(countEl){
      countEl.textContent = `${SAMPLE_PRODUCTS.length} product${SAMPLE_PRODUCTS.length === 1 ? '' : 's'}`;
    }

    const drawer = select(document, '[data-showroom-drawer],#showroom-drawer,.product-drawer,.showroom-drawer');
    const overlaySelectors = '[data-drawer-overlay],[data-showroom-overlay],#drawer-overlay,#showroom-overlay,.drawer-overlay';
    const overlay = select(document, overlaySelectors) || (drawer ? select(drawer, overlaySelectors) : null);
    const closeBtn = drawer ? select(drawer, '[data-drawer-close],[data-showroom-close],[data-close],#drawer-close,.drawer-close,.showroom-drawer__close') : null;
    const titleEl = drawer ? select(drawer, '[data-drawer-title],[data-showroom-title],#drawer-title,.drawer-title,.showroom-drawer__title') : null;
    const summaryEl = drawer ? select(drawer, '[data-drawer-summary],[data-drawer-subtitle],[data-showroom-summary],#drawer-summary,.drawer-summary,.showroom-drawer__subtitle') : null;
    const descEl = drawer ? select(drawer, '[data-drawer-description],[data-showroom-description],#drawer-description,.drawer-description,.showroom-drawer__description') : null;
    const imprintEl = drawer ? select(drawer, '[data-drawer-imprint],[data-showroom-imprint],#drawer-imprint,.drawer-imprint,.showroom-drawer__imprint') : null;
    const tagsEl = drawer ? select(drawer, '[data-drawer-tags],[data-showroom-tags],#drawer-tags,.drawer-tags,.showroom-drawer__tags') : null;
    const skuEl = drawer ? select(drawer, '[data-drawer-sku],[data-showroom-sku],#drawer-sku,.drawer-sku,.showroom-drawer__sku') : null;
    const heroContainer = drawer ? select(drawer, '[data-drawer-hero],[data-showroom-hero],#drawer-hero,.drawer-hero,.showroom-drawer__hero') : null;
    let heroImg = null;
    if(heroContainer){
      if(heroContainer.tagName === 'IMG'){
        heroImg = heroContainer;
      }else{
        heroImg = heroContainer.querySelector('img');
        if(!heroImg){
          heroImg = document.createElement('img');
          heroImg.alt = '';
          heroImg.className = 'showroom-hero-image';
          heroContainer.appendChild(heroImg);
        }
      }
    }
    const gallery = drawer ? select(drawer, '[data-drawer-gallery],[data-showroom-gallery],#drawer-thumbs,#drawer-gallery,.drawer-gallery,.showroom-drawer__gallery') : null;
    const previewBtn = drawer ? select(drawer, '[data-3d-preview],[data-drawer-preview],[data-showroom-preview],#drawer-preview3d,#drawer-preview,.drawer-preview,.showroom-drawer__preview') : null;
    const templateBtn = drawer ? select(drawer, '[data-template-button],[data-drawer-template],[data-showroom-template],#drawer-template,.drawer-template,.showroom-drawer__template') : null;
    let pricingTable = drawer ? select(drawer, '[data-pricing-table],#pricing-table,.pricing-table,.showroom-drawer__pricing') : null;
    let pricingBody = drawer ? select(drawer, '[data-pricing-body],#pricing-body,.pricing-body,.showroom-drawer__pricing-body') : null;
    const pricingEmpty = drawer ? select(drawer, '[data-pricing-empty],#pricing-empty,.pricing-empty,.showroom-drawer__pricing-empty') : null;

    if(pricingTable && !pricingBody){
      if(pricingTable.tagName === 'TABLE'){
        pricingBody = pricingTable.tBodies[0] || pricingTable.appendChild(document.createElement('tbody'));
      }else{
        pricingBody = pricingTable;
      }
    }

    if(!pricingTable && pricingBody && pricingBody.tagName === 'TBODY'){
      pricingTable = pricingBody.closest('table');
    }

    const ensureLightbox = ()=>{
      let lb = select(document, '[data-lightbox],#gallery-lightbox,.lightbox,.showroom-lightbox');
      if(lb) return lb;
      lb = document.createElement('div');
      lb.className = 'showroom-lightbox';
      lb.setAttribute('data-lightbox', 'auto');
      lb.setAttribute('aria-hidden', 'true');
      lb.innerHTML = `\n        <div class="showroom-lightbox__backdrop" data-lightbox-close></div>\n        <figure class="showroom-lightbox__dialog" role="dialog" aria-modal="true">\n          <button type="button" class="showroom-lightbox__close" data-lightbox-close aria-label="Close">×</button>\n          <img data-lightbox-image alt="" />\n        </figure>\n      `;
      document.body.appendChild(lb);
      return lb;
    };

    const lightbox = ensureLightbox();
    const lightboxImg = select(lightbox, '[data-lightbox-image],#lightbox-image,.lightbox-image,img');
    const lightboxClosers = selectAll(lightbox, '[data-lightbox-close],[data-close-lightbox],#lightbox-close,.lightbox-close,.showroom-lightbox__close,.showroom-lightbox__backdrop');

    const state = {
      product: null,
      trigger: null,
      gallery: [],
      heroIndex: 0,
      lightboxTrigger: null
    };

    const setHero = (src, index)=>{
      if(!heroImg) return;
      state.heroIndex = index != null ? index : state.heroIndex;
      heroImg.src = src || PLACEHOLDER_IMAGE;
      heroImg.alt = `${state.product ? state.product.name : 'Product'} image${state.heroIndex != null ? ` ${state.heroIndex + 1}` : ''}`;
      heroImg.dataset.lightboxSrc = src || PLACEHOLDER_IMAGE;
      if(gallery){
        Array.from(gallery.children).forEach((child, i)=>{
          if(child && typeof child.classList !== 'undefined'){
            child.classList.toggle('is-active', i === state.heroIndex);
          }
        });
      }
    };

    const buildGallery = (product)=>{
      if(!gallery) return;
      gallery.innerHTML = '';
      state.gallery = uniqueImages([
        ...(Array.isArray(product.gallery) ? product.gallery : []),
        product.hero,
        product.thumb,
      ]);
      if(!state.gallery.length){
        state.gallery = [PLACEHOLDER_IMAGE];
      }
      state.gallery.forEach((src, index)=>{
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'showroom-thumb';
        btn.setAttribute('data-index', String(index));
        const img = document.createElement('img');
        img.src = src;
        img.alt = `${product.name} thumbnail ${index + 1}`;
        btn.appendChild(img);
        btn.addEventListener('click', ()=>{
          setHero(src, index);
        });
        btn.addEventListener('dblclick', ()=>{
          openLightbox(src, img.alt, btn);
        });
        btn.addEventListener('keydown', (ev)=>{
          if(ev.key === 'Enter' || ev.key === ' '){
            ev.preventDefault();
            setHero(src, index);
          }
          if(ev.key === 'ArrowRight'){
            ev.preventDefault();
            const next = (index + 1) % state.gallery.length;
            const nextBtn = gallery.querySelector(`[data-index="${next}"]`);
            if(nextBtn) nextBtn.focus();
          }
          if(ev.key === 'ArrowLeft'){
            ev.preventDefault();
            const prev = (index - 1 + state.gallery.length) % state.gallery.length;
            const prevBtn = gallery.querySelector(`[data-index="${prev}"]`);
            if(prevBtn) prevBtn.focus();
          }
        });
        gallery.appendChild(btn);
      });
      setHero(state.gallery[0], 0);
    };

    const renderPricing = (pricing)=>{
      if(!pricingBody){
        return;
      }
      pricingBody.innerHTML = '';
      const rows = Array.isArray(pricing) ? pricing.filter(Boolean) : [];
      if(!rows.length){
        if(pricingTable){
          pricingTable.classList.add('is-empty');
        }
        if(pricingEmpty){
          pricingEmpty.hidden = false;
        }else{
          const fallback = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = 2;
          td.textContent = 'Contact us for pricing information.';
          fallback.appendChild(td);
          pricingBody.appendChild(fallback);
        }
        return;
      }
      rows
        .slice()
        .sort((a,b)=>{
          const qa = a.qty != null ? a.qty : Number.MAX_SAFE_INTEGER;
          const qb = b.qty != null ? b.qty : Number.MAX_SAFE_INTEGER;
          return qa - qb;
        })
        .forEach(tier => {
          const tr = document.createElement('tr');
          const qtyTd = document.createElement('td');
          const priceTd = document.createElement('td');
          qtyTd.textContent = tier.label || (tier.qty != null ? `${tier.qty}+` : 'Qty');
          priceTd.textContent = priceLabel(tier.price);
          tr.appendChild(qtyTd);
          tr.appendChild(priceTd);
          pricingBody.appendChild(tr);
        });
      if(pricingTable){
        pricingTable.classList.remove('is-empty');
        pricingTable.removeAttribute('hidden');
      }
      if(pricingEmpty){
        pricingEmpty.hidden = true;
      }
    };

    const toggleButton = (btn, href, label)=>{
      if(!btn) return;
      if(href){
        btn.style.display = '';
        if(btn.tagName === 'A'){
          btn.href = href;
          btn.target = '_blank';
          btn.rel = 'noopener noreferrer';
        }
        btn.textContent = label || btn.textContent || 'Open';
        btn.removeAttribute('disabled');
      }else{
        btn.style.display = 'none';
        if(btn.tagName === 'A'){
          btn.removeAttribute('href');
        }
        btn.setAttribute('disabled', 'disabled');
      }
    };

    const renderTags = (tags)=>{
      if(!tagsEl) return;
      tagsEl.innerHTML = '';
      const list = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(s=>s.trim()).filter(Boolean) : [];
      list.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'showroom-tag';
        span.textContent = tag;
        tagsEl.appendChild(span);
      });
      tagsEl.style.display = list.length ? '' : 'none';
    };

    const openDrawer = (product, trigger)=>{
      state.product = product;
      state.trigger = trigger || null;
      if(!drawer){
        return;
      }
      if(titleEl){
        titleEl.textContent = product.name || '';
      }
      if(summaryEl){
        const text = product.tagline || product.summary || '';
        summaryEl.textContent = text;
        summaryEl.style.display = text ? '' : 'none';
      }
      if(descEl){
        descEl.textContent = product.description || '';
        descEl.style.display = product.description ? '' : 'none';
      }
      if(imprintEl){
        imprintEl.textContent = product.imprint || '';
        imprintEl.style.display = product.imprint ? '' : 'none';
      }
      if(skuEl){
        skuEl.textContent = product.sku || '';
        skuEl.style.display = product.sku ? '' : 'none';
      }
      renderTags(product.tags);
      buildGallery(product);
      renderPricing(product.pricing);
      toggleButton(previewBtn, product.preview3d, product.previewLabel || 'View 3D Preview');
      const tpl = product.template;
      const tplHref = tpl && typeof tpl === 'object' ? tpl.url : tpl;
      const tplLabel = tpl && typeof tpl === 'object' ? tpl.label : undefined;
      toggleButton(templateBtn, tplHref, tplLabel || 'Download Template');

      if(drawer){
        drawer.classList.add('is-open');
        drawer.removeAttribute('hidden');
        drawer.setAttribute('aria-hidden', 'false');
      }
      if(overlay){
        overlay.classList.add('is-active');
        overlay.removeAttribute('hidden');
      }
      document.body.classList.add('showroom-drawer-open');
      if(closeBtn){
        closeBtn.focus({ preventScroll: true });
      }
    };

    const closeDrawer = ()=>{
      if(overlay){
        overlay.classList.remove('is-active');
        overlay.setAttribute('hidden', '');
      }
      if(drawer){
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        drawer.setAttribute('hidden', '');
      }
      document.body.classList.remove('showroom-drawer-open');
      if(state.trigger && typeof state.trigger.focus === 'function'){
        try{
          state.trigger.focus({ preventScroll: true });
        }catch(err){
          state.trigger.focus();
        }
      }
      state.product = null;
      state.trigger = null;
    };

    const openLightbox = (src, alt, origin)=>{
      if(!lightbox || !lightboxImg) return;
      state.lightboxTrigger = origin || null;
      lightboxImg.src = src || PLACEHOLDER_IMAGE;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('is-open');
      lightbox.removeAttribute('aria-hidden');
      lightbox.removeAttribute('hidden');
      document.body.classList.add('showroom-lightbox-open');
      const focusable = lightbox.querySelector('[data-lightbox-close]');
      if(focusable){
        focusable.focus({ preventScroll: true });
      }
    };

    const closeLightbox = ()=>{
      if(!lightbox) return;
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      lightbox.setAttribute('hidden', '');
      if(lightboxImg){
        lightboxImg.src = '';
        lightboxImg.alt = '';
      }
      document.body.classList.remove('showroom-lightbox-open');
      if(state.lightboxTrigger && typeof state.lightboxTrigger.focus === 'function'){
        try{
          state.lightboxTrigger.focus({ preventScroll: true });
        }catch(err){
          state.lightboxTrigger.focus();
        }
      }
      state.lightboxTrigger = null;
    };

    if(heroContainer && !heroContainer.hasAttribute('tabindex')){
      heroContainer.tabIndex = 0;
      heroContainer.setAttribute('role', 'button');
    }
    const heroInteractive = heroContainer || heroImg;
    if(heroInteractive){
      heroInteractive.addEventListener('click', ()=>{
        const src = heroImg ? (heroImg.dataset.lightboxSrc || heroImg.src) : null;
        openLightbox(src, heroImg ? heroImg.alt : '', heroInteractive);
      });
      heroInteractive.addEventListener('keydown', (ev)=>{
        if(ev.key === 'Enter' || ev.key === ' '){
          ev.preventDefault();
          const src = heroImg ? (heroImg.dataset.lightboxSrc || heroImg.src) : null;
          openLightbox(src, heroImg ? heroImg.alt : '', heroInteractive);
        }
      });
    }

    if(Array.isArray(lightboxClosers)){
      lightboxClosers.forEach(btn => btn.addEventListener('click', closeLightbox));
    }
    if(lightbox){
      lightbox.addEventListener('click', (ev)=>{
        if(ev.target === lightbox){
          closeLightbox();
        }
      });
    }

    if(overlay){
      overlay.addEventListener('click', closeDrawer);
    }
    if(closeBtn){
      closeBtn.addEventListener('click', closeDrawer);
    }

    document.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Escape' || ev.key === 'Esc'){
        if(lightbox && lightbox.classList.contains('is-open')){
          ev.preventDefault();
          closeLightbox();
          return;
        }
        if(drawer && drawer.classList.contains('is-open')){
          ev.preventDefault();
          closeDrawer();
        }
      }
    });

    const createCard = (product)=>{
      const article = document.createElement('article');
      article.className = 'showroom-card';
      article.tabIndex = 0;
      article.setAttribute('role', 'button');
      article.setAttribute('data-product-id', product.id);

      const media = document.createElement('div');
      media.className = 'showroom-card__media';
      const img = document.createElement('img');
      img.src = toAbsolute(product.thumb || product.hero) || PLACEHOLDER_IMAGE;
      img.alt = `${product.name} thumbnail`;
      media.appendChild(img);

      const body = document.createElement('div');
      body.className = 'showroom-card__body';
      const name = document.createElement('h3');
      name.className = 'showroom-card__title';
      name.textContent = product.name;
      body.appendChild(name);

      if(product.tagline){
        const blurb = document.createElement('p');
        blurb.className = 'showroom-card__tagline';
        blurb.textContent = product.tagline;
        body.appendChild(blurb);
      }

      const price = document.createElement('div');
      price.className = 'showroom-card__price';
      price.textContent = priceSummary(product);
      body.appendChild(price);

      article.appendChild(media);
      article.appendChild(body);

      const open = ()=> openDrawer(product, article);
      article.addEventListener('click', open);
      article.addEventListener('keydown', (ev)=>{
        if(ev.key === 'Enter' || ev.key === ' '){
          ev.preventDefault();
          open();
        }
      });

      return article;
    };

    grid.innerHTML = '';
    SAMPLE_PRODUCTS.forEach(product => {
      grid.appendChild(createCard(product));
    });
  });
})();

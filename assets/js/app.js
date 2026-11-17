(function () {
	'use strict';

	var STORAGE_KEY = 'elha_event_custom_v2';

	var defaultConfig = {
		settings: {
			brand_name: 'eLHa Event',
			whatsapp_number: '6281234567890',
			whatsapp_admin_lbl: 'Admin eLHa Event',
			promo_code: 'KOMUNITAS10',
			promo_pct: 10
		},
		events: []
	};

	var config = JSON.parse(JSON.stringify(defaultConfig));
	var app = document.getElementById('elha-eo-app');
	if (!app) {
		return;
	}

	var discountRate = 0;
	var lastFocusedElement = null;
	var activeCategory = 'all';
	var editingEventId = '';
	var currentBannerData = '';

	function slugifyCategory(label) {
		var clean = String(label || 'umum').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
		return clean || 'umum';
	}

	function getEventTotalQuota(ev) {
		if (!ev || !Array.isArray(ev.tiers)) return 0;
		var sum = 0;
		for (var i = 0; i < ev.tiers.length; i++) {
			sum += Math.max(0, parseInt(ev.tiers[i].quota || 0, 10));
		}
		return sum;
	}

	function formatRupiah(amount) {
		var num = Math.max(0, Math.round(Number(amount) || 0));
		return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	}

	function findEventById(eventId) {
		for (var i = 0; i < config.events.length; i++) {
			if (config.events[i].id === eventId) {
				return config.events[i];
			}
		}
		return config.events[0] || null;
	}

	function saveConfigToLocal() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		} catch (e) {}
	}

	// Theme switching (Moon / Sun icon)
	var themeBtn = document.getElementById('elha-theme-toggle');
	var iconMoon = document.getElementById('elha-icon-moon');
	var iconSun = document.getElementById('elha-icon-sun');

	function applyTheme(theme) {
		app.setAttribute('data-theme', theme);
		if (themeBtn) {
			var isDark = theme === 'dark';
			themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
			themeBtn.setAttribute('aria-label', isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
			if (iconMoon) iconMoon.hidden = isDark;
			if (iconSun) iconSun.hidden = !isDark;
		}
		try {
			localStorage.setItem('elha_eo_theme', theme);
		} catch (e) {}
	}

	try {
		var savedTheme = localStorage.getItem('elha_eo_theme');
		if (savedTheme === 'dark' || savedTheme === 'light') {
			applyTheme(savedTheme);
		}
	} catch (e) {}

	if (themeBtn) {
		themeBtn.addEventListener('click', function () {
			var current = app.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
			applyTheme(current);
		});
	}

	// Mobile drawer
	var mobileMenuBtn = document.getElementById('elha-mobile-menu-btn');
	var mobileDrawer = document.getElementById('elha-mobile-drawer');

	function closeMobileDrawer() {
		if (mobileDrawer && mobileMenuBtn) {
			mobileDrawer.hidden = true;
			mobileMenuBtn.setAttribute('aria-expanded', 'false');
		}
	}

	if (mobileMenuBtn && mobileDrawer) {
		mobileMenuBtn.addEventListener('click', function () {
			var isOpen = !mobileDrawer.hidden;
			mobileDrawer.hidden = isOpen;
			mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
		});
	}

	// View switching (landing, checkout, admin)
	var viewLanding = document.getElementById('elha-view-landing');
	var viewCheckout = document.getElementById('elha-view-checkout');
	var viewAdmin = document.getElementById('elha-view-admin');
	var faqSection = document.getElementById('tanya-jawab');
	var viewSwitchBtns = app.querySelectorAll('[data-view-target]');

	function switchView(targetView, scrollToTop) {
		var mode = (targetView === 'checkout' || targetView === 'admin') ? targetView : 'landing';
		app.setAttribute('data-active-view', mode);

		if (viewLanding) viewLanding.hidden = mode !== 'landing';
		if (viewCheckout) viewCheckout.hidden = mode !== 'checkout';
		if (viewAdmin) viewAdmin.hidden = mode !== 'admin';
		if (faqSection) faqSection.hidden = mode === 'admin';

		for (var i = 0; i < viewSwitchBtns.length; i++) {
			var btn = viewSwitchBtns[i];
			if (btn.classList.contains('elha-switch-btn')) {
				var active = btn.getAttribute('data-view-target') === mode;
				btn.classList.toggle('is-active', active);
				btn.setAttribute('aria-pressed', active ? 'true' : 'false');
			}
		}

		closeMobileDrawer();

		if (scrollToTop !== false) {
			app.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	for (var i = 0; i < viewSwitchBtns.length; i++) {
		viewSwitchBtns[i].addEventListener('click', function (e) {
			e.preventDefault();
			switchView(this.getAttribute('data-view-target'), true);
		});
	}

	var navSectionLinks = app.querySelectorAll('[data-nav-section]');
	for (var j = 0; j < navSectionLinks.length; j++) {
		navSectionLinks[j].addEventListener('click', function (e) {
			var sectionId = this.getAttribute('data-nav-section');
			var targetEl = document.getElementById(sectionId);
			if (!targetEl) {
				return;
			}
			e.preventDefault();
			if (sectionId !== 'tanya-jawab') {
				switchView('landing', false);
			}
			closeMobileDrawer();
			targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	}

	var homeLinks = app.querySelectorAll('[data-nav-action="go-home"]');
	for (var h = 0; h < homeLinks.length; h++) {
		homeLinks[h].addEventListener('click', function (e) {
			e.preventDefault();
			switchView('landing', true);
		});
	}

	// Render entire page dynamically from config.events
	var heroSection = document.getElementById('beranda');
	var filterTabsContainer = document.getElementById('elha-filter-tabs');
	var searchInput = document.getElementById('elha-event-search');
	var stateList = document.getElementById('elha-events-list');
	var stateLoading = document.getElementById('elha-events-loading');
	var stateEmpty = document.getElementById('elha-events-empty');
	var emptyTitle = document.getElementById('elha-empty-title');
	var emptyDesc = document.getElementById('elha-empty-desc');
	var emptyStudioBtn = document.getElementById('elha-empty-studio-btn');
	var stateError = document.getElementById('elha-events-error');
	var eventSelect = document.getElementById('elha-checkout-event-select');
	var tiersContainer = document.getElementById('elha-checkout-tiers-container');
	var qtyInput = document.getElementById('elha-checkout-qty');
	var qtyMinusBtn = document.getElementById('elha-qty-minus');
	var qtyPlusBtn = document.getElementById('elha-qty-plus');
	var promoInput = document.getElementById('elha-promo-input');
	var applyPromoBtn = document.getElementById('elha-apply-promo-btn');
	var promoStatus = document.getElementById('elha-promo-status');
	var submitCheckoutBtn = document.getElementById('elha-checkout-submit-btn');

	function renderCategoryFilterTabs() {
		if (!filterTabsContainer) return;
		filterTabsContainer.innerHTML = '';

		var allBtn = document.createElement('button');
		allBtn.type = 'button';
		allBtn.className = 'elha-filter-tab' + (activeCategory === 'all' ? ' is-active' : '');
		allBtn.setAttribute('data-filter-cat', 'all');
		allBtn.setAttribute('role', 'tab');
		allBtn.setAttribute('aria-selected', activeCategory === 'all' ? 'true' : 'false');
		allBtn.textContent = 'Semua Event';
		filterTabsContainer.appendChild(allBtn);

		var seenCats = {};
		for (var i = 0; i < config.events.length; i++) {
			var ev = config.events[i];
			var catKey = ev.category || slugifyCategory(ev.category_lbl);
			var catName = ev.category_lbl || ev.category || 'Umum';
			if (catKey && !seenCats[catKey]) {
				seenCats[catKey] = true;
				var tab = document.createElement('button');
				tab.type = 'button';
				var isAct = activeCategory === catKey;
				tab.className = 'elha-filter-tab' + (isAct ? ' is-active' : '');
				tab.setAttribute('data-filter-cat', catKey);
				tab.setAttribute('role', 'tab');
				tab.setAttribute('aria-selected', isAct ? 'true' : 'false');
				tab.textContent = catName;
				filterTabsContainer.appendChild(tab);
			}
		}

		if (activeCategory !== 'all' && !seenCats[activeCategory]) {
			activeCategory = 'all';
			allBtn.className = 'elha-filter-tab is-active';
			allBtn.setAttribute('aria-selected', 'true');
		}

		var tabs = filterTabsContainer.querySelectorAll('.elha-filter-tab');
		for (var t = 0; t < tabs.length; t++) {
			tabs[t].addEventListener('click', function () {
				activeCategory = this.getAttribute('data-filter-cat') || 'all';
				var allTabs = filterTabsContainer.querySelectorAll('.elha-filter-tab');
				for (var k = 0; k < allTabs.length; k++) {
					var isCurrent = allTabs[k] === this;
					allTabs[k].classList.toggle('is-active', isCurrent);
					allTabs[k].setAttribute('aria-selected', isCurrent ? 'true' : 'false');
				}
				filterEventsCatalog();
			});
		}
	}

	function renderAllEventsUI() {
		renderCategoryFilterTabs();

		var catalogControlsEl = document.querySelector('.elha-catalog-controls');
		var searchBoxEl = document.querySelector('.elha-search-box');
		var hasEvents = Boolean(config.events && config.events.length > 0);
		if (catalogControlsEl) catalogControlsEl.hidden = !hasEvents;
		if (searchBoxEl) searchBoxEl.hidden = !hasEvents;

		var stubPaymentNote = document.getElementById('elha-stub-payment-note');
		if (stubPaymentNote) {
			stubPaymentNote.innerHTML = '<strong>Layanan Tiket Resmi:</strong> <span class="elha-mono-text">+' + config.settings.whatsapp_number + '</span>';
		}

		if (!config.events || config.events.length === 0) {
			if (heroSection) heroSection.hidden = true;
			if (stateList) {
				stateList.innerHTML = '';
				stateList.hidden = true;
			}
			if (stateEmpty) stateEmpty.hidden = false;
			if (emptyTitle) emptyTitle.textContent = 'Belum Ada Event yang Diposting';
			if (emptyDesc) emptyDesc.textContent = 'Katalog event dan kategori masih kosong. Silakan buat kategori dan posting event pertama Anda melalui Event Studio.';
			if (emptyStudioBtn) emptyStudioBtn.hidden = false;
			var rstBtn = document.getElementById('elha-reset-filter-btn');
			if (rstBtn) rstBtn.hidden = true;

			if (eventSelect) {
				eventSelect.innerHTML = '<option value="">Belum ada event tersedia</option>';
			}
			if (tiersContainer) {
				tiersContainer.innerHTML = '<div class="elha-event-mini-summary">Silakan buat event terlebih dahulu di Event Studio.</div>';
			}
			var summaryVenue = document.getElementById('elha-summary-venue');
			var summaryDate = document.getElementById('elha-summary-date');
			if (summaryVenue) summaryVenue.textContent = 'Belum ada lokasi';
			if (summaryDate) summaryDate.textContent = 'Belum ada jadwal';
			if (submitCheckoutBtn) submitCheckoutBtn.disabled = true;
			updateStubCalculation();
			return;
		}

		if (heroSection) heroSection.hidden = false;
		if (submitCheckoutBtn) submitCheckoutBtn.disabled = false;

		// 1. Find Featured Event for Hero
		var featured = config.events[0];
		for (var i = 0; i < config.events.length; i++) {
			if (config.events[i].featured) {
				featured = config.events[i];
				break;
			}
		}

		var heroDate = document.getElementById('elha-hero-featured-date');
		var heroTitle = document.getElementById('elha-hero-featured-title');
		var heroSummary = document.getElementById('elha-hero-featured-summary');
		var heroVenue = document.getElementById('elha-hero-featured-venue');
		var heroTime = document.getElementById('elha-hero-featured-time');
		var heroCode = document.getElementById('elha-hero-featured-code');
		var heroQuota = document.getElementById('elha-hero-featured-quota');
		var heroTierList = document.getElementById('elha-hero-tier-list');
		var heroPrimaryBtn = document.getElementById('elha-hero-primary-btn');
		var heroStubBtn = document.getElementById('elha-hero-stub-btn');

		if (heroDate) heroDate.textContent = featured.date_label;
		if (heroTitle) heroTitle.textContent = featured.title;
		if (heroSummary) heroSummary.textContent = featured.summary;
		if (heroVenue) heroVenue.textContent = featured.venue;
		if (heroTime) heroTime.textContent = featured.time_label;
		if (heroCode) heroCode.textContent = featured.code;
		if (heroQuota) heroQuota.textContent = featured.quota_label;

		var heroGridEl = heroSection ? heroSection.querySelector('.elha-hero-grid') : null;
		if (heroGridEl) {
			if (featured.banner_image) {
				heroGridEl.classList.add('has-banner-img');
				heroGridEl.style.backgroundImage =
					'linear-gradient(95deg, rgba(11, 30, 59, 0.94) 0%, rgba(11, 30, 59, 0.84) 55%, rgba(11, 30, 59, 0.72) 100%), url("' + featured.banner_image.replace(/"/g, '%22') + '")';
			} else {
				heroGridEl.classList.remove('has-banner-img');
				heroGridEl.style.backgroundImage = '';
			}
		}

		if (heroPrimaryBtn) {
			heroPrimaryBtn.setAttribute('data-quick-event', featured.id);
			heroPrimaryBtn.setAttribute('data-quick-tier', featured.tiers[0].tier_id);
		}
		if (heroStubBtn) {
			heroStubBtn.setAttribute('data-quick-event', featured.id);
			heroStubBtn.setAttribute('data-quick-tier', featured.tiers[0].tier_id);
		}

		if (heroTierList) {
			heroTierList.innerHTML = '';
			for (var t = 0; t < featured.tiers.length; t++) {
				var tier = featured.tiers[t];
				var btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'elha-quick-tier-btn';
				btn.setAttribute('data-quick-event', featured.id);
				btn.setAttribute('data-quick-tier', tier.tier_id);
				var qTxt = tier.quota ? ' (Kuota ' + tier.quota + ')' : '';
				btn.innerHTML =
					'<span class="elha-quick-tier-name"></span>' +
					'<strong class="elha-quick-tier-price"></strong>';
				btn.querySelector('.elha-quick-tier-name').textContent = tier.name + qTxt;
				btn.querySelector('.elha-quick-tier-price').textContent = formatRupiah(tier.price);
				btn.addEventListener('click', function () {
					jumpToCheckout(this.getAttribute('data-quick-event'), this.getAttribute('data-quick-tier'));
				});
				heroTierList.appendChild(btn);
			}
		}

		// 2. Render Event Catalog Poster Cards
		if (stateList) {
			stateList.innerHTML = '';
			for (var e = 0; e < config.events.length; e++) {
				var ev = config.events[e];
				var minPrice = ev.tiers[0] ? ev.tiers[0].price : 0;
				for (var m = 0; m < ev.tiers.length; m++) {
					if (ev.tiers[m].price < minPrice) minPrice = ev.tiers[m].price;
				}
				var pTheme = ev.poster_theme || 'terracotta';

				var article = document.createElement('article');
				article.className = 'elha-schedule-row elha-poster-card';
				article.setAttribute('data-event-id', ev.id);
				article.setAttribute('data-event-cat', ev.category);
				article.setAttribute('data-event-search', (ev.title + ' ' + ev.venue + ' ' + ev.category_lbl).toLowerCase());
				article.setAttribute('role', 'listitem');

				article.innerHTML =
					'<div class="elha-poster-art poster-' + pTheme + (ev.banner_image ? ' has-banner-img' : '') + '">' +
					'<div class="elha-poster-top-badges">' +
					'<span class="elha-poster-date"></span>' +
					'<span class="elha-poster-cat"></span>' +
					'</div>' +
					'<div class="elha-poster-bottom-code">' +
					'<span class="elha-mono-text elha-p-code"></span>' +
					'<span class="elha-p-quota"></span>' +
					'</div>' +
					'</div>' +
					'<div class="elha-poster-body">' +
					'<h3 class="elha-row-title"></h3>' +
					'<p class="elha-row-venue"></p>' +
					'</div>' +
					'<div class="elha-poster-footer">' +
					'<div class="elha-price-box">' +
					'<span class="elha-price-label">Tiket Mulai</span>' +
					'<strong class="elha-price-value">' + formatRupiah(minPrice) + '</strong>' +
					'</div>' +
					'<button type="button" class="elha-btn elha-btn-primary" data-select-event="' + ev.id + '">Beli Tiket</button>' +
					'</div>';

				if (ev.banner_image) {
					var posterArtEl = article.querySelector('.elha-poster-art');
					posterArtEl.style.backgroundImage =
						'linear-gradient(180deg, rgba(11, 30, 59, 0.54) 0%, rgba(11, 30, 59, 0.78) 100%), url("' + ev.banner_image.replace(/"/g, '%22') + '")';
				}

				article.querySelector('.elha-poster-date').textContent = ev.date_label;
				article.querySelector('.elha-poster-cat').textContent = ev.category_lbl;
				article.querySelector('.elha-p-code').textContent = ev.code;
				article.querySelector('.elha-p-quota').textContent = ev.quota_label;
				article.querySelector('.elha-row-title').textContent = ev.title;
				article.querySelector('.elha-row-venue').textContent = ev.venue + ' \u2022 ' + ev.time_label;

				article.querySelector('[data-select-event]').addEventListener('click', function () {
					jumpToCheckout(this.getAttribute('data-select-event'), null);
				});

				stateList.appendChild(article);
			}
		}

		// 3. Populate Checkout Event Dropdown
		if (eventSelect) {
			var prevVal = eventSelect.value;
			eventSelect.innerHTML = '';
			for (var s = 0; s < config.events.length; s++) {
				var optEv = config.events[s];
				var opt = document.createElement('option');
				opt.value = optEv.id;
				opt.textContent = optEv.title + ' (' + optEv.date_label + ')';
				eventSelect.appendChild(opt);
			}
			var targetEv = findEventById(prevVal || featured.id);
			if (targetEv) {
				eventSelect.value = targetEv.id;
				renderTiersForEvent(targetEv, null);
			}
		}

		filterEventsCatalog();
	}

	function jumpToCheckout(evId, tierId) {
		var evObj = findEventById(evId);
		if (evObj && eventSelect) {
			eventSelect.value = evObj.id;
			renderTiersForEvent(evObj, tierId);
		}
		switchView('checkout', true);
	}

	var heroPrimaryBtnEl = document.getElementById('elha-hero-primary-btn');
	if (heroPrimaryBtnEl) {
		heroPrimaryBtnEl.addEventListener('click', function () {
			jumpToCheckout(this.getAttribute('data-quick-event'), this.getAttribute('data-quick-tier'));
		});
	}

	var heroStubBtnEl = document.getElementById('elha-hero-stub-btn');
	if (heroStubBtnEl) {
		heroStubBtnEl.addEventListener('click', function () {
			jumpToCheckout(this.getAttribute('data-quick-event'), this.getAttribute('data-quick-tier'));
		});
	}

	function filterEventsCatalog() {
		if (stateLoading) stateLoading.hidden = true;
		if (stateError) stateError.hidden = true;

		if (!config.events || config.events.length === 0) {
			if (stateList) stateList.hidden = true;
			if (stateEmpty) stateEmpty.hidden = false;
			if (emptyTitle) emptyTitle.textContent = 'Belum Ada Event yang Diposting';
			if (emptyDesc) emptyDesc.textContent = 'Katalog event dan kategori masih kosong. Silakan buat kategori dan posting event pertama Anda melalui Event Studio.';
			if (emptyStudioBtn) emptyStudioBtn.hidden = false;
			var rBtn = document.getElementById('elha-reset-filter-btn');
			if (rBtn) rBtn.hidden = true;
			return;
		}

		var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
		var scheduleRows = stateList ? stateList.querySelectorAll('.elha-schedule-row') : [];
		var visibleCount = 0;

		for (var r = 0; r < scheduleRows.length; r++) {
			var row = scheduleRows[r];
			var rowCat = row.getAttribute('data-event-cat');
			var rowSearch = row.getAttribute('data-event-search') || '';
			var catMatch = activeCategory === 'all' || rowCat === activeCategory;
			var searchMatch = !query || rowSearch.indexOf(query) !== -1;

			if (catMatch && searchMatch) {
				row.hidden = false;
				visibleCount++;
			} else {
				row.hidden = true;
			}
		}

		if (stateList) stateList.hidden = visibleCount === 0;
		if (stateEmpty) stateEmpty.hidden = visibleCount !== 0;
		if (visibleCount === 0) {
			if (emptyTitle) emptyTitle.textContent = 'Event Tidak Ditemukan';
			if (emptyDesc) emptyDesc.textContent = 'Belum ada jadwal event yang sesuai dengan filter kategori atau kata kunci pencarian tersebut.';
			if (emptyStudioBtn) emptyStudioBtn.hidden = true;
			var resetBtnEl = document.getElementById('elha-reset-filter-btn');
			if (resetBtnEl) resetBtnEl.hidden = false;
		}
	}

	if (searchInput) {
		searchInput.addEventListener('input', filterEventsCatalog);
	}

	var resetFilterBtn = document.getElementById('elha-reset-filter-btn');
	if (resetFilterBtn) {
		resetFilterBtn.addEventListener('click', function () {
			activeCategory = 'all';
			if (searchInput) searchInput.value = '';
			renderCategoryFilterTabs();
			filterEventsCatalog();
		});
	}

	var retryLoadBtn = document.getElementById('elha-retry-load-btn');
	if (retryLoadBtn) {
		retryLoadBtn.addEventListener('click', filterEventsCatalog);
	}

	function renderTiersForEvent(eventObj, preferredTierId) {
		if (!tiersContainer || !eventObj) {
			return;
		}
		tiersContainer.innerHTML = '';

		for (var i = 0; i < eventObj.tiers.length; i++) {
			var tier = eventObj.tiers[i];
			var isChecked = preferredTierId ? (tier.tier_id === preferredTierId) : (i === 0);

			var label = document.createElement('label');
			label.className = 'elha-tier-card' + (isChecked ? ' is-selected' : '');

			var radio = document.createElement('input');
			radio.type = 'radio';
			radio.name = 'elha_ticket_tier';
			radio.value = tier.tier_id;
			radio.checked = isChecked;
			radio.setAttribute('data-tier-name', tier.name);
			radio.setAttribute('data-tier-price', String(tier.price));
			radio.setAttribute('data-tier-quota', String(Math.max(1, parseInt(tier.quota || 200, 10))));

			var body = document.createElement('span');
			body.className = 'elha-tier-card-body';

			var top = document.createElement('span');
			top.className = 'elha-tier-card-top';

			var titleStrong = document.createElement('strong');
			titleStrong.textContent = tier.name;

			var priceSpan = document.createElement('span');
			priceSpan.className = 'elha-tier-card-price';
			priceSpan.textContent = formatRupiah(tier.price);

			top.appendChild(titleStrong);
			top.appendChild(priceSpan);

			var noteSmall = document.createElement('small');
			noteSmall.className = 'elha-tier-card-note';
			var quotaSuffix = tier.quota ? ' (Kuota: ' + tier.quota + ' Tiket)' : '';
			noteSmall.textContent = (tier.quota_note || 'Akses acara resmi') + quotaSuffix;

			body.appendChild(top);
			body.appendChild(noteSmall);

			label.appendChild(radio);
			label.appendChild(body);
			tiersContainer.appendChild(label);

			radio.addEventListener('change', function () {
				var allCards = tiersContainer.querySelectorAll('.elha-tier-card');
				for (var c = 0; c < allCards.length; c++) {
					var rInput = allCards[c].querySelector('input[type="radio"]');
					allCards[c].classList.toggle('is-selected', Boolean(rInput && rInput.checked));
				}
				updateStubCalculation();
			});
		}

		var summaryVenue = document.getElementById('elha-summary-venue');
		var summaryDate = document.getElementById('elha-summary-date');
		if (summaryVenue) summaryVenue.textContent = eventObj.venue;
		if (summaryDate) summaryDate.textContent = eventObj.date_label + ' | ' + eventObj.time_label;

		updateStubCalculation();
	}

	function getSelectedTierData() {
		var checkedRadio = tiersContainer ? tiersContainer.querySelector('input[name="elha_ticket_tier"]:checked') : null;
		if (!checkedRadio && tiersContainer) {
			checkedRadio = tiersContainer.querySelector('input[name="elha_ticket_tier"]');
		}
		if (!checkedRadio) {
			return { name: '-', price: 0, quota: 200 };
		}
		return {
			name: checkedRadio.getAttribute('data-tier-name') || 'Tiket',
			price: parseInt(checkedRadio.getAttribute('data-tier-price') || '0', 10),
			quota: Math.max(1, parseInt(checkedRadio.getAttribute('data-tier-quota') || '200', 10))
		};
	}

	function updateStubCalculation() {
		var eventId = eventSelect ? eventSelect.value : (config.events[0] ? config.events[0].id : '');
		var eventObj = findEventById(eventId);
		var tierData = getSelectedTierData();
		var maxAllowed = Math.max(1, tierData.quota || 200);
		if (qtyInput) {
			qtyInput.max = String(maxAllowed);
		}
		var rawQty = qtyInput ? parseInt(qtyInput.value || '1', 10) : 1;
		var qty = Math.max(1, Math.min(maxAllowed, isNaN(rawQty) ? 1 : rawQty));
		if (qtyInput && rawQty > maxAllowed) {
			qtyInput.value = String(maxAllowed);
		}

		var subtotal = tierData.price * qty;
		var discountAmount = Math.round(subtotal * discountRate);
		var finalTotal = Math.max(0, subtotal - discountAmount);

		var stubCode = document.getElementById('elha-stub-code');
		var stubEventTitle = document.getElementById('elha-stub-event-title');
		var stubVenue = document.getElementById('elha-stub-venue');
		var stubDate = document.getElementById('elha-stub-date');
		var stubTierName = document.getElementById('elha-stub-tier-name');
		var stubUnitPrice = document.getElementById('elha-stub-unit-price');
		var stubQty = document.getElementById('elha-stub-qty');
		var stubDiscountRow = document.getElementById('elha-stub-discount-row');
		var stubDiscount = document.getElementById('elha-stub-discount');
		var stubTotal = document.getElementById('elha-stub-total');

		if (!eventObj) {
			if (stubCode) stubCode.textContent = 'EVT-000';
			if (stubEventTitle) stubEventTitle.textContent = 'Belum Ada Event Aktif';
			if (stubVenue) stubVenue.textContent = '-';
			if (stubDate) stubDate.textContent = '-';
			if (stubTierName) stubTierName.textContent = '-';
			if (stubUnitPrice) stubUnitPrice.textContent = 'Rp 0';
			if (stubQty) stubQty.textContent = '0 Tiket';
			if (stubDiscountRow) stubDiscountRow.hidden = true;
			if (stubTotal) stubTotal.textContent = 'Rp 0';
			if (submitCheckoutBtn) submitCheckoutBtn.textContent = 'Belum Ada Event Tersedia';
			return;
		}

		if (stubCode) stubCode.textContent = eventObj.code;
		if (stubEventTitle) stubEventTitle.textContent = eventObj.title;
		if (stubVenue) stubVenue.textContent = eventObj.venue;
		if (stubDate) stubDate.textContent = eventObj.date_label + ' (' + eventObj.time_label + ')';
		if (stubTierName) stubTierName.textContent = tierData.name;
		if (stubUnitPrice) stubUnitPrice.textContent = formatRupiah(tierData.price);
		if (stubQty) stubQty.textContent = qty + ' Tiket';

		if (stubDiscountRow && stubDiscount) {
			if (discountAmount > 0) {
				stubDiscountRow.hidden = false;
				stubDiscount.textContent = '-' + formatRupiah(discountAmount);
			} else {
				stubDiscountRow.hidden = true;
			}
		}

		if (stubTotal) stubTotal.textContent = formatRupiah(finalTotal);
		if (submitCheckoutBtn) {
			submitCheckoutBtn.textContent = 'Pesan & Terbitkan E-Tiket (' + formatRupiah(finalTotal) + ')';
		}
	}

	if (eventSelect) {
		eventSelect.addEventListener('change', function () {
			renderTiersForEvent(findEventById(this.value), null);
		});
	}

	if (qtyMinusBtn && qtyInput) {
		qtyMinusBtn.addEventListener('click', function () {
			qtyInput.value = String(Math.max(1, parseInt(qtyInput.value || '1', 10) - 1));
			updateStubCalculation();
		});
	}

	if (qtyPlusBtn && qtyInput) {
		qtyPlusBtn.addEventListener('click', function () {
			var tierData = getSelectedTierData();
			var maxAllowed = Math.max(1, tierData.quota || 200);
			qtyInput.value = String(Math.min(maxAllowed, parseInt(qtyInput.value || '1', 10) + 1));
			updateStubCalculation();
		});
	}

	if (qtyInput) {
		qtyInput.addEventListener('input', updateStubCalculation);
	}

	if (applyPromoBtn && promoInput && promoStatus) {
		applyPromoBtn.addEventListener('click', function () {
			var rawCode = promoInput.value.trim().toUpperCase();
			var activePromoCode = (config.settings.promo_code || 'KOMUNITAS10').trim().toUpperCase();
			var activePromoPct = Math.max(0, Math.min(90, parseInt(config.settings.promo_pct || 10, 10)));
			if (rawCode && (rawCode === activePromoCode || rawCode === 'PAMERAN26')) {
				discountRate = activePromoPct / 100;
				promoStatus.textContent = 'Promo ' + rawCode + ' aktif: diskon ' + activePromoPct + '% diterapkan.';
			} else if (!rawCode) {
				discountRate = 0;
				promoStatus.textContent = 'Masukkan kode promo terlebih dahulu.';
			} else {
				discountRate = 0;
				promoStatus.textContent = 'Gunakan kode ' + activePromoCode + ' untuk diskon ' + activePromoPct + '%.';
			}
			updateStubCalculation();
		});
	}

	var copySummaryBtn = document.getElementById('elha-copy-summary-btn');
	if (copySummaryBtn) {
		copySummaryBtn.addEventListener('click', function () {
			var evObj = findEventById(eventSelect ? eventSelect.value : config.events[0].id);
			var tierData = getSelectedTierData();
			var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value || '1', 10)) : 1;
			var total = Math.round(tierData.price * qty * (1 - discountRate));
			var summaryText = [
				'RINGKASAN TIKET eLHa',
				'Event: ' + evObj.title,
				'Jadwal: ' + evObj.date_label + ' (' + evObj.time_label + ')',
				'Lokasi: ' + evObj.venue,
				'Kategori: ' + tierData.name,
				'Jumlah: ' + qty + ' Tiket',
				'Total: ' + formatRupiah(total)
			].join('\n');

			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(summaryText);
			}
			var originalText = copySummaryBtn.textContent;
			copySummaryBtn.textContent = 'Ringkasan Berhasil Disalin';
			setTimeout(function () {
				copySummaryBtn.textContent = originalText;
			}, 2000);
		});
	}

	function openModal(modalId, triggerEl) {
		var modal = document.getElementById(modalId);
		if (!modal) return;
		lastFocusedElement = triggerEl || document.activeElement;
		modal.hidden = false;
		var closeBtn = modal.querySelector('.elha-modal-close');
		if (closeBtn) closeBtn.focus();
	}

	function closeModal(modalId) {
		var modal = document.getElementById(modalId);
		if (!modal) return;
		modal.hidden = true;
		if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
			lastFocusedElement.focus();
		}
	}

	var closeModalBtns = app.querySelectorAll('[data-close-modal]');
	for (var cm = 0; cm < closeModalBtns.length; cm++) {
		closeModalBtns[cm].addEventListener('click', function () {
			closeModal(this.getAttribute('data-close-modal'));
		});
	}

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			closeMobileDrawer();
			var openModals = app.querySelectorAll('.elha-modal-backdrop:not([hidden])');
			for (var m = 0; m < openModals.length; m++) {
				closeModal(openModals[m].id);
			}
		}
	});

	function renderSvgBarcode(codeStr) {
		var bars = '';
		var x = 6;
		for (var i = 0; i < codeStr.length; i++) {
			var charCode = codeStr.charCodeAt(i);
			var w1 = (charCode % 3) + 1.5;
			var w2 = ((charCode >> 2) % 3) + 1;
			bars += '<rect x="' + x + '" y="4" width="' + w1 + '" height="38" fill="#0B1E3B"/>';
			x += w1 + 2.5;
			bars += '<rect x="' + x + '" y="4" width="' + w2 + '" height="38" fill="#0B1E3B"/>';
			x += w2 + 3;
		}
		return '<svg width="' + (x + 6) + '" height="46" viewBox="0 0 ' + (x + 6) + ' 46" xmlns="http://www.w3.org/2000/svg">' + bars + '</svg>';
	}

	var checkoutForm = document.getElementById('elha-ticket-checkout-form');
	var checkoutFeedback = document.getElementById('elha-checkout-feedback');

	function generateBookingCode() {
		var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		var suffix = '';
		for (var i = 0; i < 4; i++) {
			suffix += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return 'ELHA-2611-' + suffix;
	}

	function buildWhatsAppOrderText(order) {
		var lines = [
			'Halo ' + config.settings.whatsapp_admin_lbl + ',',
			'Saya ingin mengonfirmasi E-Tiket dengan rincian berikut:',
			'',
			'Kode Booking E-Tiket: ' + order.code,
			'Event: ' + order.eventTitle,
			'Jadwal: ' + order.eventDate,
			'Lokasi: ' + order.eventVenue,
			'Kategori Tiket: ' + order.tierName,
			'Jumlah: ' + order.qty + ' Tiket',
			'Total Pembayaran: ' + order.totalFormatted,
			'',
			'Pemegang E-Tiket:',
			'Nama: ' + order.buyerName,
			'No. Telepon/WA: ' + order.buyerPhone
		];
		if (order.buyerNotes) {
			lines.push('Catatan: ' + order.buyerNotes);
		}
		lines.push('', 'Mohon informasi instruksi pembayaran untuk mengaktifkan E-Tiket ini. Terima kasih.');
		return lines.join('\n');
	}

	if (checkoutForm) {
		checkoutForm.addEventListener('submit', function (e) {
			e.preventDefault();

			var buyerNameInput = document.getElementById('elha-buyer-name');
			var buyerPhoneInput = document.getElementById('elha-buyer-phone');
			var buyerNotesInput = document.getElementById('elha-buyer-notes');

			var buyerName = buyerNameInput ? buyerNameInput.value.trim() : '';
			var buyerPhone = buyerPhoneInput ? buyerPhoneInput.value.trim() : '';
			var buyerNotes = buyerNotesInput ? buyerNotesInput.value.trim() : '';

			if (!buyerName || !buyerPhone) {
				if (checkoutFeedback) {
					checkoutFeedback.hidden = false;
					checkoutFeedback.textContent = 'Mohon isi Nama Lengkap dan Nomor Telepon/WhatsApp Anda terlebih dahulu.';
				}
				if (!buyerName && buyerNameInput) buyerNameInput.focus();
				else if (!buyerPhone && buyerPhoneInput) buyerPhoneInput.focus();
				return;
			}

			if (checkoutFeedback) {
				checkoutFeedback.hidden = true;
			}

			var evObj = findEventById(eventSelect ? eventSelect.value : config.events[0].id);
			var tierData = getSelectedTierData();
			var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value || '1', 10)) : 1;
			var subtotal = tierData.price * qty;
			var finalTotal = Math.round(subtotal * (1 - discountRate));
			var bookingCode = generateBookingCode();

			var order = {
				code: bookingCode,
				buyerName: buyerName,
				buyerPhone: buyerPhone,
				buyerNotes: buyerNotes,
				eventTitle: evObj.title,
				eventDate: evObj.date_label + ' (' + evObj.time_label + ')',
				eventVenue: evObj.venue,
				tierName: tierData.name,
				qty: qty,
				totalAmount: finalTotal,
				totalFormatted: formatRupiah(finalTotal)
			};

			var statusHeading = document.getElementById('elha-receipt-status-heading');
			var statusSub = document.getElementById('elha-receipt-status-sub');
			var etEventName = document.getElementById('elha-eticket-event-name');
			var etVenueDate = document.getElementById('elha-eticket-venue-date');
			var etBuyer = document.getElementById('elha-eticket-buyer');
			var etTier = document.getElementById('elha-eticket-tier');
			var etTotal = document.getElementById('elha-eticket-total');
			var etBarcode = document.getElementById('elha-eticket-barcode');
			var etSerial = document.getElementById('elha-eticket-serial');
			var waTextarea = document.getElementById('elha-wa-preview-text');
			var waDirectLink = document.getElementById('elha-wa-direct-link');

			if (statusHeading) statusHeading.textContent = bookingCode;
			if (statusSub) statusSub.textContent = 'Menunggu Konfirmasi Pembayaran';
			if (etEventName) etEventName.textContent = order.eventTitle;
			if (etVenueDate) etVenueDate.textContent = order.eventVenue + ' | ' + order.eventDate;
			if (etBuyer) etBuyer.textContent = order.buyerName + ' (' + order.buyerPhone + ')';
			if (etTier) etTier.textContent = order.qty + 'x ' + order.tierName;
			if (etTotal) etTotal.textContent = order.totalFormatted;
			if (etBarcode) etBarcode.innerHTML = renderSvgBarcode(bookingCode + '-' + evObj.code);
			if (etSerial) etSerial.textContent = bookingCode + ' | ' + evObj.code;

			var waMessage = buildWhatsAppOrderText(order);
			if (waTextarea) waTextarea.value = waMessage;
			if (waDirectLink) {
				var cleanNumber = (config.settings.whatsapp_number || '6281234567890').replace(/[^0-9]/g, '');
				waDirectLink.href = 'https://wa.me/' + cleanNumber + '?text=' + encodeURIComponent(waMessage);
			}

			openModal('elha-receipt-modal', submitCheckoutBtn);
		});
	}

	var printEticketBtn = document.getElementById('elha-print-eticket-btn');
	if (printEticketBtn) {
		printEticketBtn.addEventListener('click', function () {
			window.print();
		});
	}

	var copyWaTextBtn = document.getElementById('elha-copy-wa-text-btn');
	if (copyWaTextBtn) {
		copyWaTextBtn.addEventListener('click', function () {
			var waTextarea = document.getElementById('elha-wa-preview-text');
			if (waTextarea && navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(waTextarea.value);
			}
			var prev = copyWaTextBtn.textContent;
			copyWaTextBtn.textContent = 'Rincian Disalin';
			setTimeout(function () {
				copyWaTextBtn.textContent = prev;
			}, 2000);
		});
	}

	// Admin Dashboard & Event Studio (Inline Full Page)
	var openAdminBtn = document.getElementById('elha-open-admin-btn');
	var mobileAdminBtn = document.getElementById('elha-mobile-admin-btn');
	var adminCountEl = document.getElementById('elha-admin-count');
	var adminListEl = document.getElementById('elha-admin-events-list');
	var adminSearchInput = document.getElementById('elha-admin-search');
	var adminNewBtn = document.getElementById('elha-admin-new-btn');
	var adminNewBtnTop = document.getElementById('elha-admin-new-btn-top');
	var adminForm = document.getElementById('elha-admin-event-form');
	var adminFormHeading = document.getElementById('elha-admin-form-heading');
	var adminFeedback = document.getElementById('elha-admin-feedback');
	var quotaTableWrap = document.getElementById('elha-admin-quota-table-wrap');
	var exportJsonBtn = document.getElementById('elha-export-json-btn');
	var exportJsonBtnTab = document.getElementById('elha-export-json-btn-tab');
	var importJsonInput = document.getElementById('elha-import-json-input');
	var resetDefaultBtn = document.getElementById('elha-reset-default-btn');
	var dataFeedback = document.getElementById('elha-data-feedback');

	var bannerFileInput = document.getElementById('elha-ev-banner-file');
	var bannerUrlInput = document.getElementById('elha-ev-banner-url');
	var bannerPreviewWrap = document.getElementById('elha-banner-preview-wrap');
	var bannerPreviewImg = document.getElementById('elha-banner-preview-img');
	var clearBannerBtn = document.getElementById('elha-clear-banner-btn');

	var tiersAdminContainer = document.getElementById('elha-admin-tiers-container');
	var addTierBtn = document.getElementById('elha-add-tier-btn');
	var tierCountLbl = document.getElementById('elha-tier-count-lbl');

	var statEventsEl = document.getElementById('elha-stat-events');
	var statTiersEl = document.getElementById('elha-stat-tiers');
	var statQuotaEl = document.getElementById('elha-stat-quota');
	var statWaEl = document.getElementById('elha-stat-wa');

	var settingsForm = document.getElementById('elha-admin-settings-form');
	var setBrandInput = document.getElementById('elha-set-brand');
	var adminWaInput = document.getElementById('elha-admin-wa');
	var setAdminLblInput = document.getElementById('elha-set-admin-lbl');
	var setPromoCodeInput = document.getElementById('elha-set-promo-code');
	var setPromoPctInput = document.getElementById('elha-set-promo-pct');
	var settingsFeedback = document.getElementById('elha-settings-feedback');

	function updateAdminStats() {
		var totalEvents = config.events.length;
		var totalTiers = 0;
		var totalQuota = 0;
		for (var i = 0; i < config.events.length; i++) {
			var ev = config.events[i];
			if (Array.isArray(ev.tiers)) {
				totalTiers += ev.tiers.length;
				totalQuota += getEventTotalQuota(ev);
			}
		}
		if (statEventsEl) statEventsEl.textContent = String(totalEvents);
		if (statTiersEl) statTiersEl.textContent = String(totalTiers);
		if (statQuotaEl) statQuotaEl.textContent = totalQuota.toLocaleString('id-ID') + ' Tiket';
		if (statWaEl) statWaEl.textContent = '+' + (config.settings.whatsapp_number || '6281234567890');
	}

	function syncSettingsFormFields() {
		if (setBrandInput) setBrandInput.value = config.settings.brand_name || 'eLHa Event';
		if (adminWaInput) adminWaInput.value = config.settings.whatsapp_number || '6281234567890';
		if (setAdminLblInput) setAdminLblInput.value = config.settings.whatsapp_admin_lbl || 'Admin eLHa Event';
		if (setPromoCodeInput) setPromoCodeInput.value = config.settings.promo_code || 'KOMUNITAS10';
		if (setPromoPctInput) setPromoPctInput.value = String(config.settings.promo_pct != null ? config.settings.promo_pct : 10);
	}

	function normalizeBannerUrl(rawUrl) {
		var val = String(rawUrl || '').trim();
		if (!val || val.indexOf('data:') === 0) return val;
		var driveMatch =
			val.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
			val.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
			val.match(/\/d\/([a-zA-Z0-9_-]+)/);
		if (driveMatch && driveMatch[1] && (val.indexOf('drive.google.com') !== -1 || val.indexOf('docs.google.com') !== -1)) {
			return 'https://drive.google.com/thumbnail?id=' + driveMatch[1] + '&sz=w1200';
		}
		return val;
	}

	function setBannerPreview(src) {
		currentBannerData = normalizeBannerUrl(src);
		if (bannerPreviewWrap && bannerPreviewImg) {
			if (currentBannerData) {
				bannerPreviewImg.src = currentBannerData;
				bannerPreviewWrap.hidden = false;
			} else {
				bannerPreviewImg.src = '';
				bannerPreviewWrap.hidden = true;
			}
		}
	}

	function compressBannerFile(file, callback) {
		var reader = new FileReader();
		reader.onload = function (ev) {
			var img = new Image();
			img.onload = function () {
				var maxW = 1200;
				var maxH = 600;
				var w = img.width;
				var h = img.height;
				if (w > maxW || h > maxH) {
					var ratio = Math.min(maxW / w, maxH / h);
					w = Math.round(w * ratio);
					h = Math.round(h * ratio);
				}
				var canvas = document.createElement('canvas');
				canvas.width = w;
				canvas.height = h;
				var ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, w, h);
				var dataUrl = canvas.toDataURL('image/jpeg', 0.82);
				callback(dataUrl);
			};
			img.onerror = function () {
				callback(ev.target.result);
			};
			img.src = ev.target.result;
		};
		reader.readAsDataURL(file);
	}

	if (bannerFileInput) {
		bannerFileInput.addEventListener('change', function () {
			var file = this.files && this.files[0];
			if (!file) return;
			if (file.size > 5 * 1024 * 1024) {
				if (adminFeedback) {
					adminFeedback.hidden = false;
					adminFeedback.textContent = 'Ukuran file terlalu besar. Gunakan gambar maksimal 5 MB.';
				}
				return;
			}
			compressBannerFile(file, function (compressed) {
				if (bannerUrlInput) bannerUrlInput.value = '';
				setBannerPreview(compressed);
			});
		});
	}

	if (bannerUrlInput) {
		bannerUrlInput.addEventListener('input', function () {
			var val = this.value.trim();
			setBannerPreview(val);
		});
	}

	if (clearBannerBtn) {
		clearBannerBtn.addEventListener('click', function () {
			if (bannerFileInput) bannerFileInput.value = '';
			if (bannerUrlInput) bannerUrlInput.value = '';
			setBannerPreview('');
		});
	}

	function syncTotalQuotaLabelFromTiers() {
		if (!tiersAdminContainer) return;
		var qInputs = tiersAdminContainer.querySelectorAll('.elha-tier-quota-input');
		var total = 0;
		for (var i = 0; i < qInputs.length; i++) {
			total += Math.max(0, parseInt(qInputs[i].value || '0', 10));
		}
		var quotaField = document.getElementById('elha-ev-quota');
		if (quotaField) {
			quotaField.value = total + ' Tiket Tersedia';
		}
		if (tierCountLbl) {
			tierCountLbl.textContent = String(qInputs.length);
		}
	}

	function appendAdminTierRow(tierData) {
		if (!tiersAdminContainer) return;
		var row = document.createElement('div');
		row.className = 'elha-admin-tier-card';
		var idx = tiersAdminContainer.children.length + 1;

		row.innerHTML =
			'<div class="elha-admin-tier-head">' +
			'<span>Kategori Tiket #' + idx + '</span>' +
			'<button type="button" class="elha-btn elha-btn-secondary elha-btn-sm elha-remove-tier-btn">Hapus</button>' +
			'</div>' +
			'<div class="elha-admin-tier-fields">' +
			'<div class="elha-tier-field-group">' +
			'<small>Nama Kategori Tiket</small>' +
			'<input type="text" class="elha-input elha-tier-name-input" placeholder="Misal: Tiket Reguler" />' +
			'</div>' +
			'<div class="elha-tier-field-group">' +
			'<small>Harga (Rp)</small>' +
			'<input type="number" class="elha-input elha-mono-text elha-tier-price-input" min="0" placeholder="50000" />' +
			'</div>' +
			'<div class="elha-tier-field-group">' +
			'<small>Batasan Kuota (Tiket)</small>' +
			'<input type="number" class="elha-input elha-mono-text elha-tier-quota-input" min="1" placeholder="200" />' +
			'</div>' +
			'<div class="elha-tier-field-group elha-tier-note-input">' +
			'<small>Keterangan Fasilitas</small>' +
			'<input type="text" class="elha-input elha-tier-note-field" placeholder="Akses area utama acara" />' +
			'</div>' +
			'</div>';

		row.querySelector('.elha-tier-name-input').value = tierData && tierData.name ? tierData.name : '';
		row.querySelector('.elha-tier-price-input').value = tierData && tierData.price != null ? String(tierData.price) : '';
		row.querySelector('.elha-tier-quota-input').value = tierData && tierData.quota != null ? String(tierData.quota) : '200';
		row.querySelector('.elha-tier-note-field').value = tierData && tierData.quota_note ? tierData.quota_note : '';

		row.querySelector('.elha-tier-quota-input').addEventListener('input', syncTotalQuotaLabelFromTiers);
		row.querySelector('.elha-remove-tier-btn').addEventListener('click', function () {
			if (tiersAdminContainer.children.length <= 1) {
				if (adminFeedback) {
					adminFeedback.hidden = false;
					adminFeedback.textContent = 'Minimal harus ada 1 kategori tiket.';
				}
				return;
			}
			tiersAdminContainer.removeChild(row);
			var heads = tiersAdminContainer.querySelectorAll('.elha-admin-tier-head span');
			for (var h = 0; h < heads.length; h++) {
				heads[h].textContent = 'Kategori Tiket #' + (h + 1);
			}
			syncTotalQuotaLabelFromTiers();
		});

		tiersAdminContainer.appendChild(row);
		syncTotalQuotaLabelFromTiers();
	}

	if (addTierBtn) {
		addTierBtn.addEventListener('click', function () {
			appendAdminTierRow({ name: '', price: '', quota: 200, quota_note: '' });
		});
	}

	// Dashboard Tabs Switching
	var adminTabBtns = app.querySelectorAll('[data-admin-tab]');
	var adminPanes = {
		events: document.getElementById('elha-admin-pane-events'),
		quotas: document.getElementById('elha-admin-pane-quotas'),
		settings: document.getElementById('elha-admin-pane-settings'),
		data: document.getElementById('elha-admin-pane-data')
	};

	function switchAdminTab(targetTab) {
		for (var k = 0; k < adminTabBtns.length; k++) {
			var isAct = adminTabBtns[k].getAttribute('data-admin-tab') === targetTab;
			adminTabBtns[k].classList.toggle('is-active', isAct);
			adminTabBtns[k].setAttribute('aria-selected', isAct ? 'true' : 'false');
		}
		for (var key in adminPanes) {
			if (adminPanes[key]) {
				adminPanes[key].hidden = key !== targetTab;
			}
		}
	}

	for (var tb = 0; tb < adminTabBtns.length; tb++) {
		adminTabBtns[tb].addEventListener('click', function () {
			switchAdminTab(this.getAttribute('data-admin-tab'));
		});
	}

	function renderAdminQuotaTable() {
		if (!quotaTableWrap) return;
		if (config.events.length === 0) {
			quotaTableWrap.innerHTML = '<div class="elha-event-mini-summary">Belum ada event atau kategori tiket yang dibuat.</div>';
			return;
		}
		var html = '<table class="elha-quota-table"><thead><tr><th>Event</th><th>Kategori Event</th><th>Kategori Tiket</th><th>Harga</th><th>Batasan Kuota</th></tr></thead><tbody>';
		for (var i = 0; i < config.events.length; i++) {
			var ev = config.events[i];
			var tiers = Array.isArray(ev.tiers) ? ev.tiers : [];
			for (var t = 0; t < tiers.length; t++) {
				html += '<tr>' +
					'<td><strong>' + ev.title + '</strong></td>' +
					'<td>' + (ev.category_lbl || 'Umum') + '</td>' +
					'<td>' + tiers[t].name + '</td>' +
					'<td class="elha-mono-text">' + formatRupiah(tiers[t].price) + '</td>' +
					'<td class="elha-mono-text"><strong>' + (tiers[t].quota || 0) + ' Tiket</strong></td>' +
					'</tr>';
			}
		}
		html += '</tbody></table>';
		quotaTableWrap.innerHTML = html;
	}

	function renderAdminEventsList() {
		updateAdminStats();
		syncSettingsFormFields();
		renderAdminQuotaTable();
		if (!adminListEl) return;
		if (adminCountEl) adminCountEl.textContent = String(config.events.length);

		var q = adminSearchInput ? adminSearchInput.value.trim().toLowerCase() : '';
		adminListEl.innerHTML = '';

		if (config.events.length === 0) {
			adminListEl.innerHTML = '<div class="elha-event-mini-summary">Belum ada event. Isi form di samping untuk memposting event pertama.</div>';
			return;
		}

		for (var i = 0; i < config.events.length; i++) {
			var ev = config.events[i];
			if (q && (ev.title + ' ' + ev.code + ' ' + ev.category_lbl).toLowerCase().indexOf(q) === -1) {
				continue;
			}
			var totalQ = getEventTotalQuota(ev);
			var tierCount = Array.isArray(ev.tiers) ? ev.tiers.length : 0;
			var item = document.createElement('div');
			item.className = 'elha-admin-ev-item' + (ev.id === editingEventId ? ' is-editing' : '');
			item.innerHTML =
				'<div>' +
				'<strong></strong>' +
				'<small></small>' +
				'</div>' +
				'<div class="elha-admin-ev-actions">' +
				'<button type="button" class="elha-btn elha-btn-secondary elha-btn-sm" data-edit-ev="' + ev.id + '">Edit</button>' +
				'<button type="button" class="elha-btn elha-btn-secondary elha-btn-sm" data-dup-ev="' + ev.id + '">Duplikat</button>' +
				'<button type="button" class="elha-btn elha-btn-secondary elha-btn-sm" data-del-ev="' + ev.id + '">Hapus</button>' +
				'</div>';
			item.querySelector('strong').textContent = (ev.featured ? '[HERO] ' : '') + ev.title;
			item.querySelector('small').textContent = ev.code + ' \u2022 ' + ev.category_lbl + ' \u2022 ' + tierCount + ' Kategori (' + totalQ + ' Tiket)';

			item.querySelector('[data-edit-ev]').addEventListener('click', function () {
				loadEventIntoForm(this.getAttribute('data-edit-ev'));
			});
			item.querySelector('[data-dup-ev]').addEventListener('click', function () {
				duplicateEventById(this.getAttribute('data-dup-ev'));
			});
			item.querySelector('[data-del-ev]').addEventListener('click', function () {
				deleteEventById(this.getAttribute('data-del-ev'));
			});

			adminListEl.appendChild(item);
		}
	}

	if (adminSearchInput) {
		adminSearchInput.addEventListener('input', renderAdminEventsList);
	}

	function loadEventIntoForm(evId) {
		var evIdField = document.getElementById('elha-ev-id');
		var titleField = document.getElementById('elha-ev-title');
		var codeField = document.getElementById('elha-ev-code');
		var catField = document.getElementById('elha-ev-cat');
		var themeField = document.getElementById('elha-ev-theme');
		var dateField = document.getElementById('elha-ev-date');
		var timeField = document.getElementById('elha-ev-time');
		var venueField = document.getElementById('elha-ev-venue');
		var quotaField = document.getElementById('elha-ev-quota');
		var summaryField = document.getElementById('elha-ev-summary');
		var featField = document.getElementById('elha-ev-featured');

		if (tiersAdminContainer) tiersAdminContainer.innerHTML = '';
		if (bannerFileInput) bannerFileInput.value = '';

		if (!evId) {
			editingEventId = '';
			if (adminFormHeading) adminFormHeading.textContent = 'Posting Event Baru';
			if (evIdField) evIdField.value = '';
			if (titleField) titleField.value = '';
			if (codeField) codeField.value = 'EVT-' + Math.floor(101 + Math.random() * 890);
			if (catField) catField.value = '';
			if (themeField) themeField.value = 'terracotta';
			if (bannerUrlInput) bannerUrlInput.value = '';
			setBannerPreview('');
			if (dateField) dateField.value = '';
			if (timeField) timeField.value = '10.00 - 21.00 WIB';
			if (venueField) venueField.value = '';
			if (summaryField) summaryField.value = '';
			if (featField) featField.checked = config.events.length === 0;
			appendAdminTierRow({ name: 'Tiket Reguler', price: 50000, quota: 200, quota_note: 'Akses area utama acara' });
		} else {
			var ev = findEventById(evId);
			if (!ev) return;
			editingEventId = ev.id;
			if (adminFormHeading) adminFormHeading.textContent = 'Edit Event: ' + ev.code;
			if (evIdField) evIdField.value = ev.id;
			if (titleField) titleField.value = ev.title;
			if (codeField) codeField.value = ev.code;
			if (catField) catField.value = ev.category_lbl || ev.category || '';
			if (themeField) themeField.value = ev.poster_theme || 'terracotta';
			if (bannerUrlInput) {
				bannerUrlInput.value = ev.banner_image && ev.banner_image.indexOf('data:') !== 0 ? ev.banner_image : '';
			}
			setBannerPreview(ev.banner_image || '');
			if (dateField) dateField.value = ev.date_label;
			if (timeField) timeField.value = ev.time_label;
			if (venueField) venueField.value = ev.venue;
			if (summaryField) summaryField.value = ev.summary;
			if (featField) featField.checked = Boolean(ev.featured);
			if (Array.isArray(ev.tiers) && ev.tiers.length > 0) {
				for (var t = 0; t < ev.tiers.length; t++) {
					appendAdminTierRow(ev.tiers[t]);
				}
			} else {
				appendAdminTierRow({ name: 'Tiket Reguler', price: 50000, quota: 200, quota_note: 'Akses area utama acara' });
			}
			if (quotaField && ev.quota_label) {
				quotaField.value = ev.quota_label;
			}
		}
		renderAdminEventsList();
	}

	function duplicateEventById(evId) {
		var src = findEventById(evId);
		if (!src) return;
		var copy = JSON.parse(JSON.stringify(src));
		copy.id = 'evt-' + Date.now();
		copy.code = src.code + '-COPY';
		copy.title = src.title + ' (Salinan)';
		copy.featured = false;
		config.events.unshift(copy);
		saveConfigToLocal();
		renderAllEventsUI();
		loadEventIntoForm(copy.id);
		if (adminFeedback) {
			adminFeedback.hidden = false;
			adminFeedback.textContent = 'Event "' + src.title + '" berhasil diduplikat.';
		}
	}

	function deleteEventById(evId) {
		var nextEvents = [];
		for (var i = 0; i < config.events.length; i++) {
			if (config.events[i].id !== evId) {
				nextEvents.push(config.events[i]);
			}
		}
		config.events = nextEvents;
		saveConfigToLocal();
		renderAllEventsUI();
		loadEventIntoForm('');
		if (adminFeedback) {
			adminFeedback.hidden = false;
			adminFeedback.textContent = 'Event berhasil dihapus.';
		}
	}

	function openAdminStudio(forceCreateNew) {
		if (openAdminBtn) openAdminBtn.hidden = false;
		if (mobileAdminBtn) mobileAdminBtn.hidden = false;
		switchView('admin', true);
		switchAdminTab('events');
		if (forceCreateNew || config.events.length === 0) {
			loadEventIntoForm('');
			var titleField = document.getElementById('elha-ev-title');
			if (titleField) {
				setTimeout(function () { titleField.focus(); }, 120);
			}
		} else {
			loadEventIntoForm(config.events[0].id);
		}
	}

	function triggerCreateNewEvent() {
		switchView('admin', false);
		switchAdminTab('events');
		loadEventIntoForm('');
		if (adminForm) {
			adminForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
		var titleField = document.getElementById('elha-ev-title');
		if (titleField) {
			setTimeout(function () { titleField.focus(); }, 150);
		}
	}

	// Unlock Admin Studio button only via ?admin=elha (or ?admin=1) URL parameter or Ctrl+Shift+E shortcut
	(function checkAdminAccess() {
		try {
			var params = new URLSearchParams(window.location.search);
			var adminParam = params.get('admin');
			if (adminParam === 'elha' || adminParam === '1') {
				if (openAdminBtn) openAdminBtn.hidden = false;
				if (mobileAdminBtn) mobileAdminBtn.hidden = false;
			}
		} catch (e) {}

		document.addEventListener('keydown', function (e) {
			if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
				e.preventDefault();
				openAdminStudio(false);
			}
		});
	})();

	if (openAdminBtn) {
		openAdminBtn.addEventListener('click', function () {
			openAdminStudio(false);
		});
	}

	if (mobileAdminBtn) {
		mobileAdminBtn.addEventListener('click', function () {
			openAdminStudio(false);
		});
	}

	if (emptyStudioBtn) {
		emptyStudioBtn.addEventListener('click', function () {
			openAdminStudio(true);
		});
	}

	if (adminNewBtn) {
		adminNewBtn.addEventListener('click', triggerCreateNewEvent);
	}

	if (adminNewBtnTop) {
		adminNewBtnTop.addEventListener('click', triggerCreateNewEvent);
	}

	if (adminForm) {
		adminForm.addEventListener('submit', function (e) {
			e.preventDefault();

			var evId = document.getElementById('elha-ev-id').value.trim();
			var title = document.getElementById('elha-ev-title').value.trim();
			var code = document.getElementById('elha-ev-code').value.trim() || 'EVT-101';
			var catRaw = document.getElementById('elha-ev-cat').value.trim() || 'Umum';
			var catSlug = slugifyCategory(catRaw);
			var pTheme = document.getElementById('elha-ev-theme') ? document.getElementById('elha-ev-theme').value : 'terracotta';
			var dateLbl = document.getElementById('elha-ev-date').value.trim() || 'Jadwal Menyusul';
			var timeLbl = document.getElementById('elha-ev-time').value.trim() || '10.00 - 21.00 WIB';
			var venue = document.getElementById('elha-ev-venue').value.trim() || 'Lokasi Venue';
			var quotaInputVal = document.getElementById('elha-ev-quota').value.trim();
			var summary = document.getElementById('elha-ev-summary').value.trim() || 'Acara resmi eLHa Event.';
			var isFeat = document.getElementById('elha-ev-featured').checked;

			if (!title) {
				if (adminFeedback) {
					adminFeedback.hidden = false;
					adminFeedback.textContent = 'Mohon isi Judul Event terlebih dahulu.';
				}
				return;
			}

			var tiers = [];
			var totalTierQuota = 0;
			var tierCards = tiersAdminContainer ? tiersAdminContainer.querySelectorAll('.elha-admin-tier-card') : [];
			for (var t = 0; t < tierCards.length; t++) {
				var tName = tierCards[t].querySelector('.elha-tier-name-input').value.trim();
				var tPrice = parseInt(tierCards[t].querySelector('.elha-tier-price-input').value || '0', 10);
				var tQuota = Math.max(1, parseInt(tierCards[t].querySelector('.elha-tier-quota-input').value || '200', 10));
				var tNote = tierCards[t].querySelector('.elha-tier-note-field').value.trim();
				if (tName) {
					totalTierQuota += tQuota;
					tiers.push({
						tier_id: 'tier-' + Date.now() + '-' + (t + 1),
						name: tName,
						price: Math.max(0, tPrice),
						quota: tQuota,
						quota_note: tNote || 'Akses acara resmi'
					});
				}
			}

			if (tiers.length === 0) {
				totalTierQuota = 200;
				tiers.push({
					tier_id: 'tier-' + Date.now() + '-1',
					name: 'Tiket Reguler',
					price: 50000,
					quota: 200,
					quota_note: 'Akses area utama acara'
				});
			}

			if (isFeat) {
				for (var f = 0; f < config.events.length; f++) {
					config.events[f].featured = false;
				}
			}

			var finalBanner = normalizeBannerUrl((bannerUrlInput && bannerUrlInput.value.trim()) || currentBannerData || '');

			var newEventObj = {
				id: evId || ('evt-' + Date.now()),
				code: code,
				title: title,
				category: catSlug,
				category_lbl: catRaw,
				featured: isFeat || config.events.length === 0,
				date_label: dateLbl,
				time_label: timeLbl,
				venue: venue,
				quota_label: quotaInputVal || (totalTierQuota + ' Tiket Tersedia'),
				poster_theme: pTheme || 'terracotta',
				banner_image: finalBanner,
				summary: summary,
				tiers: tiers
			};

			if (evId) {
				for (var idx = 0; idx < config.events.length; idx++) {
					if (config.events[idx].id === evId) {
						config.events[idx] = newEventObj;
						break;
					}
				}
			} else {
				config.events.unshift(newEventObj);
			}

			saveConfigToLocal();
			renderAllEventsUI();
			loadEventIntoForm(newEventObj.id);

			if (adminFeedback) {
				adminFeedback.hidden = false;
				adminFeedback.textContent = 'Event "' + title + '" (' + tiers.length + ' kategori, total ' + totalTierQuota + ' tiket) berhasil diposting!';
			}
		});
	}

	if (settingsForm) {
		settingsForm.addEventListener('submit', function (e) {
			e.preventDefault();
			var waVal = adminWaInput ? adminWaInput.value.replace(/[^0-9]/g, '') : '';
			if (setBrandInput && setBrandInput.value.trim()) {
				config.settings.brand_name = setBrandInput.value.trim();
			}
			if (waVal) {
				config.settings.whatsapp_number = waVal;
			}
			if (setAdminLblInput && setAdminLblInput.value.trim()) {
				config.settings.whatsapp_admin_lbl = setAdminLblInput.value.trim();
			}
			if (setPromoCodeInput && setPromoCodeInput.value.trim()) {
				config.settings.promo_code = setPromoCodeInput.value.trim().toUpperCase();
			}
			if (setPromoPctInput) {
				config.settings.promo_pct = Math.max(0, Math.min(90, parseInt(setPromoPctInput.value || '10', 10)));
			}
			saveConfigToLocal();
			renderAllEventsUI();
			updateAdminStats();
			if (settingsFeedback) {
				settingsFeedback.hidden = false;
				settingsFeedback.textContent = 'Pengaturan brand, WhatsApp, dan kode promo berhasil disimpan.';
			}
		});
	}

	function triggerJsonDownload() {
		var dataStr = JSON.stringify(config, null, 2);
		var blob = new Blob([dataStr], { type: 'application/json' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'events.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	if (exportJsonBtn) exportJsonBtn.addEventListener('click', triggerJsonDownload);
	if (exportJsonBtnTab) exportJsonBtnTab.addEventListener('click', triggerJsonDownload);

	if (importJsonInput) {
		importJsonInput.addEventListener('change', function () {
			var file = this.files && this.files[0];
			if (!file) return;
			var reader = new FileReader();
			reader.onload = function (ev) {
				try {
					var parsed = JSON.parse(ev.target.result);
					if (parsed && Array.isArray(parsed.events)) {
						config = parsed;
						if (!config.settings) config.settings = JSON.parse(JSON.stringify(defaultConfig.settings));
						saveConfigToLocal();
						renderAllEventsUI();
						loadEventIntoForm(config.events[0] ? config.events[0].id : '');
						if (dataFeedback) {
							dataFeedback.hidden = false;
							dataFeedback.textContent = 'File JSON berhasil diimpor (' + config.events.length + ' event dimuat).';
						}
					}
				} catch (err) {
					if (dataFeedback) {
						dataFeedback.hidden = false;
						dataFeedback.textContent = 'Format file JSON tidak valid.';
					}
				}
			};
			reader.readAsText(file);
		});
	}

	if (resetDefaultBtn) {
		resetDefaultBtn.addEventListener('click', function () {
			try {
				localStorage.removeItem(STORAGE_KEY);
				localStorage.removeItem('elha_ticketing_data_v1');
			} catch (e) {}
			config = JSON.parse(JSON.stringify(defaultConfig));
			saveConfigToLocal();
			renderAllEventsUI();
			loadEventIntoForm('');
			if (dataFeedback) {
				dataFeedback.hidden = false;
				dataFeedback.textContent = 'Seluruh daftar event dan kategori berhasil dikosongkan.';
			}
		});
	}

	// Load initial data from localStorage or assets/data/events.json
	function initData() {
		var loadedLocal = false;
		try {
			localStorage.removeItem('elha_ticketing_data_v1');
			var savedData = localStorage.getItem(STORAGE_KEY);
			if (savedData) {
				var parsed = JSON.parse(savedData);
				if (parsed && Array.isArray(parsed.events)) {
					config = parsed;
					loadedLocal = true;
				}
			}
		} catch (e) {}

		renderAllEventsUI();

		if (!loadedLocal && window.fetch) {
			fetch('assets/data/events.json')
				.then(function (res) { return res.ok ? res.json() : null; })
				.then(function (jsonData) {
					if (jsonData && Array.isArray(jsonData.events)) {
						config = jsonData;
						renderAllEventsUI();
					}
				})
				.catch(function () {});
		}
	}

	// Floating Back to Top button
	var backToTopBtn = document.getElementById('elha-back-to-top');
	if (backToTopBtn) {
		window.addEventListener('scroll', function () {
			if (window.scrollY > 220) {
				backToTopBtn.hidden = false;
			} else {
				backToTopBtn.hidden = true;
			}
		}, { passive: true });

		backToTopBtn.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	initData();
})();

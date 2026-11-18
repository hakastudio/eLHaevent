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

	function getBasePath() {
		var p = window.location.pathname.replace(/\/adminelha\/?(index\.html)?$/i, '').replace(/\/index\.html$/i, '').replace(/\/+$/, '');
		return p || '';
	}

	function switchView(targetView, scrollToTop) {
		var mode = (targetView === 'checkout' || targetView === 'admin') ? targetView : 'landing';
		app.setAttribute('data-active-view', mode);

		if (viewLanding) viewLanding.hidden = mode !== 'landing';
		if (viewCheckout) viewCheckout.hidden = mode !== 'checkout';
		if (viewAdmin) viewAdmin.hidden = mode !== 'admin';
		if (faqSection) faqSection.hidden = mode === 'admin';

		try {
			if (window.history && window.history.replaceState) {
				var base = getBasePath();
				if (mode === 'admin') {
					window.history.replaceState(null, '', base + '/adminelha');
				} else if (/\/adminelha\/?$/i.test(window.location.pathname)) {
					window.history.replaceState(null, '', (base || '/') + window.location.search);
				}
			}
		} catch (e) {}

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

	var ID_MONTHS_MAP = {
		januari: 0, jan: 0,
		februari: 1, feb: 1,
		maret: 2, mar: 2,
		april: 3, apr: 3,
		mei: 4, may: 4,
		juni: 5, jun: 5,
		juli: 6, jul: 6,
		agustus: 7, ags: 7, agt: 7, aug: 7,
		september: 8, sep: 8, sept: 8,
		oktober: 9, okt: 9, oct: 9,
		november: 10, nov: 10,
		desember: 11, des: 11, dec: 11
	};

	function parseEventEndDate(dateStr) {
		if (!dateStr || typeof dateStr !== 'string') return null;
		var s = dateStr.trim();

		// ISO YYYY-MM-DD
		var isoMatch = s.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
		if (isoMatch) {
			return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10), 23, 59, 59, 999);
		}

		// DD/MM/YYYY
		var dmyMatch = s.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
		if (dmyMatch) {
			return new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10), 23, 59, 59, 999);
		}

		// Range or text (take last date in range)
		var target = s;
		if (target.indexOf('-') !== -1) {
			var parts = target.split('-');
			target = parts[parts.length - 1].trim();
		} else if (/sampai|s\/d|hingga/i.test(target)) {
			var parts2 = target.split(/sampai|s\/d|hingga/i);
			target = parts2[parts2.length - 1].trim();
		}

		// Match day, month word, year (e.g. 17 Februari 2027)
		var textMatch = target.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
		if (textMatch) {
			var day = parseInt(textMatch[1], 10);
			var monthWord = textMatch[2].toLowerCase();
			var year = parseInt(textMatch[3], 10);
			if (ID_MONTHS_MAP.hasOwnProperty(monthWord)) {
				return new Date(year, ID_MONTHS_MAP[monthWord], day, 23, 59, 59, 999);
			}
		}

		var parsed = Date.parse(target);
		if (!isNaN(parsed)) {
			var d = new Date(parsed);
			d.setHours(23, 59, 59, 999);
			return d;
		}

		return null;
	}

	function isEventClosed(eventObj) {
		if (!eventObj) return false;
		if (eventObj.is_closed === true) return true;
		var endDate = parseEventEndDate(eventObj.date_label || eventObj.date_badge || '');
		if (endDate && new Date() > endDate) {
			return true;
		}
		return false;
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

		var isFeatClosed = isEventClosed(featured);

		if (heroQuota) {
			heroQuota.textContent = isFeatClosed ? 'Event Berakhir' : 'Tiket Tersedia';
			heroQuota.className = isFeatClosed ? 'elha-closed-tag' : 'elha-category-tag';
		}

		var heroGridEl = heroSection ? heroSection.querySelector('.elha-hero-grid') : null;
		if (heroGridEl) {
			heroGridEl.classList.toggle('is-event-closed', isFeatClosed);
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
			heroPrimaryBtn.setAttribute('data-quick-tier', featured.tiers[0] ? featured.tiers[0].tier_id : '');
			if (isFeatClosed) {
				heroPrimaryBtn.textContent = 'Event Telah Berakhir';
				heroPrimaryBtn.disabled = true;
			} else {
				heroPrimaryBtn.textContent = 'Beli Tiket Sekarang';
				heroPrimaryBtn.disabled = false;
			}
		}
		if (heroStubBtn) {
			heroStubBtn.setAttribute('data-quick-event', featured.id);
			heroStubBtn.setAttribute('data-quick-tier', featured.tiers[0] ? featured.tiers[0].tier_id : '');
			if (isFeatClosed) {
				heroStubBtn.textContent = 'Pendaftaran Ditutup';
				heroStubBtn.disabled = true;
			} else {
				heroStubBtn.textContent = 'Lanjut ke Checkout Tiket';
				heroStubBtn.disabled = false;
			}
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
				btn.innerHTML =
					'<span class="elha-quick-tier-name"></span>' +
					'<strong class="elha-quick-tier-price"></strong>';
				btn.querySelector('.elha-quick-tier-name').textContent = tier.name;
				btn.querySelector('.elha-quick-tier-price').textContent = formatRupiah(tier.price);
				if (isFeatClosed) {
					btn.disabled = true;
					btn.style.cursor = 'not-allowed';
					btn.style.opacity = '0.75';
				} else {
					btn.addEventListener('click', function () {
						jumpToCheckout(this.getAttribute('data-quick-event'), this.getAttribute('data-quick-tier'));
					});
				}
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
				var isEvClosed = isEventClosed(ev);

				var article = document.createElement('article');
				article.className = 'elha-schedule-row elha-poster-card' + (isEvClosed ? ' is-event-closed' : '');
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
					'<button type="button" class="elha-btn ' + (isEvClosed ? 'elha-btn-secondary' : 'elha-btn-primary') + '" data-select-event="' + ev.id + '"' + (isEvClosed ? ' disabled' : '') + '>' + (isEvClosed ? 'Event Ditutup' : 'Beli Tiket') + '</button>' +
					'</div>';

				if (ev.banner_image) {
					var posterArtEl = article.querySelector('.elha-poster-art');
					posterArtEl.style.backgroundImage =
						'linear-gradient(180deg, rgba(11, 30, 59, 0.2) 0%, rgba(11, 30, 59, 0.45) 60%, rgba(11, 30, 59, 0.72) 100%), url("' + ev.banner_image.replace(/"/g, '%22') + '")';
				}

				article.querySelector('.elha-poster-date').textContent = ev.date_label;
				article.querySelector('.elha-poster-cat').textContent = ev.category_lbl + (isEvClosed ? ' (Ditutup)' : '');
				article.querySelector('.elha-p-code').textContent = ev.code;
				var quotaEl = article.querySelector('.elha-p-quota');
				if (quotaEl) quotaEl.textContent = '';
				article.querySelector('.elha-row-title').textContent = ev.title;
				article.querySelector('.elha-row-venue').textContent = ev.venue + ' \u2022 ' + ev.time_label;

				if (!isEvClosed) {
					article.querySelector('[data-select-event]').addEventListener('click', function () {
						jumpToCheckout(this.getAttribute('data-select-event'), null);
					});
				}

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
				var isOptClosed = isEventClosed(optEv);
				opt.textContent = (isOptClosed ? '[DITUTUP] ' : '') + optEv.title + ' (' + optEv.date_label + ')';
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
		if (evObj && isEventClosed(evObj)) {
			alert('Mohon maaf, event "' + evObj.title + '" telah selesai melewati tanggal acara. Penjualan tiket telah ditutup.');
			return;
		}
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
		var isClosed = isEventClosed(eventObj);

		if (submitCheckoutBtn) {
			if (isClosed) {
				submitCheckoutBtn.disabled = true;
				submitCheckoutBtn.textContent = 'Pendaftaran Ditutup (Event Selesai)';
			} else {
				submitCheckoutBtn.disabled = false;
			}
		}
		if (checkoutFeedback) {
			if (isClosed) {
				checkoutFeedback.hidden = false;
				checkoutFeedback.textContent = 'Event "' + eventObj.title + '" telah selesai melewati tanggal acara. Penjualan tiket telah ditutup.';
			} else {
				checkoutFeedback.hidden = true;
			}
		}

		for (var i = 0; i < eventObj.tiers.length; i++) {
			var tier = eventObj.tiers[i];
			var isChecked = preferredTierId ? (tier.tier_id === preferredTierId) : (i === 0);

			var label = document.createElement('label');
			label.className = 'elha-tier-card' + (isChecked ? ' is-selected' : '');
			if (isClosed) {
				label.style.cursor = 'not-allowed';
				label.style.opacity = '0.7';
			}

			var radio = document.createElement('input');
			radio.type = 'radio';
			radio.name = 'elha_ticket_tier';
			radio.value = tier.tier_id;
			radio.checked = isChecked;
			if (isClosed) {
				radio.disabled = true;
			}
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
			if (isEventClosed(evObj)) {
				if (checkoutFeedback) {
					checkoutFeedback.hidden = false;
					checkoutFeedback.textContent = 'Event "' + (evObj ? evObj.title : '') + '" telah selesai melewati tanggal acara atau ditutup. Pembelian tiket tidak dapat diproses.';
				}
				return;
			}
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

	var ORDERS_STORAGE_KEY = 'elha_orders_v1';

	function getSavedOrders() {
		try {
			var raw = localStorage.getItem(ORDERS_STORAGE_KEY);
			if (raw) {
				var parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) return parsed;
			}
		} catch (e) {}
		return [];
	}

	function saveOrders(orders) {
		try {
			localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders.slice(0, 100)));
		} catch (e) {}
	}

	function encodeOrderPayload(order) {
		try {
			var compact = {
				c: order.code,
				n: order.buyerName,
				p: order.buyerPhone,
				em: order.buyerEmail || '',
				ad: order.buyerAddress || '',
				m: order.buyerNotes || '',
				t: order.eventTitle,
				v: order.eventVenue,
				d: order.eventDate,
				k: order.tierName,
				q: order.qty || 1,
				a: order.totalAmount,
				ec: order.eventCode || '',
				st: order.status === 'verified' ? 'v' : 'p',
				vt: order.verifiedAt || '',
				cr: order.createdDateStr || ''
			};
			return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(compact)))));
		} catch (e) {
			return '';
		}
	}

	function decodeOrderPayload(str) {
		if (!str) return null;
		try {
			var jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(str))));
			var c = JSON.parse(jsonStr);
			if (!c || !c.c) return null;
			return {
				code: c.c,
				buyerName: c.n || '',
				buyerPhone: c.p || '',
				buyerEmail: c.em || '',
				buyerAddress: c.ad || '',
				buyerNotes: c.m || '',
				eventTitle: c.t || '',
				eventVenue: c.v || '',
				eventDate: c.d || '',
				tierName: c.k || '',
				qty: c.q || 1,
				totalAmount: c.a || 0,
				totalFormatted: formatRupiah(c.a || 0),
				eventCode: c.ec || '',
				status: c.st === 'v' ? 'verified' : 'pending',
				verifiedAt: c.vt || null,
				createdDateStr: c.cr || 'Online Order'
			};
		} catch (e) {
			return null;
		}
	}

	function addOrUpdateOrder(newOrder) {
		var orders = getSavedOrders();
		var idx = -1;
		for (var i = 0; i < orders.length; i++) {
			if (orders[i].code === newOrder.code) {
				idx = i;
				break;
			}
		}
		if (idx >= 0) {
			if (orders[idx].status === 'verified' && newOrder.status !== 'verified') {
				newOrder.status = 'verified';
				newOrder.verifiedAt = orders[idx].verifiedAt;
			}
			orders[idx] = Object.assign({}, orders[idx], newOrder);
		} else {
			orders.unshift(newOrder);
		}
		saveOrders(orders);
		updateOrdersBadgeAndStats();
		return newOrder;
	}

	function findOrderByCode(code) {
		if (!code) return null;
		var clean = code.trim().toUpperCase();
		var orders = getSavedOrders();
		for (var i = 0; i < orders.length; i++) {
			if (orders[i].code === clean) {
				return orders[i];
			}
		}
		return null;
	}

	function updateOrdersBadgeAndStats() {
		var orders = getSavedOrders();
		var pendingCount = 0;
		var verifiedCount = 0;
		for (var i = 0; i < orders.length; i++) {
			if (orders[i].status === 'verified') verifiedCount++;
			else pendingCount++;
		}
		var pendingEl = document.getElementById('elha-verify-count-pending');
		var verifiedEl = document.getElementById('elha-verify-count-verified');
		var badgeEl = document.getElementById('elha-admin-verify-badge');
		var countTableEl = document.getElementById('elha-orders-table-count');

		if (pendingEl) pendingEl.textContent = pendingCount;
		if (verifiedEl) verifiedEl.textContent = verifiedCount;
		if (countTableEl) countTableEl.textContent = orders.length;
		if (badgeEl) {
			badgeEl.textContent = pendingCount;
			badgeEl.hidden = pendingCount === 0;
		}
		if (typeof updateAdminStats === 'function') {
			updateAdminStats();
		}
		if (typeof renderReportTab === 'function' && typeof adminPanes !== 'undefined' && adminPanes && adminPanes.reports && !adminPanes.reports.hidden) {
			renderReportTab();
		}
		if (typeof renderAdminQuotaTable === 'function' && typeof adminPanes !== 'undefined' && adminPanes && adminPanes.quotas && !adminPanes.quotas.hidden) {
			renderAdminQuotaTable();
		}
	}

	function generateBookingCode() {
		var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		var suffix = '';
		for (var i = 0; i < 4; i++) {
			suffix += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return 'ELHA-2611-' + suffix;
	}

	var currentReceiptOrder = null;

	function triggerFileDownload(dataUrl, filename) {
		var a = document.createElement('a');
		a.download = filename;
		a.href = dataUrl;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	function renderDirectCanvasJpg(order) {
		var canvas = document.createElement('canvas');
		canvas.width = 1200;
		canvas.height = 800;
		var ctx = canvas.getContext('2d');
		if (!ctx) return;

		var isVer = order && order.status === 'verified';

		ctx.fillStyle = '#071326';
		ctx.fillRect(0, 0, 1200, 800);

		ctx.fillStyle = '#0F2342';
		if (ctx.roundRect) ctx.roundRect(40, 40, 1120, 720, 24);
		else ctx.rect(40, 40, 1120, 720);
		ctx.fill();

		ctx.strokeStyle = isVer ? '#059669' : '#15469E';
		ctx.lineWidth = 4;
		ctx.stroke();

		var grad = ctx.createLinearGradient(40, 40, 1160, 160);
		if (isVer) {
			grad.addColorStop(0, '#064E3B');
			grad.addColorStop(1, '#059669');
		} else {
			grad.addColorStop(0, '#0B1E3B');
			grad.addColorStop(1, '#15469E');
		}
		ctx.fillStyle = grad;
		ctx.fillRect(40, 40, 1120, 120);

		ctx.fillStyle = '#FF9852';
		ctx.font = 'bold 18px "IBM Plex Mono", Consolas, monospace';
		ctx.fillText('KODE BOOKING E-TIKET', 70, 80);

		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 36px "IBM Plex Mono", Consolas, monospace';
		ctx.fillText(order ? order.code : 'ELHA-2611-XXXX', 70, 125);

		ctx.fillStyle = isVer ? '#10B981' : '#FF7315';
		if (ctx.roundRect) ctx.roundRect(880, 72, 240, 44, 22);
		else ctx.rect(880, 72, 240, 44);
		ctx.fill();
		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 18px "Onest", sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(isVer ? 'LUNAS & AKTIF' : 'E-TICKET PASS', 1000, 100);
		ctx.textAlign = 'left';

		ctx.fillStyle = '#F8FAFC';
		ctx.font = 'bold 34px "Bricolage Grotesque", sans-serif';
		ctx.fillText(order ? order.eventTitle : 'eLHa Event', 70, 215);

		ctx.fillStyle = '#B8CAE6';
		ctx.font = '20px "Onest", sans-serif';
		var venueDateText = (order ? order.eventVenue : '') + ' \u2022 ' + (order ? order.eventDate : '');
		ctx.fillText(venueDateText, 70, 252);

		ctx.fillStyle = '#142C52';
		if (ctx.roundRect) ctx.roundRect(70, 280, 1060, 240, 16);
		else ctx.rect(70, 280, 1060, 240);
		ctx.fill();

		ctx.fillStyle = '#B8CAE6';
		ctx.font = '16px "Onest", sans-serif';
		ctx.fillText('PEMEGANG TIKET', 100, 315);
		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 22px "Onest", sans-serif';
		ctx.fillText((order ? order.buyerName : '-') + ' (' + (order ? order.buyerPhone : '-') + ')', 100, 348);

		ctx.fillStyle = '#B8CAE6';
		ctx.font = '16px "Onest", sans-serif';
		ctx.fillText('EMAIL & DOMISILI', 100, 395);
		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 20px "Onest", sans-serif';
		ctx.fillText((order && order.buyerEmail ? order.buyerEmail : '-') + ' \u2022 ' + (order && order.buyerAddress ? order.buyerAddress : '-'), 100, 428);

		ctx.fillStyle = '#B8CAE6';
		ctx.font = '16px "Onest", sans-serif';
		ctx.fillText('KATEGORI & JUMLAH', 100, 475);
		ctx.fillStyle = '#FFFFFF';
		ctx.font = 'bold 22px "Onest", sans-serif';
		ctx.fillText((order ? (order.qty || 1) + 'x ' + order.tierName : '-'), 100, 505);

		ctx.fillStyle = '#B8CAE6';
		ctx.font = '16px "Onest", sans-serif';
		ctx.fillText('TOTAL PEMBAYARAN', 650, 315);
		ctx.fillStyle = '#FF9852';
		ctx.font = 'bold 28px "IBM Plex Mono", monospace';
		ctx.fillText(order ? order.totalFormatted : 'Rp 0', 650, 350);

		ctx.fillStyle = '#B8CAE6';
		ctx.font = '16px "Onest", sans-serif';
		ctx.fillText('STATUS TIKET', 650, 395);
		ctx.fillStyle = isVer ? '#34D399' : '#FBBF24';
		ctx.font = 'bold 22px "Onest", sans-serif';
		ctx.fillText(isVer ? 'LUNAS & AKTIF (TERVERIFIKASI)' : 'MENUNGGU KONFIRMASI PEMBAYARAN', 650, 428);

		ctx.fillStyle = '#B8CAE6';
		ctx.font = '16px "Onest", sans-serif';
		ctx.fillText(isVer ? ('Diverifikasi: ' + (order.verifiedAt || 'Resmi')) : 'Silakan konfirmasi pembayaran ke Admin', 650, 465);

		ctx.fillStyle = '#FFFFFF';
		if (ctx.roundRect) ctx.roundRect(70, 545, 1060, 160, 14);
		else ctx.rect(70, 545, 1060, 160);
		ctx.fill();

		ctx.fillStyle = '#0B1E3B';
		var seedStr = (order ? order.code : 'ELHA') + '-BARCODE';
		var barX = 140;
		for (var b = 0; b < 75; b++) {
			var charVal = seedStr.charCodeAt(b % seedStr.length) + b;
			var w = (charVal % 3 === 0) ? 5 : ((charVal % 2 === 0) ? 3 : 2);
			var gap = ((charVal * 3) % 4) + 3;
			ctx.fillRect(barX, 565, w, 85);
			barX += w + gap;
			if (barX > 1050) break;
		}

		ctx.fillStyle = '#0B1E3B';
		ctx.font = 'bold 18px "IBM Plex Mono", Consolas, monospace';
		ctx.textAlign = 'center';
		ctx.fillText((order ? order.code : '') + ' | SCAN BARCODE DI GATE CHECK-IN | OFFICIAL PASS', 600, 680);
		ctx.textAlign = 'left';

		var filename = 'e-tiket-' + (order && order.code ? order.code : 'elha') + '.jpg';
		var dataUrl = canvas.toDataURL('image/jpeg', 0.95);
		triggerFileDownload(dataUrl, filename);
	}

	function downloadEticketAsJpg(order) {
		var passEl = document.getElementById('elha-printable-eticket');
		var btn = document.getElementById('elha-download-jpg-btn');
		var filename = 'e-tiket-' + (order && order.code ? order.code : 'elha') + '.jpg';

		if (window.html2canvas && passEl) {
			var prevText = btn ? btn.textContent : '';
			if (btn) btn.textContent = 'Menyiapkan Gambar JPG...';
			window.html2canvas(passEl, {
				scale: 2,
				useCORS: true,
				logging: false,
				backgroundColor: '#071326'
			}).then(function (canvas) {
				var dataUrl = canvas.toDataURL('image/jpeg', 0.95);
				triggerFileDownload(dataUrl, filename);
				if (btn) btn.textContent = prevText;
			}).catch(function () {
				renderDirectCanvasJpg(order);
				if (btn) btn.textContent = prevText;
			});
		} else {
			renderDirectCanvasJpg(order);
		}
	}

	function buildWhatsAppOrderText(order) {
		var adminVerifyUrl = window.location.origin + getBasePath() + '/adminelha?verify=' + order.code + '&od=' + encodeOrderPayload(order);
		var lines = [
			'Halo ' + config.settings.whatsapp_admin_lbl + ',',
			'Saya ingin mengonfirmasi pemesanan E-Tiket dengan rincian berikut:',
			'',
			'Kode Booking E-Tiket: ' + order.code,
			'Event: ' + order.eventTitle,
			'Jadwal: ' + order.eventDate,
			'Lokasi: ' + order.eventVenue,
			'Kategori Tiket: ' + (order.qty || 1) + 'x ' + order.tierName,
			'Total Tagihan: ' + order.totalFormatted,
			'',
			'Pemegang E-Tiket:',
			'Nama: ' + order.buyerName,
			'No. Telepon/WA: ' + order.buyerPhone,
			'Email: ' + (order.buyerEmail || '-'),
			'Domisili: ' + (order.buyerAddress || '-')
		];
		if (order.buyerNotes) {
			lines.push('Catatan: ' + order.buyerNotes);
		}
		lines.push(
			'',
			'Link Verifikasi Admin:',
			adminVerifyUrl,
			'',
			'Mohon instruksi pembayaran untuk aktivasi E-Tiket ini. Terima kasih.'
		);
		return lines.join('\n');
	}

	function showOrderReceiptModal(order, isVerified) {
		currentReceiptOrder = order;

		var statusHeading = document.getElementById('elha-receipt-status-heading');
		var statusBadge = document.getElementById('elha-receipt-status-badge');
		var statusSub = document.getElementById('elha-receipt-status-sub');
		var passTag = document.getElementById('elha-receipt-pass-tag');
		var passBox = document.getElementById('elha-printable-eticket');
		var etEventName = document.getElementById('elha-eticket-event-name');
		var etVenueDate = document.getElementById('elha-eticket-venue-date');
		var etBuyer = document.getElementById('elha-eticket-buyer');
		var etContact = document.getElementById('elha-eticket-contact');
		var etTier = document.getElementById('elha-eticket-tier');
		var etTotal = document.getElementById('elha-eticket-total');
		var etBarcode = document.getElementById('elha-eticket-barcode');
		var etSerial = document.getElementById('elha-eticket-serial');
		var waTextarea = document.getElementById('elha-wa-preview-text');
		var waDirectLink = document.getElementById('elha-wa-direct-link');
		var copyTicketLinkBtn = document.getElementById('elha-copy-ticket-link-btn');

		if (statusHeading) statusHeading.textContent = order.code;
		if (etEventName) etEventName.textContent = order.eventTitle;
		if (etVenueDate) etVenueDate.textContent = order.eventVenue + ' | ' + order.eventDate;
		if (etBuyer) etBuyer.textContent = order.buyerName + (order.buyerPhone ? ' (' + order.buyerPhone + ')' : '');
		if (etContact) etContact.textContent = (order.buyerEmail || '-') + ' \u2022 ' + (order.buyerAddress || '-');
		if (etTier) etTier.textContent = (order.qty || 1) + 'x ' + order.tierName;
		if (etTotal) etTotal.textContent = order.totalFormatted;
		var evCode = order.eventCode || 'EVT';
		if (etBarcode) etBarcode.innerHTML = renderSvgBarcode(order.code + '-' + evCode);
		if (etSerial) etSerial.textContent = order.code + ' | ' + evCode;

		var isLunas = isVerified || order.status === 'verified';
		if (passBox) {
			passBox.classList.toggle('elha-verified-pass', isLunas);
		}
		if (statusBadge) {
			statusBadge.className = isLunas ? 'elha-status-badge is-verified' : 'elha-status-badge is-pending';
			statusBadge.textContent = isLunas ? 'LUNAS & AKTIF (TERVERIFIKASI)' : 'Menunggu Konfirmasi Pembayaran';
		}
		if (statusSub) {
			statusSub.textContent = isLunas
				? (order.verifiedAt ? 'Diverifikasi pada: ' + order.verifiedAt : 'Resmi Terverifikasi oleh Admin eLHa Event')
				: 'Silakan kirim rincian pesanan ke Admin via WhatsApp untuk aktivasi';
		}
		if (passTag) {
			passTag.textContent = isLunas ? 'E-TIKET RESMI: LUNAS' : 'E-TICKET PASS';
			passTag.className = isLunas ? 'elha-verified-tag' : 'elha-wa-tag';
		}

		var ticketUrl = window.location.origin + getBasePath() + '/?ticket=' + order.code + '&od=' + encodeOrderPayload(order);
		if (copyTicketLinkBtn) {
			copyTicketLinkBtn.hidden = !isLunas;
			copyTicketLinkBtn.setAttribute('data-ticket-url', ticketUrl);
		}

		var waMessage = isLunas
			? ('Halo Admin ' + (config.settings.whatsapp_admin_lbl || 'eLHa Event') + ',\nSaya memiliki E-Tiket Resmi Lunas:\nKode Booking: ' + order.code + '\nEvent: ' + order.eventTitle + '\nLink E-Tiket: ' + ticketUrl)
			: buildWhatsAppOrderText(order);

		if (waTextarea) waTextarea.value = waMessage;
		if (waDirectLink) {
			var cleanNumber = (config.settings.whatsapp_number || '6281234567890').replace(/[^0-9]/g, '');
			if (isLunas) {
				waDirectLink.textContent = 'Bagikan E-Tiket ke WhatsApp';
				waDirectLink.href = 'https://wa.me/?text=' + encodeURIComponent('E-Tiket Resmi ' + order.eventTitle + ' (' + order.code + '): ' + ticketUrl);
			} else {
				waDirectLink.textContent = 'Konfirmasi & Aktifkan Tiket';
				waDirectLink.href = 'https://wa.me/' + cleanNumber + '?text=' + encodeURIComponent(waMessage);
			}
		}

		openModal('elha-receipt-modal', submitCheckoutBtn);
	}

	if (checkoutForm) {
		checkoutForm.addEventListener('submit', function (e) {
			e.preventDefault();

			var buyerNameInput = document.getElementById('elha-buyer-name');
			var buyerPhoneInput = document.getElementById('elha-buyer-phone');
			var buyerEmailInput = document.getElementById('elha-buyer-email');
			var buyerAddressInput = document.getElementById('elha-buyer-address');
			var buyerNotesInput = document.getElementById('elha-buyer-notes');

			var buyerName = buyerNameInput ? buyerNameInput.value.trim() : '';
			var buyerPhone = buyerPhoneInput ? buyerPhoneInput.value.trim() : '';
			var buyerEmail = buyerEmailInput ? buyerEmailInput.value.trim() : '';
			var buyerAddress = buyerAddressInput ? buyerAddressInput.value.trim() : '';
			var buyerNotes = buyerNotesInput ? buyerNotesInput.value.trim() : '';

			if (!buyerName || !buyerPhone || !buyerEmail || !buyerAddress) {
				if (checkoutFeedback) {
					checkoutFeedback.hidden = false;
					checkoutFeedback.textContent = 'Mohon lengkapi Nama Lengkap, Nomor Telepon/WhatsApp, Alamat Email, dan Kota Domisili Anda terlebih dahulu.';
				}
				if (!buyerName && buyerNameInput) buyerNameInput.focus();
				else if (!buyerPhone && buyerPhoneInput) buyerPhoneInput.focus();
				else if (!buyerEmail && buyerEmailInput) buyerEmailInput.focus();
				else if (!buyerAddress && buyerAddressInput) buyerAddressInput.focus();
				return;
			}

			if (checkoutFeedback) {
				checkoutFeedback.hidden = true;
			}

			var evObj = findEventById(eventSelect ? eventSelect.value : config.events[0].id);
			if (isEventClosed(evObj)) {
				if (checkoutFeedback) {
					checkoutFeedback.hidden = false;
					checkoutFeedback.textContent = 'Event "' + (evObj ? evObj.title : '') + '" telah selesai melewati tanggal acara atau ditutup. Pembelian tiket tidak dapat diproses.';
				}
				return;
			}
			var tierData = getSelectedTierData();
			var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value || '1', 10)) : 1;
			var subtotal = tierData.price * qty;
			var finalTotal = Math.round(subtotal * (1 - discountRate));
			var bookingCode = generateBookingCode();
			var now = new Date();
			var dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
				String(now.getHours()).padStart(2, '0') + '.' + String(now.getMinutes()).padStart(2, '0') + ' WIB';

			var order = {
				code: bookingCode,
				buyerName: buyerName,
				buyerPhone: buyerPhone,
				buyerEmail: buyerEmail,
				buyerAddress: buyerAddress,
				buyerNotes: buyerNotes,
				eventId: evObj.id,
				eventCode: evObj.code,
				eventTitle: evObj.title,
				eventDate: evObj.date_label + ' (' + evObj.time_label + ')',
				eventVenue: evObj.venue,
				tierName: tierData.name,
				qty: qty,
				totalAmount: finalTotal,
				totalFormatted: formatRupiah(finalTotal),
				status: 'pending',
				verifiedAt: null,
				createdDateStr: dateStr
			};

			addOrUpdateOrder(order);
			showOrderReceiptModal(order, false);
		});
	}

	var printEticketBtn = document.getElementById('elha-print-eticket-btn');
	if (printEticketBtn) {
		printEticketBtn.addEventListener('click', function () {
			window.print();
		});
	}

	var downloadJpgBtn = document.getElementById('elha-download-jpg-btn');
	if (downloadJpgBtn) {
		downloadJpgBtn.addEventListener('click', function () {
			if (currentReceiptOrder) {
				downloadEticketAsJpg(currentReceiptOrder);
			}
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

	var copyTicketLinkBtn = document.getElementById('elha-copy-ticket-link-btn');
	if (copyTicketLinkBtn) {
		copyTicketLinkBtn.addEventListener('click', function () {
			var link = this.getAttribute('data-ticket-url') || window.location.href;
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(link).then(function () {
					var prev = copyTicketLinkBtn.textContent;
					copyTicketLinkBtn.textContent = 'Link E-Tiket Disalin!';
					setTimeout(function () { copyTicketLinkBtn.textContent = prev; }, 2000);
				}).catch(function () {
					window.prompt('Salin link E-Tiket resmi berikut:', link);
				});
			} else {
				window.prompt('Salin link E-Tiket resmi berikut:', link);
			}
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
	var statSoldEl = document.getElementById('elha-stat-sold');
	var statRevenueEl = document.getElementById('elha-stat-revenue');
	var statQuotaEl = document.getElementById('elha-stat-quota');
	var statWaEl = document.getElementById('elha-stat-wa');

	var reportEventFilter = document.getElementById('elha-report-event-filter');
	var reportSearchInput = document.getElementById('elha-report-search-input');
	var reportTableWrap = document.getElementById('elha-report-table-wrap');
	var exportExcelBtn = document.getElementById('elha-export-excel-btn');
	var reportTableCount = document.getElementById('elha-report-table-count');
	var reportActiveBadge = document.getElementById('elha-report-active-event-badge');
	var repStatParticipants = document.getElementById('elha-rep-stat-participants');
	var repStatTickets = document.getElementById('elha-rep-stat-tickets');
	var repStatRevenue = document.getElementById('elha-rep-stat-revenue');
	var repStatQuota = document.getElementById('elha-rep-stat-quota');

	var settingsForm = document.getElementById('elha-admin-settings-form');
	var setBrandInput = document.getElementById('elha-set-brand');
	var adminWaInput = document.getElementById('elha-admin-wa');
	var setAdminLblInput = document.getElementById('elha-set-admin-lbl');
	var setPromoCodeInput = document.getElementById('elha-set-promo-code');
	var setPromoPctInput = document.getElementById('elha-set-promo-pct');
	var settingsFeedback = document.getElementById('elha-settings-feedback');

	function updateAdminStats() {
		var totalEvents = config.events.length;
		var totalQuota = 0;
		for (var i = 0; i < config.events.length; i++) {
			var ev = config.events[i];
			if (Array.isArray(ev.tiers)) {
				totalQuota += getEventTotalQuota(ev);
			}
		}
		var orders = getSavedOrders();
		var totalSoldTickets = 0;
		var totalRevenue = 0;
		for (var o = 0; o < orders.length; o++) {
			if (orders[o].status === 'verified') {
				totalSoldTickets += (orders[o].qty || 1);
				totalRevenue += (orders[o].totalAmount || 0);
			}
		}
		var remainingQuota = Math.max(0, totalQuota - totalSoldTickets);

		if (statEventsEl) statEventsEl.textContent = String(totalEvents);
		if (statSoldEl) statSoldEl.textContent = totalSoldTickets.toLocaleString('id-ID') + ' Tiket';
		if (statRevenueEl) statRevenueEl.textContent = formatRupiah(totalRevenue);
		if (statQuotaEl) statQuotaEl.textContent = remainingQuota.toLocaleString('id-ID') + ' Tiket';
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
		verify: document.getElementById('elha-admin-pane-verify'),
		reports: document.getElementById('elha-admin-pane-reports'),
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
		if (targetTab === 'verify') {
			renderAdminOrdersTable();
		} else if (targetTab === 'reports') {
			populateReportEventFilter();
			renderReportTab();
		} else if (targetTab === 'quotas') {
			renderAdminQuotaTable();
		}
	}

	// Order Verification Engine
	var verifySearchInput = document.getElementById('elha-verify-search-input');
	var verifyFilterStatus = document.getElementById('elha-verify-filter-status');
	var adminOrdersWrap = document.getElementById('elha-admin-orders-wrap');
	var clearOrdersBtn = document.getElementById('elha-clear-orders-btn');
	var selectedBox = document.getElementById('elha-verify-selected-box');
	var selectedCodeEl = document.getElementById('elha-verify-card-code');
	var selectedBadgeEl = document.getElementById('elha-verify-card-status-badge');
	var selectedBuyerEl = document.getElementById('elha-verify-card-buyer');
	var selectedPhoneEl = document.getElementById('elha-verify-card-phone');
	var selectedContactEl = document.getElementById('elha-verify-card-contact');
	var selectedEventEl = document.getElementById('elha-verify-card-event');
	var selectedTierEl = document.getElementById('elha-verify-card-tier');
	var selectedTotalEl = document.getElementById('elha-verify-card-total');
	var selectedTimeEl = document.getElementById('elha-verify-card-time');
	var selectedNotesWrap = document.getElementById('elha-verify-card-notes-wrap');
	var selectedNotesEl = document.getElementById('elha-verify-card-notes');
	var btnApprove = document.getElementById('elha-verify-action-approve');
	var btnSendWa = document.getElementById('elha-verify-action-send-wa');
	var btnViewPass = document.getElementById('elha-verify-action-view-pass');
	var btnUnverify = document.getElementById('elha-verify-action-unverify');
	var btnDelete = document.getElementById('elha-verify-action-delete');

	var activeVerificationOrder = null;

	function renderAdminOrdersTable() {
		if (!adminOrdersWrap) return;
		updateOrdersBadgeAndStats();
		var orders = getSavedOrders();

		var query = verifySearchInput ? verifySearchInput.value.trim().toLowerCase() : '';
		var statusFilter = verifyFilterStatus ? verifyFilterStatus.value : 'all';

		var filtered = orders.filter(function (ord) {
			var matchStatus = statusFilter === 'all' || ord.status === statusFilter;
			if (!matchStatus) return false;
			if (!query) return true;
			var searchHaystack = [
				ord.code,
				ord.buyerName,
				ord.buyerPhone,
				ord.eventTitle,
				ord.tierName,
				ord.eventCode || ''
			].join(' ').toLowerCase();
			return searchHaystack.indexOf(query) !== -1;
		});

		if (filtered.length === 0) {
			var emptyMsg = orders.length === 0
				? 'Belum ada pesanan tiket tercatat. Pesanan dari formulir checkout akan otomatis masuk ke sini.'
				: 'Tidak ada pesanan tiket yang cocok dengan pencarian atau filter status.';
			adminOrdersWrap.innerHTML = '<div class="elha-event-mini-summary">' + emptyMsg + '</div>';
			return;
		}

		var html = '<table class="elha-quota-table"><thead><tr>' +
			'<th>Kode Booking</th>' +
			'<th>Pemesan</th>' +
			'<th>Event &amp; Tiket</th>' +
			'<th>Total Tagihan</th>' +
			'<th>Status</th>' +
			'<th>Aksi Verifikasi</th>' +
			'</tr></thead><tbody>';

		for (var i = 0; i < filtered.length; i++) {
			var o = filtered[i];
			var isVer = o.status === 'verified';
			var statusBadge = isVer
				? '<span class="elha-status-badge is-verified">Lunas</span>'
				: '<span class="elha-status-badge is-pending">Menunggu</span>';

			html += '<tr>' +
				'<td><strong class="elha-mono-text">' + o.code + '</strong><br><small style="color:var(--elha-text-muted);">' + (o.createdDateStr || 'Online') + '</small></td>' +
				'<td><strong>' + o.buyerName + '</strong><br><small class="elha-mono-text">' + o.buyerPhone + '</small></td>' +
				'<td><strong>' + o.eventTitle + '</strong><br><small>' + (o.qty || 1) + 'x ' + o.tierName + '</small></td>' +
				'<td><strong class="elha-mono-text">' + o.totalFormatted + '</strong></td>' +
				'<td>' + statusBadge + '</td>' +
				'<td>' +
				'<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
				'<button type="button" class="elha-table-action-btn is-view-quick" data-order-action="select" data-order-code="' + o.code + '">Kelola</button>' +
				(!isVer ? '<button type="button" class="elha-table-action-btn is-verify-quick" data-order-action="quick-approve" data-order-code="' + o.code + '">Verifikasi Lunas</button>' : '') +
				'<button type="button" class="elha-table-action-btn" data-order-action="view-pass" data-order-code="' + o.code + '">Pas</button>' +
				'</div>' +
				'</td>' +
				'</tr>';
		}
		html += '</tbody></table>';
		adminOrdersWrap.innerHTML = html;
	}

	function selectOrderForVerification(order) {
		if (!order) return;
		activeVerificationOrder = order;

		if (!selectedBox) return;
		selectedBox.hidden = false;

		if (selectedCodeEl) selectedCodeEl.textContent = order.code;
		if (selectedBuyerEl) selectedBuyerEl.textContent = order.buyerName;
		if (selectedPhoneEl) selectedPhoneEl.textContent = order.buyerPhone;
		if (selectedContactEl) selectedContactEl.textContent = (order.buyerEmail || '-') + ' \u2022 ' + (order.buyerAddress || '-');
		if (selectedEventEl) selectedEventEl.textContent = order.eventTitle;
		if (selectedTierEl) selectedTierEl.textContent = (order.qty || 1) + 'x ' + order.tierName;
		if (selectedTotalEl) selectedTotalEl.textContent = order.totalFormatted;

		if (order.buyerNotes && selectedNotesWrap && selectedNotesEl) {
			selectedNotesWrap.hidden = false;
			selectedNotesEl.textContent = order.buyerNotes;
		} else if (selectedNotesWrap) {
			selectedNotesWrap.hidden = true;
		}

		var isVer = order.status === 'verified';
		if (selectedBadgeEl) {
			selectedBadgeEl.className = isVer ? 'elha-status-badge is-verified' : 'elha-status-badge is-pending';
			selectedBadgeEl.textContent = isVer ? 'Lunas & Terverifikasi' : 'Menunggu Konfirmasi';
		}
		if (selectedTimeEl) {
			selectedTimeEl.textContent = isVer
				? (order.verifiedAt ? 'Diverifikasi: ' + order.verifiedAt : 'Terverifikasi Resmi')
				: 'Menunggu Verifikasi (Dipesan: ' + (order.createdDateStr || 'Online') + ')';
		}

		selectedBox.classList.toggle('is-verified-border', isVer);

		if (btnApprove) btnApprove.hidden = isVer;
		if (btnUnverify) btnUnverify.hidden = !isVer;

		if (btnSendWa) {
			btnSendWa.hidden = !isVer;
			if (isVer) {
				var custTicketUrl = window.location.origin + getBasePath() + '/?ticket=' + order.code + '&od=' + encodeOrderPayload(order);
				var cleanPhone = (order.buyerPhone || '').replace(/[^0-9]/g, '');
				if (cleanPhone.indexOf('08') === 0) {
					cleanPhone = '628' + cleanPhone.substring(2);
				}
				var replyLines = [
					'Halo ' + order.buyerName + ',',
					'Pembayaran E-Tiket Anda untuk acara ' + order.eventTitle + ' telah DIVERIFIKASI & LUNAS.',
					'',
					'Rincian E-Tiket Resmi:',
					'Kode Booking: ' + order.code,
					'Event: ' + order.eventTitle,
					'Kategori: ' + (order.qty || 1) + 'x ' + order.tierName,
					'Status: LUNAS & AKTIF (TERVERIFIKASI)',
					'',
					'Buka dan simpan E-Tiket resmi Anda di link berikut:',
					custTicketUrl,
					'',
					'Tunjukkan barcode pada E-Tiket saat registrasi di Gate Check-In. Terima kasih telah memesan melalui eLHa Event.'
				];
				btnSendWa.href = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(replyLines.join('\n'));
			}
		}

		selectedBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}

	if (adminOrdersWrap) {
		adminOrdersWrap.addEventListener('click', function (e) {
			var btn = e.target.closest('[data-order-action]');
			if (!btn) return;
			var act = btn.getAttribute('data-order-action');
			var code = btn.getAttribute('data-order-code');
			var ord = findOrderByCode(code);
			if (!ord) return;

			if (act === 'select') {
				selectOrderForVerification(ord);
			} else if (act === 'quick-approve') {
				var now = new Date();
				ord.status = 'verified';
				ord.verifiedAt = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
					String(now.getHours()).padStart(2, '0') + '.' + String(now.getMinutes()).padStart(2, '0') + ' WIB';
				addOrUpdateOrder(ord);
				selectOrderForVerification(ord);
				renderAdminOrdersTable();
			} else if (act === 'view-pass') {
				showOrderReceiptModal(ord, ord.status === 'verified');
			}
		});
	}

	if (btnApprove) {
		btnApprove.addEventListener('click', function () {
			if (!activeVerificationOrder) return;
			var now = new Date();
			activeVerificationOrder.status = 'verified';
			activeVerificationOrder.verifiedAt = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
				String(now.getHours()).padStart(2, '0') + '.' + String(now.getMinutes()).padStart(2, '0') + ' WIB';
			addOrUpdateOrder(activeVerificationOrder);
			selectOrderForVerification(activeVerificationOrder);
			renderAdminOrdersTable();
		});
	}

	if (btnUnverify) {
		btnUnverify.addEventListener('click', function () {
			if (!activeVerificationOrder) return;
			activeVerificationOrder.status = 'pending';
			activeVerificationOrder.verifiedAt = null;
			addOrUpdateOrder(activeVerificationOrder);
			selectOrderForVerification(activeVerificationOrder);
			renderAdminOrdersTable();
		});
	}

	if (btnDelete) {
		btnDelete.addEventListener('click', function () {
			if (!activeVerificationOrder) return;
			if (window.confirm('Hapus pesanan ' + activeVerificationOrder.code + ' dari log pesanan?')) {
				var orders = getSavedOrders().filter(function (o) { return o.code !== activeVerificationOrder.code; });
				saveOrders(orders);
				activeVerificationOrder = null;
				if (selectedBox) selectedBox.hidden = true;
				renderAdminOrdersTable();
			}
		});
	}

	if (btnViewPass) {
		btnViewPass.addEventListener('click', function () {
			if (!activeVerificationOrder) return;
			showOrderReceiptModal(activeVerificationOrder, activeVerificationOrder.status === 'verified');
		});
	}

	if (verifySearchInput) {
		verifySearchInput.addEventListener('input', function () {
			renderAdminOrdersTable();
			var exact = findOrderByCode(this.value);
			if (exact) {
				selectOrderForVerification(exact);
			}
		});
	}

	if (verifyFilterStatus) {
		verifyFilterStatus.addEventListener('change', renderAdminOrdersTable);
	}

	if (clearOrdersBtn) {
		clearOrdersBtn.addEventListener('click', function () {
			if (window.confirm('Hapus seluruh riwayat pesanan yang sudah berstatus Lunas?')) {
				var orders = getSavedOrders().filter(function (o) { return o.status !== 'verified'; });
				saveOrders(orders);
				if (activeVerificationOrder && activeVerificationOrder.status === 'verified') {
					activeVerificationOrder = null;
					if (selectedBox) selectedBox.hidden = true;
				}
				renderAdminOrdersTable();
			}
		});
	}

	for (var tb = 0; tb < adminTabBtns.length; tb++) {
		adminTabBtns[tb].addEventListener('click', function () {
			switchAdminTab(this.getAttribute('data-admin-tab'));
		});
	}

	function escapeHtml(str) {
		if (str == null) return '';
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	function renderAdminQuotaTable() {
		if (!quotaTableWrap) return;
		if (config.events.length === 0) {
			quotaTableWrap.innerHTML = '<div class="elha-event-mini-summary">Belum ada event atau kategori tiket yang dibuat.</div>';
			return;
		}
		var orders = getSavedOrders();
		var html = '<table class="elha-quota-table"><thead><tr>' +
			'<th>Event</th>' +
			'<th>Kategori Tiket</th>' +
			'<th>Harga Satuan</th>' +
			'<th>Terjual (Lunas)</th>' +
			'<th>Sisa Kuota</th>' +
			'<th>Total Kuota</th>' +
			'<th>Total Pendapatan</th>' +
			'</tr></thead><tbody>';

		var grandSold = 0;
		var grandQuota = 0;
		var grandRevenue = 0;

		for (var i = 0; i < config.events.length; i++) {
			var ev = config.events[i];
			var tiers = Array.isArray(ev.tiers) ? ev.tiers : [];
			for (var t = 0; t < tiers.length; t++) {
				var tier = tiers[t];
				var tierQuota = tier.quota || 0;
				var tierSold = 0;
				var tierRevenue = 0;

				for (var o = 0; o < orders.length; o++) {
					var ord = orders[o];
					if (ord.status === 'verified') {
						var matchEv = ord.eventId === ev.id || ord.eventCode === ev.code || (ord.eventTitle && ord.eventTitle.trim().toLowerCase() === ev.title.trim().toLowerCase());
						var matchTier = ord.tierName && tier.name && ord.tierName.trim().toLowerCase() === tier.name.trim().toLowerCase();
						if (matchEv && matchTier) {
							tierSold += (ord.qty || 1);
							tierRevenue += (ord.totalAmount || 0);
						}
					}
				}

				var remaining = Math.max(0, tierQuota - tierSold);
				grandSold += tierSold;
				grandQuota += tierQuota;
				grandRevenue += tierRevenue;

				var remDisplay = remaining === 0
					? '<span class="elha-status-badge is-pending" style="color:var(--elha-danger);background:rgba(239,68,68,0.12);">Habis</span>'
					: '<strong class="elha-mono-text">' + remaining.toLocaleString('id-ID') + ' Tiket</strong>';

				html += '<tr>' +
					'<td><strong>' + escapeHtml(ev.title) + '</strong><br><small style="color:var(--elha-text-muted);">' + escapeHtml(ev.code) + ' | ' + escapeHtml(ev.category_lbl || 'Umum') + '</small></td>' +
					'<td><strong>' + escapeHtml(tier.name) + '</strong></td>' +
					'<td class="elha-mono-text">' + formatRupiah(tier.price) + '</td>' +
					'<td class="elha-mono-text"><span class="elha-status-badge is-verified">' + tierSold.toLocaleString('id-ID') + ' Tiket</span></td>' +
					'<td>' + remDisplay + '</td>' +
					'<td class="elha-mono-text">' + tierQuota.toLocaleString('id-ID') + ' Tiket</td>' +
					'<td class="elha-mono-text" style="color:var(--elha-primary);font-weight:700;">' + formatRupiah(tierRevenue) + '</td>' +
					'</tr>';
			}
		}

		html += '</tbody><tfoot><tr style="background:rgba(0,0,0,0.03);font-weight:700;">' +
			'<td colspan="3" style="text-align:right;"><strong>TOTAL KESELURUHAN:</strong></td>' +
			'<td class="elha-mono-text"><span class="elha-status-badge is-verified">' + grandSold.toLocaleString('id-ID') + ' Tiket</span></td>' +
			'<td class="elha-mono-text"><strong>' + Math.max(0, grandQuota - grandSold).toLocaleString('id-ID') + ' Tiket</strong></td>' +
			'<td class="elha-mono-text">' + grandQuota.toLocaleString('id-ID') + ' Tiket</td>' +
			'<td class="elha-mono-text" style="color:var(--elha-primary);font-weight:800;">' + formatRupiah(grandRevenue) + '</td>' +
			'</tr></tfoot></table>';
		quotaTableWrap.innerHTML = html;
	}

	function populateReportEventFilter() {
		if (!reportEventFilter) return;
		var currentVal = reportEventFilter.value || 'all';
		reportEventFilter.innerHTML = '<option value="all">Semua Event Terdaftar</option>';
		for (var i = 0; i < config.events.length; i++) {
			var ev = config.events[i];
			var opt = document.createElement('option');
			opt.value = ev.id;
			opt.textContent = ev.title + ' (' + ev.code + ')';
			reportEventFilter.appendChild(opt);
		}
		if (currentVal) {
			reportEventFilter.value = currentVal;
		}
	}

	function getFilteredReportOrders() {
		var orders = getSavedOrders();
		var selectedEvId = reportEventFilter ? reportEventFilter.value : 'all';
		var query = reportSearchInput ? reportSearchInput.value.trim().toLowerCase() : '';

		var selectedEv = null;
		if (selectedEvId && selectedEvId !== 'all') {
			selectedEv = findEventById(selectedEvId);
		}

		return orders.filter(function (ord) {
			if (ord.status !== 'verified') return false;

			if (selectedEv) {
				var matchEvent = ord.eventId === selectedEv.id ||
					ord.eventCode === selectedEv.code ||
					(ord.eventTitle && ord.eventTitle.trim().toLowerCase() === selectedEv.title.trim().toLowerCase());
				if (!matchEvent) return false;
			}

			if (!query) return true;

			var haystack = [
				ord.code || '',
				ord.buyerName || '',
				ord.buyerPhone || '',
				ord.buyerEmail || '',
				ord.buyerAddress || '',
				ord.buyerNotes || '',
				ord.eventTitle || '',
				ord.tierName || ''
			].join(' ').toLowerCase();

			return haystack.indexOf(query) !== -1;
		});
	}

	function renderReportTab() {
		if (!reportTableWrap) return;
		var filtered = getFilteredReportOrders();

		var selectedEvId = reportEventFilter ? reportEventFilter.value : 'all';
		var selectedEv = selectedEvId !== 'all' ? findEventById(selectedEvId) : null;

		var totalParticipants = filtered.length;
		var totalTickets = 0;
		var totalRevenue = 0;

		for (var i = 0; i < filtered.length; i++) {
			totalTickets += (filtered[i].qty || 1);
			totalRevenue += (filtered[i].totalAmount || 0);
		}

		var targetQuota = 0;
		var ordersAll = getSavedOrders();
		var soldForQuota = 0;

		if (selectedEv) {
			targetQuota = getEventTotalQuota(selectedEv);
			for (var o = 0; o < ordersAll.length; o++) {
				if (ordersAll[o].status === 'verified') {
					if (ordersAll[o].eventId === selectedEv.id || ordersAll[o].eventCode === selectedEv.code || ordersAll[o].eventTitle === selectedEv.title) {
						soldForQuota += (ordersAll[o].qty || 1);
					}
				}
			}
		} else {
			for (var e = 0; e < config.events.length; e++) {
				targetQuota += getEventTotalQuota(config.events[e]);
			}
			for (var o2 = 0; o2 < ordersAll.length; o2++) {
				if (ordersAll[o2].status === 'verified') {
					soldForQuota += (ordersAll[o2].qty || 1);
				}
			}
		}

		var remainingQuota = Math.max(0, targetQuota - soldForQuota);

		if (repStatParticipants) repStatParticipants.textContent = totalParticipants.toLocaleString('id-ID') + ' Orang';
		if (repStatTickets) repStatTickets.textContent = totalTickets.toLocaleString('id-ID') + ' Tiket';
		if (repStatRevenue) repStatRevenue.textContent = formatRupiah(totalRevenue);
		if (repStatQuota) repStatQuota.textContent = remainingQuota.toLocaleString('id-ID') + ' Tiket';
		if (reportTableCount) reportTableCount.textContent = String(totalParticipants);

		if (reportActiveBadge) {
			reportActiveBadge.textContent = selectedEv ? selectedEv.title : 'Semua Event Terdaftar';
		}

		if (filtered.length === 0) {
			reportTableWrap.innerHTML = '<div class="elha-event-mini-summary">Belum ada data peserta berstatus Lunas atau Terverifikasi untuk event atau kata kunci pencarian ini.</div>';
			return;
		}

		var html = '<table class="elha-quota-table"><thead><tr>' +
			'<th>No</th>' +
			'<th>Kode Booking</th>' +
			'<th>Nama Peserta</th>' +
			'<th>Kontak (WA / Email)</th>' +
			'<th>Domisili</th>' +
			'<th>Event &amp; Kategori</th>' +
			'<th>Jml</th>' +
			'<th>Total Bayar</th>' +
			'<th>Waktu Verifikasi</th>' +
			'<th>Aksi</th>' +
			'</tr></thead><tbody>';

		for (var k = 0; k < filtered.length; k++) {
			var p = filtered[k];
			var verTime = p.verifiedAt ? p.verifiedAt : (p.createdDateStr || '-');
			html += '<tr>' +
				'<td>' + (k + 1) + '</td>' +
				'<td><strong class="elha-mono-text">' + escapeHtml(p.code) + '</strong></td>' +
				'<td><strong>' + escapeHtml(p.buyerName) + '</strong></td>' +
				'<td><div>' + escapeHtml(p.buyerPhone) + '</div><small style="color:var(--elha-text-muted);">' + escapeHtml(p.buyerEmail || '-') + '</small></td>' +
				'<td>' + escapeHtml(p.buyerAddress || '-') + '</td>' +
				'<td><div>' + escapeHtml(p.eventTitle) + '</div><small style="color:var(--elha-text-muted);">' + escapeHtml(p.tierName) + '</small></td>' +
				'<td class="elha-mono-text"><strong>' + (p.qty || 1) + '</strong></td>' +
				'<td class="elha-mono-text" style="font-weight:700;color:var(--elha-primary);">' + formatRupiah(p.totalAmount || 0) + '</td>' +
				'<td><small>' + escapeHtml(verTime) + '</small></td>' +
				'<td><button type="button" class="elha-table-action-btn is-view-quick" data-rep-view="' + escapeHtml(p.code) + '">Lihat E-Tiket</button></td>' +
				'</tr>';
		}

		html += '</tbody></table>';
		reportTableWrap.innerHTML = html;

		var viewBtns = reportTableWrap.querySelectorAll('[data-rep-view]');
		for (var b = 0; b < viewBtns.length; b++) {
			viewBtns[b].addEventListener('click', function () {
				var code = this.getAttribute('data-rep-view');
				var ord = findOrderByCode(code);
				if (ord) {
					showOrderReceiptModal(ord, true);
				}
			});
		}
	}

	function exportParticipantsExcelCsv() {
		var list = getFilteredReportOrders();
		if (list.length === 0) {
			alert('Tidak ada data peserta terverifikasi untuk diekspor pada filter event saat ini.');
			return;
		}

		var selectedEvId = reportEventFilter ? reportEventFilter.value : 'all';
		var eventSlug = 'semua-event';
		if (selectedEvId !== 'all') {
			var evObj = findEventById(selectedEvId);
			if (evObj) {
				eventSlug = evObj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
			}
		}

		function csvCell(val, isText) {
			var str = String(val == null ? '' : val).trim();
			if (isText && /^0\d+/.test(str)) {
				return '="' + str + '"';
			}
			if (str.indexOf('"') !== -1 || str.indexOf(',') !== -1 || str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) {
				return '"' + str.replace(/"/g, '""') + '"';
			}
			return str;
		}

		var headers = [
			'No',
			'Kode Booking',
			'Status Pembayaran',
			'Nama Peserta',
			'Nomor WhatsApp',
			'Email',
			'Kota Domisili',
			'Judul Event',
			'Kode Event',
			'Kategori Tiket',
			'Jumlah Tiket',
			'Total Pembayaran (Rp)',
			'Tanggal Pemesanan',
			'Waktu Verifikasi Lunas',
			'Catatan Pesanan'
		];

		var csvRows = [];
		csvRows.push(headers.map(function (h) { return csvCell(h, false); }).join(','));

		for (var i = 0; i < list.length; i++) {
			var item = list[i];
			var row = [
				i + 1,
				csvCell(item.code, false),
				csvCell('LUNAS / TERVERIFIKASI', false),
				csvCell(item.buyerName, false),
				csvCell(item.buyerPhone, true),
				csvCell(item.buyerEmail, false),
				csvCell(item.buyerAddress, false),
				csvCell(item.eventTitle, false),
				csvCell(item.eventCode, false),
				csvCell(item.tierName, false),
				item.qty || 1,
				item.totalAmount || 0,
				csvCell(item.createdDateStr, false),
				csvCell(item.verifiedAt || item.createdDateStr, false),
				csvCell(item.buyerNotes, false)
			];
			csvRows.push(row.join(','));
		}

		var csvContent = '\uFEFF' + csvRows.join('\r\n');
		var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		var url = URL.createObjectURL(blob);
		var dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		var filename = 'laporan-peserta-' + eventSlug + '-' + dateStamp + '.csv';

		var link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	if (exportExcelBtn) {
		exportExcelBtn.addEventListener('click', exportParticipantsExcelCsv);
	}
	if (reportEventFilter) {
		reportEventFilter.addEventListener('change', function () {
			renderReportTab();
		});
	}
	if (reportSearchInput) {
		reportSearchInput.addEventListener('input', function () {
			renderReportTab();
		});
	}

	function renderAdminEventsList() {
		updateAdminStats();
		syncSettingsFormFields();
		renderAdminQuotaTable();
		populateReportEventFilter();
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
			var closedField = document.getElementById('elha-ev-closed');
			if (closedField) closedField.checked = false;
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
			var closedField2 = document.getElementById('elha-ev-closed');
			if (closedField2) closedField2.checked = Boolean(ev.is_closed);
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

	// Unlock Admin Studio via /adminelha URL path (or ?admin=elha fallback or Ctrl+Shift+E)
	var shouldAutoOpenAdmin = false;
	(function checkAdminAccess() {
		try {
			var isPathAdmin = /\/adminelha\/?(index\.html)?$/i.test(window.location.pathname);
			var isRouteSession = sessionStorage.getItem('elha_admin_route') === '1';
			if (isRouteSession) {
				sessionStorage.removeItem('elha_admin_route');
			}
			var params = new URLSearchParams(window.location.search);
			var adminParam = params.get('admin');
			if (isPathAdmin || isRouteSession || adminParam === 'elha' || adminParam === '1') {
				if (openAdminBtn) openAdminBtn.hidden = false;
				if (mobileAdminBtn) mobileAdminBtn.hidden = false;
				if (isPathAdmin || isRouteSession) {
					shouldAutoOpenAdmin = true;
				}
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
			var closedField = document.getElementById('elha-ev-closed');
			var isClosedManual = closedField ? closedField.checked : false;

			var newEventObj = {
				id: evId || ('evt-' + Date.now()),
				code: code,
				title: title,
				category: catSlug,
				category_lbl: catRaw,
				featured: isFeat || config.events.length === 0,
				is_closed: isClosedManual,
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
		updateOrdersBadgeAndStats();
		populateReportEventFilter();

		var urlParams = new URLSearchParams(window.location.search);
		var verifyCodeParam = urlParams.get('verify');
		var ticketCodeParam = urlParams.get('ticket');
		var orderDataParam = urlParams.get('od');

		if (orderDataParam) {
			var decodedOrder = decodeOrderPayload(orderDataParam);
			if (decodedOrder) {
				addOrUpdateOrder(decodedOrder);
			}
		}

		if (verifyCodeParam) {
			openAdminStudio(false);
			switchAdminTab('verify');
			var targetOrd = findOrderByCode(verifyCodeParam) || (orderDataParam ? decodeOrderPayload(orderDataParam) : null);
			if (targetOrd) {
				addOrUpdateOrder(targetOrd);
				selectOrderForVerification(targetOrd);
			}
		} else if (ticketCodeParam) {
			var custOrd = findOrderByCode(ticketCodeParam) || (orderDataParam ? decodeOrderPayload(orderDataParam) : null);
			if (custOrd) {
				showOrderReceiptModal(custOrd, custOrd.status === 'verified');
			}
		} else if (shouldAutoOpenAdmin) {
			openAdminStudio(false);
		}

		if (!loadedLocal && window.fetch) {
			var jsonPath = (getBasePath() ? getBasePath() + '/' : '') + 'assets/data/events.json';
			fetch(jsonPath)
				.then(function (res) { return res.ok ? res.json() : null; })
				.then(function (jsonData) {
					if (jsonData && Array.isArray(jsonData.events)) {
						config = jsonData;
						renderAllEventsUI();
						if (shouldAutoOpenAdmin) {
							openAdminStudio(false);
						}
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

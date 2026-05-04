// ============================================================
//  Promotion.js  – Grand Prize & Coupon Promotion System
//  Pure vanilla JS — no HTML/JSX in this file.
//  Connects to app.js State object and renderScreen() flow.
// ============================================================

// --------------- Promotion State ---------------
const PromoState = {
    couponCodes: {
        'HANZI50': { discount: 50, type: 'percent', label: '50% OFF Premium', used: false },
        'DRAGON20': { discount: 20, type: 'percent', label: '20% OFF Shop', used: false },
        'HERO100': { discount: 100, type: 'coins', label: '+100 Bonus Coins', used: false },
        'HSK2026': { discount: 30, type: 'percent', label: '30% OFF Premium', used: false },
    },
    appliedCoupons: [],
    grandPrizeEndDate: new Date('2026-12-31T23:59:59'),
    grandPrizeBannerDismissed: false,
    promoToastTimeout: null,
    // Lucky draw costs (uses State.coins)
    luckyDrawCost: 100,
    voucherCost: 500,
};

// --------------- Points Helpers ---------------
function getPromoCoins() {
    return typeof State !== 'undefined' ? State.coins : 0;
}

function deductPromoCoins(amount) {
    if (typeof State !== 'undefined') {
        State.coins = Math.max(0, State.coins - amount);
        if (typeof updateStats === 'function') updateStats();
    }
}

// --------------- Lucky Draw ---------------
function joinLuckyDraw() {
    const currentCoins = getPromoCoins();
    if (currentCoins >= PromoState.luckyDrawCost) {
        deductPromoCoins(PromoState.luckyDrawCost);
        showPromoToast('🎉 You joined the Lucky Draw! Grand Prize: iPhone 17E');
    } else {
        showPromoToast('❌ Need ' + PromoState.luckyDrawCost + ' coins to join the lucky draw.');
    }
}

// --------------- Voucher Exchange ---------------
function exchangeVoucher() {
    const currentCoins = getPromoCoins();
    if (currentCoins >= PromoState.voucherCost) {
        deductPromoCoins(PromoState.voucherCost);
        showPromoToast('🎟️ Voucher redeemed! Check your email for your coupon.');
    } else {
        showPromoToast('❌ Need ' + PromoState.voucherCost + ' coins to exchange a voucher.');
    }
}

// --------------- Countdown Helpers ---------------
function getCountdownParts() {
    const now = new Date();
    const diff = Math.max(0, PromoState.grandPrizeEndDate - now);
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
}

function formatCountdown() {
    const { days, hours, minutes, seconds } = getCountdownParts();
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

// --------------- Ticker Banner (top of every screen) ---------------
let _tickerInterval = null;

function renderPromoBanner() {
    const old = document.getElementById('promo-ticker-bar');
    if (old) old.remove();
    if (_tickerInterval) { clearInterval(_tickerInterval); _tickerInterval = null; }

    if (PromoState.grandPrizeBannerDismissed) return;

    const bar = document.createElement('div');
    bar.id = 'promo-ticker-bar';
    bar.innerHTML =
        '<div class="promo-ticker-inner">' +
        '<span class="promo-ticker-icon">🏆</span>' +
        '<span class="promo-ticker-text">' +
        'YEAR-END GRAND PRIZE — iPhone 17E &amp; Rp 5,000,000 up for grabs!&nbsp;&nbsp;' +
        'Ends in: <span id="promo-countdown" class="promo-countdown-value">' + formatCountdown() + '</span>' +
        '&nbsp;&nbsp;|&nbsp;&nbsp;Use coupon <strong>HANZI50</strong> for 50% OFF Premium!' +
        '</span>' +
        '<button class="promo-ticker-cta" onclick="openCouponModal()">🎟️ COUPONS</button>' +
        '<button class="promo-ticker-dismiss" onclick="dismissPromoBanner()" title="Dismiss">✕</button>' +
        '</div>';

    const main = document.querySelector('.main-content');
    const topBar = main && main.querySelector('.top-bar');
    if (topBar && topBar.nextSibling) {
        main.insertBefore(bar, topBar.nextSibling);
    } else if (topBar) {
        main.appendChild(bar);
    } else if (main) {
        main.prepend(bar);
    }

    _tickerInterval = setInterval(function () {
        const el = document.getElementById('promo-countdown');
        if (el) { el.textContent = formatCountdown(); }
        else { clearInterval(_tickerInterval); }
    }, 1000);
}

function dismissPromoBanner() {
    PromoState.grandPrizeBannerDismissed = true;
    const bar = document.getElementById('promo-ticker-bar');
    if (bar) {
        bar.classList.add('promo-ticker-dismiss-anim');
        setTimeout(function () { bar.remove(); }, 350);
    }
    if (_tickerInterval) { clearInterval(_tickerInterval); _tickerInterval = null; }
}

// --------------- Floating Promo Pill (persistent) ---------------
function renderPromoFloatingPill() {
    if (document.getElementById('promo-float-pill')) return;
    const pill = document.createElement('button');
    pill.id = 'promo-float-pill';
    pill.innerHTML = '🎟️ Coupons';
    pill.onclick = openCouponModal;
    document.body.appendChild(pill);
}

// --------------- In-Screen Promo Card ---------------
function buildScreenPromoCard() {
    const { days, hours } = getCountdownParts();
    return (
        '<div class="screen-promo-card" id="screen-promo-card">' +
        '<div class="screen-promo-left">' +
        '<div class="screen-promo-title">🏆 Year-End Grand Prize</div>' +
        '<div class="screen-promo-sub">Win an <strong>iPhone 17E</strong> or <strong>Rp 5,000,000</strong> — compete in the leaderboard!</div>' +
        '<div class="screen-promo-countdown">⏳ Ends in <span class="screen-promo-time">' + days + 'd ' + hours + 'h</span></div>' +
        '<div class="screen-promo-coupon-hint">💡 Use coupon <strong>HERO100</strong> to get +100 bonus coins now!</div>' +
        '</div>' +
        '<div class="screen-promo-actions">' +
        '<button class="btn-primary screen-promo-btn" onclick="renderScreen(\'events\')">VIEW PRIZES</button>' +
        '<button class="btn-promo-coupon" onclick="openCouponModal()">🎟️ REDEEM</button>' +
        '</div>' +
        '</div>'
    );
}

function injectScreenPromo() {
    const container = document.getElementById('screen-container');
    if (!container || container.querySelector('#screen-promo-card')) return;
    const div = document.createElement('div');
    div.innerHTML = buildScreenPromoCard();
    container.insertBefore(div.firstElementChild, container.firstChild);
}

// --------------- Coupon Modal ---------------
function openCouponModal() {
    const old = document.getElementById('coupon-modal-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'coupon-modal-overlay';
    overlay.innerHTML =
        '<div class="coupon-modal">' +
        '<div class="coupon-modal-header">' +
        '<h2 class="coupon-modal-title">🎟️ Promotional Coupons</h2>' +
        '<button class="coupon-modal-close" onclick="closeCouponModal()">✕</button>' +
        '</div>' +
        '<p class="coupon-modal-sub">Enter a coupon code or click REDEEM on any active coupon below.</p>' +
        '<div class="coupon-input-row">' +
        '<input id="coupon-input-field" class="coupon-input" type="text" placeholder="Enter coupon code…"' +
        ' oninput="this.value=this.value.toUpperCase()"' +
        ' onkeydown="if(event.key===\'Enter\')redeemTypedCoupon()" />' +
        '<button class="btn-primary coupon-apply-btn" onclick="redeemTypedCoupon()">APPLY</button>' +
        '</div>' +
        '<div id="coupon-input-msg" class="coupon-input-msg"></div>' +
        '<div class="coupon-list">' + buildCouponListHTML() + '</div>' +
        '<div class="coupon-modal-footer">' +
        '<div class="coupon-modal-footer-title">Your Applied Coupons</div>' +
        '<div id="applied-coupons-list">' + buildAppliedCouponsHTML() + '</div>' +
        '</div>' +
        // Lucky draw section
        '<div class="coupon-modal-footer" style="margin-top:20px;">' +
        '<div class="coupon-modal-footer-title">Lucky Draw &amp; Event Rewards</div>' +
        '<p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">' +
        'Your Balance: <strong id="promo-points-display" style="color:var(--primary);">' + getPromoCoins() + ' Coins</strong>' +
        '</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<button class="btn-primary" style="flex:1;font-size:13px;" onclick="joinLuckyDrawModal()">🎰 Lucky Draw (100 Coins)</button>' +
        '<button class="btn-promo-coupon" style="flex:1;" onclick="exchangeVoucherModal()">🎁 Exchange Voucher (500 Coins)</button>' +
        '</div>' +
        '</div>' +
        '</div>';

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeCouponModal();
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('coupon-modal-visible'); });
}

function closeCouponModal() {
    const overlay = document.getElementById('coupon-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('coupon-modal-visible');
    setTimeout(function () { overlay.remove(); }, 300);
}

function buildCouponListHTML() {
    return Object.entries(PromoState.couponCodes).map(function (entry) {
        var code = entry[0], info = entry[1];
        var isApplied = PromoState.appliedCoupons.includes(code);
        var statusClass = (info.used || isApplied) ? 'coupon-card-used' : 'coupon-card-active';
        var statusLabel = isApplied ? '✅ Applied' : (info.used ? '✗ Used' : '🔓 Available');
        return (
            '<div class="coupon-card ' + statusClass + '">' +
            '<div class="coupon-card-left">' +
            '<div class="coupon-card-code">' + code + '</div>' +
            '<div class="coupon-card-label">' + info.label + '</div>' +
            '<div class="coupon-card-status">' + statusLabel + '</div>' +
            '</div>' +
            '<div class="coupon-card-right">' +
            (!info.used && !isApplied
                ? '<button class="btn-primary coupon-redeem-btn" onclick="redeemCoupon(\'' + code + '\')">REDEEM</button>'
                : '<div class="coupon-used-badge">' + (isApplied ? 'APPLIED' : 'USED') + '</div>'
            ) +
            '</div>' +
            '</div>'
        );
    }).join('');
}

function buildAppliedCouponsHTML() {
    if (PromoState.appliedCoupons.length === 0) {
        return '<p style="color:var(--text-muted);font-size:13px;">No coupons applied yet.</p>';
    }
    return PromoState.appliedCoupons.map(function (code) {
        return '<div class="applied-coupon-chip">🎟️ ' + code + ' — ' + PromoState.couponCodes[code].label + '</div>';
    }).join('');
}

function redeemTypedCoupon() {
    var input = document.getElementById('coupon-input-field');
    if (!input) return;
    redeemCoupon(input.value.trim().toUpperCase());
    input.value = '';
}

function redeemCoupon(code) {
    var info = PromoState.couponCodes[code];

    if (!info) {
        showCouponMsg('❌ Invalid coupon code. Please try again.', 'error');
        return;
    }
    if (info.used || PromoState.appliedCoupons.includes(code)) {
        showCouponMsg('⚠️ This coupon has already been used.', 'warn');
        return;
    }

    info.used = true;
    PromoState.appliedCoupons.push(code);

    if (info.type === 'coins' && typeof State !== 'undefined') {
        State.coins += info.discount;
        if (typeof updateStats === 'function') updateStats();
    }

    showCouponMsg('✅ Coupon <strong>' + code + '</strong> applied! ' + info.label, 'success');
    showPromoToast('🎟️ ' + info.label + ' applied!');

    // Refresh modal UI
    const ptsDisplay = document.getElementById('promo-points-display');
    if (ptsDisplay) ptsDisplay.textContent = getPromoCoins() + ' Coins';

    var list = document.querySelector('.coupon-list');
    if (list) list.innerHTML = buildCouponListHTML();

    var applied = document.getElementById('applied-coupons-list');
    if (applied) applied.innerHTML = buildAppliedCouponsHTML();
}

function showCouponMsg(html, type) {
    var el = document.getElementById('coupon-input-msg');
    if (!el) return;
    el.innerHTML = html;
    el.className = 'coupon-input-msg coupon-msg-' + type;
    setTimeout(function () { if (el) { el.innerHTML = ''; el.className = 'coupon-input-msg'; } }, 4000);
}

// --------------- Lucky Draw & Voucher from Modal ---------------
function joinLuckyDrawModal() {
    joinLuckyDraw();
    // refresh coins display inside modal if open
    var pts = document.getElementById('promo-points-display');
    if (pts) pts.textContent = getPromoCoins() + ' Coins';
}

function exchangeVoucherModal() {
    exchangeVoucher();
    var pts = document.getElementById('promo-points-display');
    if (pts) pts.textContent = getPromoCoins() + ' Coins';
}

// --------------- Toast Notification ---------------
function showPromoToast(message) {
    if (PromoState.promoToastTimeout) clearTimeout(PromoState.promoToastTimeout);

    var toast = document.getElementById('promo-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'promo-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.classList.add('promo-toast-visible');

    PromoState.promoToastTimeout = setTimeout(function () {
        if (toast) toast.classList.remove('promo-toast-visible');
    }, 3500);
}

// --------------- Init ---------------
function initPromoSystem() {
    renderPromoBanner();
    renderPromoFloatingPill();
}

const firebaseConfig = {
    apiKey: "AIzaSyDNPdxQMMPUO1Gn-hQztcy0GEGcmA22PWs",
    authDomain: "legends-market-446ca.firebaseapp.com",
    databaseURL: "https://legends-market-446ca-default-rtdb.firebaseio.com",
    projectId: "legends-market-446ca",
    storageBucket: "legends-market-446ca.firebasestorage.app",
    messagingSenderId: "981095007194",
    appId: "1:981095007194:web:edfd31d3ed4c6f125e36e3",
    measurementId: "G-6ZFRFPDXYS"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;
let pendingAccountToBuy = null;
window.siteProducts = {}; // مصفوفة لحفظ البيانات لمعرض الصور

const WALLETS = {
    "شام كاش (Sham Cash)": "ed5ecbd40a49c60a90f59a7c0ccb72f5",
    "بينانس (Binance Pay)": "TMbdBtgbuxH2bjg4uzRkJriSKeZZq5AdFU"
};

window.toggleCategorySection = function(category) {
    const btnPubg = document.getElementById('btn-pubg');
    const btnClash = document.getElementById('btn-clash');
    const secPubg = document.getElementById('pubg-section');
    const secClash = document.getElementById('clash-section');
    if(btnPubg) btnPubg.classList.remove('active-card');
    if(btnClash) btnClash.classList.remove('active-card');
    if(secPubg) { secPubg.style.display = 'none'; }
    if(secClash) { secClash.style.display = 'none'; }

    if (category === 'pubg') {
        if(btnPubg) btnPubg.classList.add('active-card');
        if(secPubg) { secPubg.style.display = 'block'; }
    } else if (category === 'clash') {
        if(btnClash) btnClash.classList.add('active-card');
        if(secClash) { secClash.style.display = 'block'; }
    }
};

window.updateWalletDisplay = function() {
    const methodEl = document.getElementById('payment-method');
    const displayBox = document.getElementById('wallet-display-box');
    if (methodEl && displayBox) { displayBox.innerText = WALLETS[methodEl.value] || ""; }
};

window.toggleTheme = function() {
    const isLight = document.getElementById('theme-toggle').checked;
    if (isLight) { document.documentElement.setAttribute('data-theme', 'light'); } 
    else { document.documentElement.removeAttribute('data-theme'); }
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if(sidebar && overlay) {
        if(sidebar.style.right === "0px") {
            sidebar.style.right = "-300px"; overlay.style.display = 'none';
        } else {
            sidebar.style.right = "0px"; overlay.style.display = 'block';
        }
    }
};

window.openAuthModal = function() { document.getElementById('auth-modal').style.display = 'flex'; window.switchForm('login'); };
window.closeAuthModal = function() { document.getElementById('auth-modal').style.display = 'none'; };
window.closePaymentModal = function() { document.getElementById('payment-modal').style.display = 'none'; };

window.openOrdersModal = function() {
    if (!currentUser) { alert("سجل دخولك أولاً لرؤية سلة مشترياتك ومبيعاتك!"); window.openAuthModal(); return; }
    
    // إخفاء الإشعار عند الدخول للقائمة (تحديث العدد المقروء)
    const completed = document.querySelectorAll('.status-completed, .status-rejected').length;
    localStorage.setItem('seenItems_' + currentUser.uid, completed);
    updateBadge(completed); // تصفير الشارة

    document.getElementById('orders-modal').style.display = 'flex';
};

window.closeOrdersModal = function() { document.getElementById('orders-modal').style.display = 'none'; };

window.switchForm = function(type) {
    const loginF = document.getElementById('login-form');
    const registerF = document.getElementById('register-form');
    if (type === 'login') { loginF.style.display = 'block'; registerF.style.display = 'none'; } 
    else { loginF.style.display = 'none'; registerF.style.display = 'block'; }
};

window.handleAuthAction = function() {
    if (currentUser) { if (confirm("هل تريد تسجيل الخروج فعلاً يا بطل؟")) { auth.signOut(); } } 
    else { window.openAuthModal(); }
};

window.buyAccount = function(title, price, category, secretInfo = "") {
    if (!currentUser) { alert("يرجى تسجيل الدخول أولاً لمتابعة طلبياتك!"); window.openAuthModal(); return; }
    pendingAccountToBuy = { title, price, category, secretInfo };
    document.getElementById('payment-modal-title').innerText = `💸 دفع ${price}$ لـ ${title}`;
    document.getElementById('payment-ref-id').value = '';
    document.getElementById('payment-modal').style.display = 'flex';
    window.updateWalletDisplay();
};

// --- معرض الصور الذكي بديل لـ img.html ---
window.openGallery = function(prodId) {
    const prod = window.siteProducts[prodId];
    if(!prod) return;
    const images = [prod.img, prod.img2, prod.img3, prod.img4].filter(i => i && i.trim() !== '');
    if(images.length === 0) return;

    const modal = document.getElementById('gallery-modal');
    const mainImg = document.getElementById('gallery-main-img');
    const thumbs = document.getElementById('gallery-thumbs');
    
    mainImg.src = images[0];
    thumbs.innerHTML = '';
    
    images.forEach(src => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.style.width = '60px'; thumb.style.height = '60px'; thumb.style.objectFit = 'cover';
        thumb.style.borderRadius = '8px'; thumb.style.cursor = 'pointer'; thumb.style.border = '2px solid transparent';
        thumb.onclick = () => { mainImg.src = src; };
        thumbs.appendChild(thumb);
    });
    if(modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
};

window.closeGallery = function() {
    document.getElementById('gallery-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

function listenToProducts() {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        const pubgContainer = document.getElementById('pubg-products-container');
        const clashContainer = document.getElementById('clash-products-container');
        if(pubgContainer) pubgContainer.innerHTML = '';
        if(clashContainer) clashContainer.innerHTML = '';

        if (data) {
            for (let id in data) {
                const prod = data[id];
                window.siteProducts[id] = prod; // حفظ البيانات للمعرض

                const cardHTML = `
                    <div class="product-card">
                        <a href="javascript:void(0)" onclick="openGallery('${id}')" style="display: block; text-decoration: none;">
                            <img class="product-img" src="${prod.img || 'https://via.placeholder.com/450x200'}" alt="${prod.category}" title="اضغط لمشاهدة صور الحساب كاملة">
                        </a>
                        <div class="product-details">
                            <div class="product-title">${prod.title}</div>
                            <div class="product-price">${prod.price} $</div>
                            <button class="buy-btn" style="${prod.category === 'ببجي موبايل' ? 'background-color: var(--pubg-color);' : ''} cursor: pointer;" onclick="buyAccount('${prod.title}', '${prod.price}', '${prod.category}', '${prod.secret || ""}')">
                                🛒 شراء آمن وفوري ⚡
                            </button>
                        </div>
                    </div>
                `;
                if (prod.category === 'ببجي موبايل' && pubgContainer) pubgContainer.innerHTML += cardHTML;
                else if (prod.category === 'كلاش أوف كلانس' && clashContainer) clashContainer.innerHTML += cardHTML;
            }
        }
    });
}

auth.onAuthStateChanged((user) => {
    const statusText = document.getElementById('user-status-text');
    const navBtn = document.getElementById('login-nav-btn');
    if (user) {
        currentUser = user;
        if(statusText) statusText.innerText = `👤 متصل بـ: ${user.email}`;
        if(navBtn) { navBtn.innerText = "🚪 تسجيل الخروج"; navBtn.style.backgroundColor = "#ff4545"; navBtn.style.color = "#fff"; }
        listenToUserDashboard();
    } else {
        currentUser = null;
        if(statusText) statusText.innerText = `🎯 تصفح كـ زائر.. سجل دخولك لتوثيق مشترياتك`;
        if(navBtn) { navBtn.innerText = "👤 تسجيل الدخول"; navBtn.style.backgroundColor = "var(--accent-color)"; navBtn.style.color = "#000"; }
        document.getElementById('orders-container').innerHTML = `<p style="text-align:center;font-size:13px;opacity:0.7;">لا يوجد طلبات حتى الآن</p>`;
        updateBadge(0); // إخفاء الإشعار
    }
});

function listenToUserDashboard() {
    if (!currentUser) return;
    
    let userItems = [];
    let completedItemsCount = 0;

    // جلب المشتريات
    db.ref('orders').on('value', (snapshot) => {
        const data = snapshot.val();
        userItems = userItems.filter(item => item.type !== 'order'); 
        if (data) {
            for (let id in data) {
                if (data[id].userEmail === currentUser.email) {
                    userItems.push({ ...data[id], id, type: 'order', timestamp: data[id].timestamp || 0 });
                    if(data[id].status !== 'pending') completedItemsCount++;
                }
            }
        }
        renderDashboard(userItems, completedItemsCount);
    });

    // جلب المبيعات الخاصة بالزبون
    db.ref('sell_requests').on('value', (snapshot) => {
        const data = snapshot.val();
        userItems = userItems.filter(item => item.type !== 'sell'); 
        if (data) {
            for (let id in data) {
                if (data[id].userEmail === currentUser.email) {
                    userItems.push({ ...data[id], id, type: 'sell', timestamp: data[id].timestamp || 0 });
                    if(data[id].status !== 'pending') completedItemsCount++;
                }
            }
        }
        renderDashboard(userItems, completedItemsCount);
    });
}

function renderDashboard(items, completedCount) {
    items.sort((a, b) => b.timestamp - a.timestamp); // الأحدث أولاً
    const container = document.getElementById('orders-container');
    if(!container) return;
    container.innerHTML = '';

    if(items.length === 0) {
        container.innerHTML = `<p style="text-align:center;font-size:13px;opacity:0.7;">لا يوجد طلبات شراء أو بيع حتى الآن</p>`;
        updateBadge(completedCount); return;
    }

    items.forEach(item => {
        if (item.type === 'order') {
            let statusText = 'قيد التحقق من الدفع ⏳'; let statusClass = 'status-pending'; let extraDetails = '';
            if (item.status === 'completed') {
                statusText = 'تم تسليم الحساب بنجاح ✅'; statusClass = 'status-completed';
                extraDetails = `<div style="background: rgba(46, 196, 182, 0.1); border: 1.5px solid var(--pubg-color); padding: 10px; border-radius: 8px; margin-top: 8px; font-weight: bold; color: var(--text-color); font-size:13px; text-align: center;">🗝️ معلومات الحساب المستلم:<br><span style="color:#fff; font-family: monospace; word-break: break-all;">${item.accountInfo}</span></div>`;
            } else if (item.status === 'rejected') {
                statusText = 'مرفوض بسبب الدفع ❌'; statusClass = 'status-rejected';
                extraDetails = `<p style="font-size: 12px; color: #ff4545; margin-top: 5px; font-weight: bold;">🚫 نأسف، لم نتمكن من مطابقة رقم العملية المالي.</p>`;
            }
            container.innerHTML += `
                <div class="order-item">
                    <div class="order-header"><span>شراء: ${item.title}</span><span class="order-status ${statusClass}">${statusText}</span></div>
                    <p style="font-size: 13px; opacity: 0.8; margin-bottom: 2px;">رقم المعاملة: <span style="color: var(--accent-color); font-weight: bold;">${item.refId}</span></p>
                    <p style="font-size: 14px; color: var(--accent-color); font-weight: bold;">المبلغ: ${item.price}$</p>
                    ${extraDetails}
                </div>`;
        } else if (item.type === 'sell') {
            let statusText = 'طلبك قيد المراجعة ⏳'; let statusClass = 'status-pending'; let extraDetails = '';
            if (item.status === 'approved') {
                statusText = 'مقبول ومعروض بالمتجر ✅'; statusClass = 'status-completed';
                extraDetails = `<div style="background: rgba(46, 196, 182, 0.1); border: 1px solid #2ec4b6; padding: 8px; border-radius: 8px; margin-top: 8px; font-size:13px; text-align: center; font-weight:bold;">💬 رد الإدارة ضياء: ${item.adminReply || 'تم النشر بنجاح'}</div>`;
            } else if (item.status === 'rejected') {
                statusText = 'مرفوض ❌'; statusClass = 'status-rejected';
                extraDetails = `<div style="background: rgba(255, 69, 69, 0.1); border: 1px solid #ff4545; padding: 8px; border-radius: 8px; margin-top: 8px; font-size:13px; color: #ff4545; text-align: center; font-weight:bold;">💬 سبب الرفض: ${item.adminReply || 'غير مطابق للشروط'}</div>`;
            }
            container.innerHTML += `
                <div class="order-item" style="border-right: 4px solid #ffcc00;">
                    <div class="order-header"><span>بيع: ${item.title}</span><span class="order-status ${statusClass}">${statusText}</span></div>
                    <p style="font-size: 13px; opacity: 0.8; margin-bottom: 2px;">السعر المطلوب: ${item.price}$</p>
                    ${extraDetails}
                </div>`;
        }
    });
    updateBadge(completedCount);
}

function updateBadge(currentCount) {
    if(!currentUser) return;
    const lastSeenCount = parseInt(localStorage.getItem('seenItems_' + currentUser.uid)) || 0;
    const unseen = currentCount - lastSeenCount;
    
    const mainBadge = document.getElementById('main-menu-badge');
    const sidebarBadge = document.getElementById('sidebar-orders-badge');
    
    if (unseen > 0) {
        if(mainBadge) { mainBadge.innerText = unseen; mainBadge.style.display = 'inline-block'; }
        if(sidebarBadge) { sidebarBadge.innerText = unseen; sidebarBadge.style.display = 'inline-block'; }
    } else {
        if(mainBadge) mainBadge.style.display = 'none';
        if(sidebarBadge) sidebarBadge.style.display = 'none';
    }
}

window.submitLogin = function() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if(!email || !pass) return;
    auth.signInWithEmailAndPassword(email, pass).then(() => window.closeAuthModal()).catch(err => alert("خطأ: " + err.message));
};

window.submitRegister = function() {
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    if(!email || !pass) return;
    auth.createUserWithEmailAndPassword(email, pass).then(() => window.closeAuthModal()).catch(err => alert("خطأ: " + err.message));
};

window.submitPayment = function() {
    const method = document.getElementById('payment-method').value;
    const refId = document.getElementById('payment-ref-id').value.trim();
    if (!refId) { alert("يرجى إدخال رقم العملية."); return; }
    if (!pendingAccountToBuy) return;

    db.ref('orders').push().set({
        title: pendingAccountToBuy.title,
        price: pendingAccountToBuy.price,
        category: pendingAccountToBuy.category,
        status: "pending",
        method: method,
        refId: refId,
        userEmail: currentUser ? currentUser.email : "unknown@user.com",
        accountInfo: "",
        secretInfo: pendingAccountToBuy.secretInfo || "",
        timestamp: Date.now()
    }).then(() => {
        alert("تم إرسال الطلب بنجاح! سيتم التحقق منه من قبل الإدارة فوراً ⚡");
        window.closePaymentModal(); window.openOrdersModal();
    }).catch(err => alert("فشل: " + err.message));
};

document.addEventListener("DOMContentLoaded", () => {
    window.toggleCategorySection('pubg');
    window.updateWalletDisplay();
    listenToProducts();
});
                                            

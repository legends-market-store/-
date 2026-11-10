// app.js - سوق الأساطير (نسخة الحسابات الحقيقية بدون أي أكواد روابط خارجية)

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

// تهيئة فايربيس
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;
let pendingAccountToBuy = null;

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
    if (methodEl && displayBox) {
        const method = methodEl.value;
        displayBox.innerText = WALLETS[method] || "";
    }
};

window.toggleTheme = function() {
    const isLight = document.getElementById('theme-toggle').checked;
    if (isLight) {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if(sidebar && overlay) {
        if(sidebar.style.right === "0px") {
            sidebar.style.right = "-300px";
            overlay.style.display = 'none';
        } else {
            sidebar.style.right = "0px";
            overlay.style.display = 'block';
        }
    }
};

window.openAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if(modal) modal.style.display = 'flex';
    window.switchForm('login');
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if(modal) modal.style.display = 'none';
};

window.closePaymentModal = function() {
    const modal = document.getElementById('payment-modal');
    if(modal) modal.style.display = 'none';
};

window.openOrdersModal = function() {
    if (!currentUser) {
        alert("سجل دخولك أولاً لرؤية سلة مشترياتك!");
        window.openAuthModal();
        return;
    }
    const modal = document.getElementById('orders-modal');
    if(modal) modal.style.display = 'flex';
};

window.closeOrdersModal = function() {
    const modal = document.getElementById('orders-modal');
    if(modal) modal.style.display = 'none';
};

// --- دالة التبديل بين النماذج ---
window.switchForm = function(type) {
    const forms = {
        'login': document.getElementById('login-form'),
        'register': document.getElementById('register-form'),
        'forgot': document.getElementById('forgot-form'),
        'reset-pass': document.getElementById('reset-pass-form')
    };

    Object.keys(forms).forEach(key => {
        const form = forms[key];
        if (form) {
            if (key === type) {
                form.style.display = 'block';
                form.classList.add('active');
            } else {
                form.style.display = 'none';
                form.classList.remove('active');
            }
        }
    });
};

window.handleAuthAction = function() {
    if (currentUser) {
        if (confirm("هل تريد تسجيل الخروج فعلاً يا بطل؟")) {
            auth.signOut();
        }
    } else {
        window.openAuthModal();
    }
};

window.buyAccount = function(title, price, category, secretInfo = "") {
    if (!currentUser) {
        alert("يرجى تسجيل الدخول أولاً لتثبيت ومتابعة طلبياتك!");
        window.openAuthModal();
        return;
    }
    pendingAccountToBuy = { title, price, category, secretInfo };
    const payTitle = document.getElementById('payment-modal-title');
    const payRef = document.getElementById('payment-ref-id');
    const payModal = document.getElementById('payment-modal');
    
    if(payTitle) payTitle.innerText = `💸 دفع ${price}$ لـ ${title}`;
    if(payRef) payRef.value = '';
    if(payModal) payModal.style.display = 'flex';
    window.updateWalletDisplay();
};

window.openProductGallery = function(productId, img1, img2, img3, img4) {
    localStorage.setItem('gallery_img1', img1 || '');
    localStorage.setItem('gallery_img2', img2 || '');
    localStorage.setItem('gallery_img3', img3 || '');
    localStorage.setItem('gallery_img4', img4 || '');
    window.location.href = `img.html?id=${productId}`;
};

function listenToProducts() {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        const pubgContainer = document.getElementById('pubg-products-container');
        const clashContainer = document.getElementById('clash-products-container');

        if(pubgContainer) pubgContainer.innerHTML = '';
        if(clashContainer) clashContainer.innerHTML = '';

        if (!data) {
            if(pubgContainer) pubgContainer.innerHTML = '<p style="text-align:center; padding: 20px; opacity: 0.7;">لا توجد حسابات ببجي منشورة حالياً.</p>';
            if(clashContainer) clashContainer.innerHTML = '<p style="text-align:center; padding: 20px; opacity: 0.7;">لا توجد حسابات كلاش منشورة حالياً.</p>';
            return;
        }

        for (let id in data) {
            const prod = data[id];
            
            const cardHTML = `
                <div class="product-card">
                    <a href="#" onclick="openProductGallery('${id}', '${prod.img || ''}', '${prod.img2 || ''}', '${prod.img3 || ''}', '${prod.img4 || ''}'); return false;" style="display: block; text-decoration: none;">
                        <img class="product-img" src="${prod.img || 'https://via.placeholder.com/450x200'}" alt="${prod.category}" title="اضغط لمشاهدة صور الحساب كاملة">
                    </a>
                    <div class="product-details">
                        <div class="product-title">${prod.title}</div>
                        <div class="product-price">${prod.price} $</div>
                        <button class="buy-btn" style="${prod.category === 'ببجي موبايل' ? 'background-color: var(--pubg-color);' : ''} cursor: pointer;" onclick="buyAccount('${prod.title}', '${prod.price}', '${prod.category}', '${prod.secret || ""}')">
                            شراء
                        </button>
                    </div>
                </div>
            `;

            if (prod.category === 'ببجي موبايل' && pubgContainer) {
                pubgContainer.innerHTML += cardHTML;
            } else if (prod.category === 'كلاش أوف كلانس' && clashContainer) {
                clashContainer.innerHTML += cardHTML;
            }
        }

        if (pubgContainer && pubgContainer.innerHTML.trim() === '') {
            pubgContainer.innerHTML = '<p style="text-align:center; padding: 20px; opacity: 0.7;">لا توجد حسابات ببجي منشورة حالياً.</p>';
        }
        if (clashContainer && clashContainer.innerHTML.trim() === '') {
            clashContainer.innerHTML = '<p style="text-align:center; padding: 20px; opacity: 0.7;">لا توجد حسابات كلاش منشورة حالياً.</p>';
        }
    });
}

auth.onAuthStateChanged((user) => {
    const statusText = document.getElementById('user-status-text');
    const navBtn = document.getElementById('login-nav-btn');
    const ordersContainer = document.getElementById('orders-container');

    if (user) {
        currentUser = user;
        if(statusText) statusText.innerText = `👤 متصل بـ: ${user.email}`;
        
        if(navBtn) {
            navBtn.innerText = "🚪 تسجيل الخروج";
            navBtn.style.backgroundColor = "#ff4545";
            navBtn.style.color = "#fff";
        }
        listenToOrders();
    } else {
        currentUser = null;
        if(statusText) statusText.innerText = `🎯 تصفح كـ زائر.. سجل دخولك لتوثيق مشترياتك`;
        
        if(navBtn) {
            navBtn.innerText = "👤 تسجيل الدخول";
            navBtn.style.backgroundColor = "var(--accent-color)";
            navBtn.style.color = "#000";
        }
        if(ordersContainer) ordersContainer.innerHTML = `<p style="text-align:center;font-size:13px;opacity:0.7;">لا يوجد طلبات حتى الآن</p>`;
    }
});

function listenToOrders() {
    db.ref('orders').on('value', (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('orders-container');
        if(!container) return;
        container.innerHTML = '';

        if (!currentUser) return;

        const myOrders = [];
        for (let id in data) {
            if (data[id].userEmail === currentUser.email) {
                myOrders.push(data[id]);
            }
        }

        if(myOrders.length === 0) {
            container.innerHTML = `<p style="text-align:center;font-size:13px;opacity:0.7;">لا يوجد طلبات حتى الآن</p>`;
            return;
        }

        myOrders.reverse().forEach(order => {
            let statusText = 'قيد التحقق من الدفع ⏳';
            let statusClass = 'status-pending';
            let extraDetails = '';

            if (order.status === 'completed') {
                statusText = 'تم تسليم الحساب بنجاح ✅';
                statusClass = 'status-completed';
                extraDetails = `<div style="background: rgba(46, 196, 182, 0.1); border: 1.5px solid var(--pubg-color); padding: 10px; border-radius: 8px; margin-top: 8px; font-weight: bold; color: var(--text-color); font-size:13px; text-align: center;">🗝️ معلومات الحساب المستلم:<br><span style="color:#fff; font-family: monospace; word-break: break-all;">${order.accountInfo}</span></div>`;
            } else if (order.status === 'rejected') {
                statusText = 'مرفوض بسبب عدم الدفع ❌';
                statusClass = 'status-rejected';
                extraDetails = `<p style="font-size: 12px; color: #ff4545; margin-top: 5px; font-weight: bold;">🚫 نأسف، لم نتمكن من مطابقة رقم العملية المالي.</p>`;
            }
            
            container.innerHTML += `
                <div class="order-item">
                    <div class="order-header">
                        <span>${order.title}</span>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <p style="font-size: 13px; opacity: 0.8; margin-bottom: 2px;">القسم: ${order.category}</p>
                    <p style="font-size: 13px; opacity: 0.8; margin-bottom: 2px;">طريقة الدفع: ${order.method}</p>
                    <p style="font-size: 13px; opacity: 0.8; margin-bottom: 5px;">رقم المعاملة: <span style="color: var(--accent-color); font-weight: bold;">${order.refId}</span></p>
                    <p style="font-size: 14px; color: var(--accent-color); font-weight: bold;">المبلغ: ${order.price}$</p>
                    ${extraDetails}
                </div>
            `;
        });
    });
}

window.submitLogin = function() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if(!email || !pass) { alert("يرجى ملء الحقول"); return; }
    auth.signInWithEmailAndPassword(email, pass)
        .then(() => window.closeAuthModal())
        .catch(err => alert("خطأ في الدخول: " + err.message));
};

window.submitRegister = function() {
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    if(!email || !pass) { alert("يرجى ملء الحقول"); return; }
    auth.createUserWithEmailAndPassword(email, pass)
        .then(() => window.closeAuthModal())
        .catch(err => alert("خطأ في التسجيل: " + err.message));
};

window.submitForgotPassword = function() {
    const emailField = document.getElementById('reset-email');
    const email = emailField ? emailField.value.trim() : '';
    if (!email) {
        alert("يرجى إدخال البريد الإلكتروني أولاً.");
        return;
    }
    // دالة الإرسال الأصلية بدون أي روابط معقدة بالموقع
    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert("تم إرسال تعليمات استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح! 📩");
            window.switchForm('login');
        })
        .catch(err => {
            alert("حدث خطأ أثناء الإرسال: " + err.message);
        });
};

window.submitResetPassword = function() {
    alert("تم تحديث الطلب بنجاح!");
    window.switchForm('login');
};

window.submitPayment = function() {
    const method = document.getElementById('payment-method').value;
    const refId = document.getElementById('payment-ref-id').value.trim();
    
    if (!refId) { 
        alert("يرجى إدخال رقم العملية للتحقق."); 
        return; 
    }

    if (!pendingAccountToBuy) {
        alert("خطأ: يرجى إغلاق النافذة وإعادة اختيار الحساب.");
        return;
    }

    const newOrderRef = db.ref('orders').push();
    newOrderRef.set({
        title: pendingAccountToBuy.title,
        price: pendingAccountToBuy.price,
        category: pendingAccountToBuy.category,
        status: "pending",
        method: method,
        refId: refId,
        userEmail: currentUser ? currentUser.email : "unknown@user.com",
        accountInfo: "",
        secretInfo: pendingAccountToBuy.secretInfo || ""
    }).then(() => {
        alert("تم إرسال الطلب بنجاح! سيتم التحقق منه من قبل الإدارة فوراً ⚡");
        window.closePaymentModal();
        window.openOrdersModal();
    }).catch(err => alert("فشل إرسال الطلب: " + err.message));
};

document.addEventListener("DOMContentLoaded", () => {
    window.toggleCategorySection('pubg');
    window.updateWalletDisplay();
    listenToProducts();
});
    

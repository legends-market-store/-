const firebaseConfig = {
    apiKey: "AIzaSyDNPdxQMMPUO1Gn-hQztcy0GEGcmA22PWs",
    authDomain: "legends-market-446ca.firebaseapp.com",
    databaseURL: "https://legends-market-446ca-default-rtdb.firebaseio.com",
    projectId: "legends-market-446ca",
    storageBucket: "legends-market-446ca.firebasestorage.app",
    messagingSenderId: "981095007194",
    appId: "1:981095007194:web:edfd31d3ed4c6f125e36e3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

const SECRET_ENCRYPTION_KEY = "DyaaSukAlAsateerSecurityKey2026";
let editModeId = null;

function login() {
    const email = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if(!email || !pass) {
        alert("الرجاء إدخال الإيميل وكلمة المرور الخاصة بالأدمن.");
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            alert("أهلاً بك يا مدير ضياء!");
            document.getElementById('login-page').classList.remove('active');
            document.getElementById('dashboard-page').classList.add('active');
            listenToFirebaseProducts();
            listenToFirebaseOrders();
            listenToSellRequests();
        })
        .catch(err => {
            alert("فشل تسجيل الدخول: " + err.message);
        });
}

function listenToSellRequests() {
    db.ref('sell_requests').on('value', (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('sell-requests-container');
        container.innerHTML = '';

        if (!data) {
            container.innerHTML = '<div class="info-text">لا توجد طلبات بيع معلقة حالياً.</div>';
            return;
        }

        let hasRequests = false;
        for (let id in data) {
            const req = data[id];
            if (req.status === 'pending') {
                hasRequests = true;
                const card = document.createElement('div');
                card.className = 'inventory-card';
                card.style.borderColor = '#25D366';
                
                let imagesHTML = '';
                if(req.img1) imagesHTML += `<img src="${req.img1}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; margin-left:5px;">`;
                if(req.img2) imagesHTML += `<img src="${req.img2}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; margin-left:5px;">`;
                if(req.img3) imagesHTML += `<img src="${req.img3}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; margin-left:5px;">`;

                card.innerHTML = `
                    <div class="inventory-card-title">🎮 القسم: ${req.category}</div>
                    <div class="inventory-card-title">📝 العنوان: ${req.title}</div>
                    <div class="inventory-card-price">💰 السعر المطلوب: ${req.price} $</div>
                    <div class="inventory-card-price" style="color: #fff;">📧 الإيميل: ${req.email}</div>
                    <div class="inventory-card-price" style="color: #ffcc00;">🔑 كلمة السر: ${req.pass}</div>
                    <div style="margin-top: 5px;">${imagesHTML}</div>
                    <div class="inventory-card-actions">
                        <button class="action-btn confirm-pay-btn" style="background:#25D366;" onclick="approveAndPublishSellRequest('${id}')">✅ قبول ونشر بالمتجر</button>
                        <button class="action-btn reject-pay-btn" onclick="rejectSellRequest('${id}')">❌ رفض الطلب</button>
                    </div>
                `;
                container.appendChild(card);
            }
        }

        if (!hasRequests) {
            container.innerHTML = '<div class="info-text">لا توجد طلبات بيع معلقة حالياً.</div>';
        }
    });
}

function approveAndPublishSellRequest(reqId) {
    db.ref(`sell_requests/${reqId}`).once('value').then(snapshot => {
        const req = snapshot.val();
        if (!req) return;

        if (confirm(`هل تم فحص الحساب (${req.title}) والتأكد منه وتريد نشره فوراً بالمتجر؟`)) {
            const secretRaw = `الإيميل: ${req.email} | كلمة السر: ${req.pass}`;
            const encryptedSecret = CryptoJS.AES.encrypt(secretRaw, SECRET_ENCRYPTION_KEY).toString();

            const newProdRef = db.ref('products').push();
            newProdRef.set({
                category: req.category,
                title: req.title,
                price: req.price,
                img: req.img1 || '',
                img2: req.img2 || '',
                img3: req.img3 || '',
                img4: '',
                secret: encryptedSecret
            }).then(() => {
                db.ref(`sell_requests/${reqId}`).update({ status: 'approved' });
                alert("تمت الموافقة ونشر الحساب بالمتجر بنجاح! 🚀");
            });
        }
    });
}

function rejectSellRequest(reqId) {
    if (confirm("هل أنت متأكد من رفض طلب البيع هذا؟")) {
        db.ref(`sell_requests/${reqId}`).update({ status: 'rejected' })
        .then(() => alert("تم رفض الطلب بنجاح ❌"));
    }
}

function listenToFirebaseOrders() {
    db.ref('orders').on('value', (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('pending-container');
        container.innerHTML = '';

        if (!data) {
            container.innerHTML = '<div class="info-text">لا توجد طلبات معلقة بانتظارك حالياً.</div>';
            return;
        }

        let hasPending = false;
        for (let id in data) {
            const order = data[id];
            if (order.status === 'pending') {
                hasPending = true;
                const card = document.createElement('div');
                card.className = 'inventory-card';
                card.style.borderColor = '#2ec4b6';
                card.innerHTML = `
                    <div class="inventory-card-title">📧 إيميل العميل: ${order.userEmail}</div>
                    <div class="inventory-card-price">🛍️ اسم المنتج المطلوب: ${order.title}</div>
                    <div class="inventory-card-price">🏦 طريقة الدفع: ${order.method}</div>
                    <div class="inventory-card-price" style="color: #ffcc00; font-family: monospace;">🔢 كود / رقم العملية: ${order.refId}</div>
                    <div class="inventory-card-price" style="color: #2ec4b6;">💰 السعر المطلوب: ${order.price} $</div>
                    <div class="inventory-card-actions">
                        <button class="action-btn confirm-pay-btn" onclick="confirmPaymentAndRelease('${id}', '${order.userEmail}', '${order.secretInfo || ''}')">✅ قبول وإرسال الحساب</button>
                        <button class="action-btn reject-pay-btn" onclick="rejectOrder('${id}')">❌ رفض</button>
                    </div>
                `;
                container.appendChild(card);
            }
        }

        if (!hasPending) {
            container.innerHTML = '<div class="info-text">لا توجد طلبات معلقة بانتظارك حالياً.</div>';
        }
    });
}

function confirmPaymentAndRelease(orderId, email, secretInfo) {
    if (confirm(`هل تود تأكيد استلام الدفع وإرسال بيانات الحساب تلقائياً لصفحة "طلباتي" الخاصة بالعميل (${email})؟`)) {
        let decryptedInfo = secretInfo;
        if (secretInfo && secretInfo.trim() !== "") {
            try {
                const bytes = CryptoJS.AES.decrypt(secretInfo, SECRET_ENCRYPTION_KEY);
                const decodedText = bytes.toString(CryptoJS.enc.Utf8);
                if (decodedText) decryptedInfo = decodedText;
            } catch (e) {
                console.log("البيانات مرسلة كنص عادي:", e);
            }
        } else {
            decryptedInfo = "لم يتم توفير تفاصيل إضافية، يرجى مراجعة الإدارة";
        }

        db.ref(`orders/${orderId}`).update({
            status: 'completed',
            accountInfo: decryptedInfo
        }).then(() => {
            alert("تم قبول وتحديث الطلب بنجاح! 🚀");
        }).catch(err => {
            alert("فشل تحديث الطلب: " + err.message);
        });
    }
}

function rejectOrder(orderId) {
    if (confirm("هل أنت متأكد من رفض هذا الطلب؟")) {
        db.ref(`orders/${orderId}`).update({
            status: 'rejected'
        }).then(() => {
            alert("تم رفض الطلب بنجاح ❌");
        }).catch(err => {
            alert("فشل الرفض: " + err.message);
        });
    }
}

function listenToFirebaseProducts() {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('inventory-container');
        container.innerHTML = '';

        if (!data) {
            container.innerHTML = '<div class="info-text">لا توجد حسابات معروضة حالياً بالمتجر.</div>';
            return;
        }

        for (let id in data) {
            const acc = data[id];
            const card = document.createElement('div');
            card.className = 'inventory-card';
            card.innerHTML = `
                <div class="inventory-card-title">${acc.title} (${acc.category})</div>
                <div class="inventory-card-price">السعر: ${acc.price} $</div>
                <div class="inventory-card-actions">
                    <button class="action-btn edit-btn" onclick="startEdit('${id}', '${acc.category}', '${acc.title}', '${acc.price}', '${acc.img || ''}', '${acc.img2 || ''}', '${acc.img3 || ''}', '${acc.img4 || ''}', '${acc.secret || ''}')">⚙️ تعديل</button>
                    <button class="action-btn delete-btn" onclick="deleteAccount('${id}')">🗑️ حذف نهائي</button>
                </div>
            `;
            container.appendChild(card);
        }
    });
}

function startEdit(id, category, title, price, img, img2, img3, img4, secret) {
    editModeId = id;
    let decryptedSecret = "";
    if (secret) {
        try {
            const bytes = CryptoJS.AES.decrypt(secret, SECRET_ENCRYPTION_KEY);
            decryptedSecret = bytes.toString(CryptoJS.enc.Utf8);
            if(!decryptedSecret) decryptedSecret = secret;
        } catch(e) { decryptedSecret = secret; }
    }
    document.getElementById('category').value = category;
    document.getElementById('acc-title').value = title;
    document.getElementById('acc-price').value = price;
    document.getElementById('acc-img').value = img;
    document.getElementById('acc-img2').value = img2 || '';
    document.getElementById('acc-img3').value = img3 || '';
    document.getElementById('acc-img4').value = img4 || '';
    document.getElementById('acc-secret').value = decryptedSecret;

    document.getElementById('form-heading').innerText = '⚙️ تعديل بيانات المنشور بالمتجر';
    document.getElementById('main-action-btn').innerText = 'تحديث وحفظ التعديلات الحية';
    document.getElementById('main-action-btn').style.background = '#2ec4b6';
    document.getElementById('cancel-edit-btn').style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEditMode() {
    editModeId = null;
    document.getElementById('category').value = 'ببجي موبايل';
    document.getElementById('acc-title').value = '';
    document.getElementById('acc-price').value = '';
    document.getElementById('acc-img').value = '';
    document.getElementById('acc-img2').value = '';
    document.getElementById('acc-img3').value = '';
    document.getElementById('acc-img4').value = '';
    document.getElementById('acc-secret').value = '';

    document.getElementById('form-heading').innerText = '🚀 إضافة حساب جديد للمتجر';
    document.getElementById('main-action-btn').innerText = 'نشر الحساب فوراً';
    document.getElementById('main-action-btn').style.background = '#ffcc00';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

function handlePublishOrUpdate() {
    const category = document.getElementById('category').value;
    const title = document.getElementById('acc-title').value.trim();
    const price = document.getElementById('acc-price').value.trim();
    const img = document.getElementById('acc-img').value.trim();
    const img2 = document.getElementById('acc-img2').value.trim();
    const img3 = document.getElementById('acc-img3').value.trim();
    const img4 = document.getElementById('acc-img4').value.trim();
    const secretRaw = document.getElementById('acc-secret').value.trim();

    if (!title || !price || !secretRaw) {
        alert("يرجى ملء كافة الحقول والبيانات السرية للحساب قبل النشر.");
        return;
    }

    const encryptedSecret = CryptoJS.AES.encrypt(secretRaw, SECRET_ENCRYPTION_KEY).toString();

    if (editModeId !== null) {
        db.ref(`products/${editModeId}`).update({
            category, title, price, img, img2, img3, img4, secret: encryptedSecret
        }).then(() => {
            alert("تم تعديل المنتج بنجاح! ✅");
            cancelEditMode();
        }).catch(err => alert("رسالة خطأ: " + err.message));
    } else {
        const newProdRef = db.ref('products').push();
        newProdRef.set({
            category, title, price, img, img2, img3, img4, secret: encryptedSecret
        }).then(() => {
            alert("تم نشر الحساب بنجاح! 🚀");
            cancelEditMode();
        }).catch(err => alert("رسالة خطأ: " + err.message));
    }
}

function deleteAccount(id) {
    if (confirm("هل أنت متأكد من حذف هذا الحساب نهائياً من السوق؟")) {
        db.ref(`products/${id}`).remove()
        .then(() => alert("تم حذف الحساب من متجرك ✅"))
        .catch(err => alert("رسالة خطأ: " + err.message));
    }
}

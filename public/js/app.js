// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

// Loading
function showLoading(text = 'Memproses...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// API Helper
async function callAPI(endpoint, data) {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

// SINGLE CREATE
document.getElementById('btnSingleCreate').addEventListener('click', async () => {
    const options = {
        username: document.getElementById('singleUsername').value || undefined,
        password: document.getElementById('singlePassword').value || undefined,
        referralCode: document.getElementById('singleReferral').value || undefined,
        timeoutSeconds: parseInt(document.getElementById('singleTimeout').value) || 45,
        autoActivate: document.getElementById('singleAutoActivate').checked
    };

    showLoading('Membuat akun... tunggu sekitar 45-60 detik');

    try {
        const result = await callAPI('/api/create', options);
        document.getElementById('singleResult').style.display = 'block';
        document.getElementById('singleResultContent').textContent = JSON.stringify(result, null, 2);
    } catch (err) {
        document.getElementById('singleResult').style.display = 'block';
        document.getElementById('singleResultContent').textContent = 'Error: ' + err.message;
    }

    hideLoading();
});

// BULK CREATE
document.getElementById('btnBulkCreate').addEventListener('click', async () => {
    const count = parseInt(document.getElementById('bulkCount').value) || 3;
    const options = {
        count: count,
        referralCode: document.getElementById('bulkReferral').value || undefined,
        timeoutSeconds: parseInt(document.getElementById('bulkTimeout').value) || 45,
        autoActivate: document.getElementById('bulkAutoActivate').checked
    };

    showLoading(`Bulk create ${count} akun... ini bisa memakan waktu lama`);

    try {
        const result = await callAPI('/api/bulk', options);
        document.getElementById('bulkResult').style.display = 'block';

        if (result.total !== undefined) {
            document.getElementById('bulkStats').innerHTML = `
                <div class="stat-box">
                    <div class="stat-value">${result.total}</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value" style="color:#00ffaa">${result.successful}</div>
                    <div class="stat-label">Berhasil</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value" style="color:#ff4466">${result.failed}</div>
                    <div class="stat-label">Gagal</div>
                </div>
            `;
        } else {
            document.getElementById('bulkStats').innerHTML = '';
        }

        document.getElementById('bulkResultContent').textContent = JSON.stringify(result, null, 2);
    } catch (err) {
        document.getElementById('bulkResult').style.display = 'block';
        document.getElementById('bulkStats').innerHTML = '';
        document.getElementById('bulkResultContent').textContent = 'Error: ' + err.message;
    }

    hideLoading();
});

// TEMP MAIL
let currentTempMail = null;

document.getElementById('btnCreateMail').addEventListener('click', async () => {
    showLoading('Membuat email baru...');

    try {
        const result = await callAPI('/api/tempmail', { action: 'create' });
        currentTempMail = result;

        if (result.status) {
            document.getElementById('mailResult').style.display = 'block';
            document.getElementById('mailInfo').innerHTML = `
                <div class="mail-address">${result.address}</div>
                <div class="mail-provider">Provider: ${result.provider}</div>
            `;
            document.getElementById('mailMessages').innerHTML = '<p style="color:#a0a0b0;font-size:13px;">Belum ada pesan. Klik "Cek Pesan" untuk memeriksa.</p>';
        } else {
            document.getElementById('mailResult').style.display = 'block';
            document.getElementById('mailInfo').innerHTML = `<div style="color:#ff4466">${result.error}</div>`;
            document.getElementById('mailMessages').innerHTML = '';
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }

    hideLoading();
});

document.getElementById('btnCheckMail').addEventListener('click', async () => {
    if (!currentTempMail) return;

    showLoading('Memeriksa pesan...');

    try {
        const result = await callAPI('/api/tempmail', {
            action: 'messages',
            tempMail: currentTempMail
        });

        if (result.status && result.emails.length > 0) {
            document.getElementById('mailMessages').innerHTML = result.emails.map(m => `
                <div class="mail-item">
                    <div class="mail-subject">${m.subject || '(Tanpa Subjek)'}</div>
                    <div class="mail-body">${m.body || m.html || 'Kosong'}</div>
                </div>
            `).join('');
        } else {
            document.getElementById('mailMessages').innerHTML = '<p style="color:#a0a0b0;font-size:13px;">Belum ada pesan masuk.</p>';
        }
    } catch (err) {
        document.getElementById('mailMessages').innerHTML = `<p style="color:#ff4466">Error: ${err.message}</p>`;
    }

    hideLoading();
});

// ==========================================
// 1. Cấu hình giao diện & trạng thái thiết bị
// ==========================================
const deviceConfigs = {
    door: {
        onText: "Đóng cửa",
        offText: "Mở cửa",
        statusOn: "Trạng thái: Đang mở",
        statusOff: "Trạng thái: Đang đóng",
        iconOn: "fa-solid fa-door-open",
        iconOff: "fa-solid fa-door-closed"
    },
    canvas: {
        onText: "Thu bạt",
        offText: "Kéo bạt",
        statusOn: "Trạng thái: Đã kéo ra",
        statusOff: "Trạng thái: Đã thu lại",
        iconOn: "fa-solid fa-umbrella",
        iconOff: "fa-solid fa-umbrella"
    },
    light: {
        onText: "Tắt đèn",
        offText: "Bật đèn",
        statusOn: "Trạng thái: Đã bật",
        statusOff: "Trạng thái: Đã tắt",
        iconOn: "fa-solid fa-lightbulb",
        iconOff: "fa-regular fa-lightbulb"
    }
};

const deviceStates = {
    door: false,
    canvas: false,
    light: false,
    fired: false,
    water: false
};

// Ref chính tới Realtime Database node 'smart_house'
const devicesRef = rtdb.ref('smart_house');

// ==========================================
// 2. Lắng nghe dữ liệu thời gian thực từ Firebase
// ==========================================
devicesRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Cập nhật trạng thái các nút điều khiển thiết bị
    Object.keys(deviceConfigs).forEach((deviceKey) => {
        if (data[deviceKey] !== undefined) {
            deviceStates[deviceKey] = data[deviceKey];
            updateUI(deviceKey, deviceStates[deviceKey]);
        }
    });

    // Cập nhật cảnh báo Cháy (fired)
    if (data.fired !== undefined) {
        deviceStates.fired = data.fired;
        checkSafetyAlert('fired', data.fired);
    }

    // Cập nhật cảnh báo Hồ bơi (water)
    if (data.water !== undefined) {
        deviceStates.water = data.water;
        checkSafetyAlert('water', data.water);
    }
});

// ==========================================
// 3. Hàm xử lý Cảnh báo Khẩn cấp
// ==========================================

/**
 * Kiểm tra và bật/tắt khung cảnh báo trên giao diện
 */
function checkSafetyAlert(key, isTriggered) {
    const alertEl = document.getElementById(key === 'fired' ? 'alert-fire' : 'alert-water');
    if (!alertEl) return;

    if (isTriggered === true) {
        alertEl.classList.remove('d-none');
        alertEl.classList.add('d-flex');
    } else {
        alertEl.classList.remove('d-flex');
        alertEl.classList.add('d-none');
    }
}

/**
 * Gửi lệnh lên Firebase để tắt cảnh báo (đưa fired hoặc water về false)
 */
function dismissAlert(key) {
    if (key !== 'fired' && key !== 'water') return;

    rtdb.ref(`smart_house/${key}`).set(false)
        .then(() => {
            console.log(`Đã tắt cảnh báo ${key}`);
        })
        .catch((error) => {
            console.error(`Lỗi khi tắt cảnh báo ${key}:`, error);
        });
}

// ==========================================
// 4. Hàm điều khiển thiết bị & Giao diện
// ==========================================

/**
 * Cập nhật nút bấm, text và icon của thiết bị
 */
function updateUI(deviceKey, isOpenOrOn) {
    const btn = document.getElementById(`btn-${deviceKey}`);
    const statusText = document.getElementById(`status-${deviceKey}`);
    const icon = document.getElementById(`icon-${deviceKey}`);
    const config = deviceConfigs[deviceKey];

    if (!config) return;

    if (btn) {
        if (isOpenOrOn) {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-danger');
            btn.textContent = config.onText;
        } else {
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-success');
            btn.textContent = config.offText;
        }
    }

    if (statusText) {
        statusText.textContent = isOpenOrOn ? config.statusOn : config.statusOff;
    }

    if (icon) {
        icon.className = isOpenOrOn ? config.iconOn : config.iconOff;
    }
}

/**
 * Thay đổi trạng thái On/Off thiết bị khi bấm nút
 */
function toggleDevice(deviceKey) {
    if (!(deviceKey in deviceStates)) return;

    const newState = !deviceStates[deviceKey];

    rtdb.ref(`smart_house/${deviceKey}`).set(newState)
        .then(() => {
            console.log(`Cập nhật ${deviceKey}: ${newState}`);
        })
        .catch((error) => {
            console.error(`Lỗi cập nhật ${deviceKey}:`, error);
        });
}

// ==========================================
// 5. Chuyển đổi Tab Panel (Sidebar)
// ==========================================
function showPanel(panelId, element) {
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => panel.classList.remove('active'));

    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(button => button.classList.remove('active'));

    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    if (element) {
        element.classList.add('active');
    }
}

// ==========================================
// 1. Cấu hình giao diện thiết bị
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
    light: false
};

// Lưu biến Timer đếm ngược 60s cho việc quét Wi-Fi
let wifiScanTimeout = null;

// ==========================================
// 2. Đồng bộ thời gian thực với Firebase Realtime Database
// ==========================================

const devicesRef = rtdb.ref('smart_house');
const wifiScanRef = rtdb.ref('wifi_scan_results');
const wifiConfigRef = rtdb.ref('wifi_config');
const wifiStatusRef = rtdb.ref('wifi_status');

/**
 * Lắng nghe trạng thái các thiết bị
 */
devicesRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    Object.keys(deviceConfigs).forEach((deviceKey) => {
        if (data[deviceKey] !== undefined) {
            deviceStates[deviceKey] = data[deviceKey];
            updateUI(deviceKey, deviceStates[deviceKey]);
        }
    });
});

/**
 * Lắng nghe danh sách Wi-Fi gửi từ ESP32
 */
wifiScanRef.on('value', (snapshot) => {
    const wifiList = snapshot.val();
    
    // Nếu ESP32 gửi dữ liệu về, hủy ngay bộ đếm 60 giây timeout
    if (wifiScanTimeout) {
        clearTimeout(wifiScanTimeout);
        wifiScanTimeout = null;
    }

    // Mở lại nút "Quét lại"
    const scanBtn = document.getElementById('btn-scan-wifi');
    if (scanBtn) {
        scanBtn.disabled = false;
        scanBtn.innerHTML = `<i class="fa-solid fa-rotate"></i> Quét lại`;
    }

    renderWifiList(wifiList);
});

/**
 * Lắng nghe trạng thái kết nối Wi-Fi từ ESP32
 * (ESP32 ghi vào node 'wifi_status' các giá trị: 'connecting', 'connected', 'wrong_password', 'failed')
 */
wifiStatusRef.on('value', (snapshot) => {
    const status = snapshot.val();
    const alertBox = document.getElementById('wifi-connection-alert');
    const alertIcon = document.getElementById('wifi-alert-icon');
    const alertMsg = document.getElementById('wifi-alert-message');
    const submitBtn = document.getElementById('btn-submit-wifi');

    if (!alertBox || !status) return;

    // Reset các class màu cũ
    alertBox.className = 'alert d-flex align-items-center mb-4';

    if (status === 'connecting') {
        alertBox.classList.add('alert-warning');
        alertIcon.className = 'fa-solid fa-spinner fa-spin me-2 fs-5';
        alertMsg.innerHTML = '<strong>Đang kết nối:</strong> ESP32 đang thử kết nối tới mạng Wi-Fi...';
        if (submitBtn) submitBtn.disabled = true;
    } 
    else if (status === 'connected') {
        alertBox.classList.add('alert-success');
        alertIcon.className = 'fa-solid fa-circle-check me-2 fs-5';
        alertMsg.innerHTML = '<strong>Thành công:</strong> ESP32 đã kết nối Wi-Fi thành công!';
        if (submitBtn) submitBtn.disabled = false;
    } 
    else if (status === 'wrong_password' || status === 'failed') {
        alertBox.classList.add('alert-danger');
        alertIcon.className = 'fa-solid fa-circle-xmark me-2 fs-5';
        alertMsg.innerHTML = '<strong>Thất bại:</strong> Mật khẩu Wi-Fi không chính xác hoặc không thể kết nối tới mạng này!';
        if (submitBtn) submitBtn.disabled = false;
    } 
    else {
        alertBox.classList.add('alert-secondary');
        alertIcon.className = 'fa-solid fa-circle-info me-2 fs-5';
        alertMsg.innerHTML = 'Chưa có yêu cầu kết nối nào gần đây.';
        if (submitBtn) submitBtn.disabled = false;
    }
});


/**
 * Cập nhật giao diện nút bấm, dòng chữ trạng thái, Icon thiết bị
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
 * Đổi trạng thái thiết bị khi người dùng nhấn nút
 */
function toggleDevice(deviceKey) {
    if (!(deviceKey in deviceStates)) return;

    const newState = !deviceStates[deviceKey];

    rtdb.ref(`smart_house/${deviceKey}`).set(newState)
        .then(() => {
            console.log(`Đã cập nhật ${deviceKey} thành: ${newState}`);
        })
        .catch((error) => {
            console.error(`Lỗi khi gửi dữ liệu cho ${deviceKey}:`, error);
        });
}

// ==========================================
// 3. Chuyển đổi Tab Panel
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
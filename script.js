// ==========================================
// 1. Config
// ==========================================
const sensorConfigs = {
    isRain:     { on: "Đang có mưa",        off: "Trời không mưa" },
    isLighting: { on: "Đèn ngủ đang bật",    off: "Đèn ngủ đang tắt" },
    isInRange:  { on: "Có người trong vùng",  off: "Không có ai" },
    isSmoke:    { on: "Phát hiện khói!",     off: "Bình thường" }
};

const alertConfigs = {
    isSmoke:    'alert-fire',
    isInRange:  'alert-water',
    isRain:     'alert-rain',
    isLighting: 'alert-nightlight'
};

const rootRef = rtdb.ref();

// ==========================================
// 2. Realtime listener
// ==========================================
rootRef.on('value', (snapshot) => {
    const data = snapshot.val();
    console.log("Firebase nhận cục data mới:", data);  

    if (!data) return;

    const control = data.Control || {};
    const sensor = data.Sensor || {};

    // Cập nhật trạng thái Đèn hệ thống (Light State: 1, 0, -1)
    if (control['Light State'] !== undefined) {
        const lightState = control['Light State'];
        const statusLight = document.getElementById('status-light');
        const iconLight = document.getElementById('icon-light');
        
        if (statusLight && iconLight) {
            if (lightState === 1) {
                statusLight.textContent = "Trạng thái: Đã bật";
                iconLight.className = "fa-solid fa-lightbulb text-warning fa-beat-fade";
            } else if (lightState === -1) {
                statusLight.textContent = "Trạng thái: Đã tắt";
                iconLight.className = "fa-regular fa-lightbulb text-secondary";
            } else {
                statusLight.textContent = "Trạng thái: Tự động (Auto)";
                iconLight.className = "fa-solid fa-lightbulb text-info";
            }
        }
    }

    // Cập nhật trạng thái Bạt che mưa (Roof State: 1, 0, -1)
    if (control['Roof State'] !== undefined) {
        const roofState = control['Roof State'];
        const statusCanvas = document.getElementById('status-canvas');
        const iconCanvas = document.getElementById('icon-canvas');
        
        if (statusCanvas && iconCanvas) {
            if (roofState === 1) {
                statusCanvas.textContent = "Trạng thái: Đang kéo ra";
                iconCanvas.className = "fa-solid fa-umbrella text-success fa-beat-fade";
            } else if (roofState === -1) {
                statusCanvas.textContent = "Trạng thái: Đang thu lại";
                iconCanvas.className = "fa-solid fa-umbrella text-danger fa-beat-fade";
            } else {
                statusCanvas.textContent = "Trạng thái: Đang dừng";
                iconCanvas.className = "fa-solid fa-umbrella text-secondary";
            }
        }
    }

    // Cập nhật tất cả các Cảm biến & Alert 
    Object.keys(sensorConfigs).forEach((key) => {
        if (sensor[key] === undefined) return;
        updateSensor(key, sensor[key]);

        if (alertConfigs[key]) {
            checkSafetyAlert(key, !!sensor[key]);
        }
    });
});

// ==========================================
// 3. Sensors & Alerts
// ==========================================
function updateSensor(key, value) {
    const el = document.getElementById(`sensor-${key}`);
    if (!el) return;
    el.textContent = value ? sensorConfigs[key].on : sensorConfigs[key].off;
    el.classList.toggle('active', !!value);
}

function checkSafetyAlert(sensorKey, show) {
    const alertEl = document.getElementById(alertConfigs[sensorKey]);
    if (!alertEl) return;
    alertEl.classList.toggle('d-flex', !!show);
    alertEl.classList.toggle('d-none', !show);
}

// Bấm nút "Tắt cảnh báo" sẽ đưa giá trị trên Firebase về false
function dismissAlert(sensorKey) {
    if (!(sensorKey in alertConfigs)) return;
    
    rtdb.ref(`Sensor/${sensorKey}`).set(false)
        .then(() => console.log(`Cập nhật Sensor/${sensorKey}: false`))
        .catch((error) => console.error(`Lỗi cập nhật Sensor/${sensorKey}:`, error));
}

// ==========================================
// 4. Device Control
// ==========================================
// Điều khiển đèn hệ thống (3 trạng thái: 1, 0, -1)
function setLightState(stateValue) {
    rtdb.ref('Control/Light State').set(stateValue)
        .then(() => console.log(`Cập nhật Light State: ${stateValue}`))
        .catch((error) => console.error(`Lỗi cập nhật Light State:`, error));
}

// Điều khiển bạt che mưa (3 trạng thái: 1, 0, -1)
function setCanvasState(stateValue) {
    rtdb.ref('Control/Roof State').set(stateValue)
        .then(() => console.log(`Cập nhật Roof State: ${stateValue}`))
        .catch((error) => console.error(`Lỗi cập nhật Roof State:`, error));
}

// ==========================================
// 5. Sidebar Navigation Tabs
// ==========================================
function showPanel(panelId, element) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(panelId);
    if (target) target.classList.add('active');
    if (element) element.classList.add('active');
}

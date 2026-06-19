const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Global State Management (Industrial Node Data)
let systemState = {
    sensorId: "NODE_01",
    gasValue: 180,
    temperature: 26.5,
    humidity: 55,
    thresholdWarning: 400,
    thresholdCritical: 700,
    exhaustFanActive: false,
    valveClosed: false,
    lastUpdated: new Date()
};

// Historical Mock Data Stream for Analytics
let historyLog = [
    { time: "10:00", ppm: 150 }, { time: "11:00", ppm: 165 },
    { time: "12:00", ppm: 190 }, { time: "13:00", ppm: 310 },
    { time: "14:00", ppm: 210 }, { time: "15:00", ppm: 185 }
];

// --- API ENDPOINTS FOR ARDUINO & FRONTEND ---

// 1. GET Real-Time telemetry
app.get('/api/gas-data', (req, res) => {
    res.json(systemState);
});

// 2. GET Historical logs for Analytics chart
app.get('/api/analytics-history', (req, res) => {
    res.json(historyLog);
});

// 3. POST Hardware Telemetry (From Arduino ESP8266/ESP32)
app.post('/api/update-sensor', (req, res) => {
    const { sensor_id, gas_value, temp, hum } = req.body;
    if (gas_value !== undefined) {
        systemState.gasValue = Number(gas_value);
        if(temp) systemState.temperature = Number(temp);
        if(hum) systemState.humidity = Number(hum);
        systemState.lastUpdated = new Date();

        // Server-side history push
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        historyLog.push({ time: currentTime, ppm: Number(gas_value) });
        if(historyLog.length > 20) historyLog.shift();

        // Auto-activate Exhaust Fan if it crosses critical threshold
        if (systemState.gasValue >= systemState.thresholdCritical) {
            systemState.exhaustFanActive = true;
        }

        return res.status(200).json({ 
            status: "success", 
            exhaustFanControl: systemState.exhaustFanActive ? 1 : 0,
            valveControl: systemState.valveClosed ? 1 : 0 
        });
    }
    return res.status(400).json({ status: "error", message: "Invalid payload mapping" });
});

// 4. POST Configuration updates from Settings page
app.post('/api/update-settings', (req, res) => {
    const { warning, critical } = req.body;
    if(warning && critical) {
        systemState.thresholdWarning = Number(warning);
        systemState.thresholdCritical = Number(critical);
        return res.status(200).json({ status: "success", message: "Thresholds updated globally" });
    }
    return res.status(400).json({ status: "failed" });
});

// 5. POST Control Commands (Actuator switches from Dashboard)
app.post('/api/toggle-control', (req, res) => {
    const { target, state } = req.body;
    if(target === 'fan') systemState.exhaustFanActive = state;
    if(target === 'valve') systemState.valveClosed = state;
    res.json({ status: "success", currentControl: systemState });
});

// Catch-all to serve index.html for frontend routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Industrial IoT Control Core running on http://localhost:${PORT}`);
});
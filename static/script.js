/ ========== RESPONSIVE STATE MANAGEMENT ==========
alert("JS RUNNING");

let responsiveState = {
  isMobile: false,
  isTablet: false,
  sidebarOpen: false
};

// ========== RESPONSIVE INITIALIZATION ==========
function initResponsive() {
  checkViewport();
  window.addEventListener('resize', handleResize);
  
 // document.getElementById('mobileToggle').addEventListener('click', toggleSidebar);
const mobileToggle = document.getElementById('mobileToggle');
if (mobileToggle) {
  mobileToggle.addEventListener('click', toggleSidebar);
}

  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (responsiveState.isMobile && responsiveState.sidebarOpen) {
      const sidebar = document.getElementById('sidebar');
      const toggleBtn = document.getElementById('mobileToggle');
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeSidebar();
      }
    }
  });
}

function checkViewport() {
  const width = window.innerWidth;
  responsiveState.isMobile = width <= 768;
  responsiveState.isTablet = width > 768 && width <= 1024;
  
  // Update sidebar state
const sidebar = document.getElementById('sidebar');
if (!sidebar) return;
if (responsiveState.isMobile && !responsiveState.sidebarOpen) {
  sidebar.classList.remove('active');
} else if (!responsiveState.isMobile) {
  sidebar.classList.add('active');
}

  
  // Adjust waveform heights based on screen size
  adjustWaveformHeights();
  adjustGaugeSize();
}

function handleResize() {
  checkViewport();
  resizeCanvases();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  responsiveState.sidebarOpen = !responsiveState.sidebarOpen;
  sidebar.classList.toggle('active', responsiveState.sidebarOpen);
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  responsiveState.sidebarOpen = false;
  sidebar.classList.remove('active');
}

function adjustWaveformHeights() {
  const containers = document.querySelectorAll('.waveform-container');
  const baseHeight = responsiveState.isMobile ? 60 : 
                    responsiveState.isTablet ? 70 : 90;
  
  containers.forEach((container, index) => {
    if (index < 4) { // First 4 waveforms get more height
      container.style.height = `${baseHeight + 20}px`;
    } else {
      container.style.height = `${baseHeight}px`;
    }
  });
}

function adjustGaugeSize() {
  const svg = document.querySelector('.risk-gauge-container svg');
  if (!svg) return;
  
  if (responsiveState.isMobile) {
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '120');
  } else if (responsiveState.isTablet) {
    svg.setAttribute('width', '240');
    svg.setAttribute('height', '140');
  } else {
    svg.setAttribute('width', '280');
    svg.setAttribute('height', '160');
  }
  
  // Reinitialize gauge paths
  initGauge();
}

// ========== ORIGINAL STATE (Preserved from your code) ==========
let state = {
  isLive: true,
  isMuted: false,
  waveformAudioEnabled: false,
  alertDismissed: false,
  activeTab: 'monitor',
  activePatientId: 'ICU-2024-0847',
  backendUrl: '',
  vitals: {
    heartRate: 78,
    spO2: 97,
    respiratoryRate: 16,
    systolicBP: 122,
    diastolicBP: 78,
    temperature: 37.1,
    cvp: 8,
    papSystolic: 25,
    papDiastolic: 10,
    icp: 12,
    co2: 38
  },
  labs: {
    lactate: 1.2,
    creatinine: 0.9,
    wbc: 8.2,
    hemoglobin: 13.5,
    glucose: 112,
    potassium: 4.1,
    crp: 0
  },
  additionalParams: {
    mobility_score: 0,
    nurse_alert: 0,
    sepsis_risk_score: 1,
    age: 67,
    comorbidity_index: 0,
    hour_from_admission: 2,
    gender: "M",
    oxygen_device: "nasal_cannula",
    admission_type: "emergency",
    oxygen_flow: 2,
    crp_level: 0
  },
  scores: {
    gcs: 15,
    sofa: 2,
    apache: 12,
    sepsis: 1
  },
  riskScore: 25,
  riskLevel: 'STABLE',
  vitalHistory: [],
  trajectory: [],
  mlProbabilities: {
    logistic: 0,
    rf: 0,
    final: 0
  },
  waveformParams: {
    ecg: {
      amplitude: 1.0,
      frequency: 1.0,
      pWaveHeight: 0.3,
      qrsHeight: 1.0,
      tWaveHeight: 0.4
    },
    pleth: {
      amplitude: 1.0,
      pulseStrength: 1.0,
      baseline: 0.5
    },
    resp: {
      amplitude: 1.0,
      frequency: 1.0,
      inspirationRatio: 0.4
    },
    abp: {
      amplitude: 1.0,
      pulsePressureFactor: 1.0,
      dicroticNotchDepth: 0.3
    },
    cvp: {
      amplitude: 1.0,
      aWaveHeight: 0.8,
      vWaveHeight: 0.6,
      xDescent: 0.4,
      yDescent: 0.5
    },
    pap: {
      amplitude: 1.0,
      systolicPeak: 1.0,
      diastolicTrough: 0.3
    },
    icp: {
      amplitude: 1.0,
      pulseAmplitude: 0.2,
      baseline: 1.0
    },
    co2: {
      amplitude: 1.0,
      plateauHeight: 0.8,
      upstrokeSteepness: 0.7
    }
  }
};

// Sample patients
const patients = [
  { id: 'ICU-2024-0841', bed: 'Bed 1', age: 72, gender: 'M', hr: 88, spo2: 94, risk: 35, level: 'BORDERLINE' },
  { id: 'ICU-2024-0842', bed: 'Bed 2', age: 45, gender: 'F', hr: 72, spo2: 98, risk: 15, level: 'STABLE' },
  { id: 'ICU-2024-0843', bed: 'Bed 3', age: 81, gender: 'M', hr: 105, spo2: 89, risk: 65, level: 'CRITICAL' },
  { id: 'ICU-2024-0844', bed: 'Bed 4', age: 58, gender: 'F', hr: 78, spo2: 96, risk: 20, level: 'STABLE' },
  { id: 'ICU-2024-0845', bed: 'Bed 5', age: 67, gender: 'M', hr: 92, spo2: 92, risk: 40, level: 'BORDERLINE' },
  { id: 'ICU-2024-0846', bed: 'Bed 6', age: 34, gender: 'F', hr: 145, spo2: 85, risk: 75, level: 'CRITICAL' },
];

// Medications
const medications = [
  { name: 'Norepinephrine', dose: '0.1 mcg/kg/min', route: 'IV', status: 'active' },
  { name: 'Vancomycin', dose: '1g', route: 'IV Q12H', status: 'active' },
  { name: 'Heparin', dose: '5000 units', route: 'SC Q8H', status: 'overdue' },
  { name: 'Piperacillin-Tazobactam', dose: '4.5g', route: 'IV Q6H', status: 'due' },
  { name: 'Fentanyl', dose: '50 mcg', route: 'IV PRN', status: 'active' },
  { name: 'Propofol', dose: '20 mcg/kg/min', route: 'IV', status: 'active' },
];

// Clinical notes
const notes = [
  { author: 'Dr. Smith', role: 'MD', time: '2 hours ago', content: 'Patient hemodynamically stable. Continue current vasopressor support.' },
  { author: 'RN Johnson', role: 'RN', time: '4 hours ago', content: 'Increased norepinephrine from 0.08 to 0.1 mcg/kg/min per protocol for MAP < 65.' },
  { author: 'RT Williams', role: 'RT', time: '6 hours ago', content: 'Vent settings adjusted. FiO2 weaned from 50% to 40%. SpO2 maintained > 94%.' },
];

// Audio context
let audioContext = null;
let heartbeatInterval = null;

// ========== CANVAS RESIZE MANAGEMENT ==========
const canvasReferences = {};

function resizeCanvases() {
  const canvases = ['ecgCanvas', 'plethCanvas', 'respCanvas', 'abpCanvas', 'cvpCanvas', 'papCanvas', 'icpCanvas', 'co2Canvas'];
  
  canvases.forEach(id => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    
    // Store reference for animation loop
    canvasReferences[id] = {
      canvas: canvas,
      ctx: canvas.getContext('2d'),
      container: container
    };
    
    // Set display size
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;
    
    // Check if canvas needs resizing
    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    }
  });
}

// ========== BACKEND CONNECTION ==========
async function checkBackendConnection() {
  try {
    const response = await fetch(`${state.backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      document.getElementById('backendStatusDot').style.background = 'var(--vital-stable)';
      document.getElementById('backendStatusText').textContent = 'ML Connected';
      return true;
    } else {
      document.getElementById('backendStatusDot').style.background = 'var(--vital-warning)';
      document.getElementById('backendStatusText').textContent = 'Backend Error';
      return false;
    }
  } catch (error) {
    document.getElementById('backendStatusDot').style.background = 'var(--vital-critical)';
    document.getElementById('backendStatusText').textContent = 'No Connection';
    console.error('Backend connection failed:', error);
    return false;
  }
}

async function testBackendConnection() {
  const connected = await checkBackendConnection();
  if (connected) {
    alert('✅ Backend connection successful!');
  } else {
    alert('❌ Backend connection failed. Check if Flask is running on port 5000.');
  }
}

// ========== ML PREDICTION ==========
async function getMLPrediction() {
  const inputData = {
    heart_rate: state.vitals.heartRate,
    spo2_pct: state.vitals.spO2,
    systolic_bp: state.vitals.systolicBP,
    diastolic_bp: state.vitals.diastolicBP,
    respiratory_rate: state.vitals.respiratoryRate,
    temperature_c: state.vitals.temperature,
    oxygen_flow: state.additionalParams.oxygen_flow,
    mobility_score: state.additionalParams.mobility_score,
    nurse_alert: state.additionalParams.nurse_alert,
    wbc_count: state.labs.wbc * 1000,
    lactate: state.labs.lactate,
    creatinine: state.labs.creatinine,
    crp_level: state.labs.crp,
    hemoglobin: state.labs.hemoglobin,
    sepsis_risk_score: state.additionalParams.sepsis_risk_score,
    age: state.additionalParams.age,
    comorbidity_index: state.additionalParams.comorbidity_index,
    hour_from_admission: state.additionalParams.hour_from_admission,
    gender: state.additionalParams.gender,
    oxygen_device: state.additionalParams.oxygen_device,
    admission_type: state.additionalParams.admission_type
  };

  try {
    const response = await fetch(`${state.backendUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      const prediction = result.prediction;
      
      state.mlProbabilities = {
        logistic: prediction.logistic_prob,
        rf: prediction.rf_prob,
        final: prediction.final_prob
      };
      
      state.riskScore = Math.min(100, Math.max(0, prediction.final_prob * 100));
      
      if (prediction.final_pred === 1 || prediction.final_prob >= 0.55) {
        state.riskLevel = 'CRITICAL';
      } else if (prediction.final_prob >= 0.3) {
        state.riskLevel = 'BORDERLINE';
      } else {
        state.riskLevel = 'STABLE';
      }
      
      updateProbabilityDisplay();
      return true;
    } else {
      console.error('Prediction failed:', result.error);
      fallbackRiskCalculation();
      return false;
    }
  } catch (error) {
    console.error('Error fetching prediction:', error);
    fallbackRiskCalculation();
    return false;
  }
}

function fallbackRiskCalculation() {
  const v = state.vitals;
  const l = state.labs;
  let score = 0;

  if (v.heartRate < 50 || v.heartRate > 130) score += 25;
  else if (v.heartRate < 60 || v.heartRate > 110) score += 10;

  if (v.spO2 < 85) score += 35;
  else if (v.spO2 < 90) score += 25;
  else if (v.spO2 < 94) score += 15;

  if (v.systolicBP < 80 || v.systolicBP > 200) score += 30;
  else if (v.systolicBP < 90 || v.systolicBP > 180) score += 20;

  if (v.respiratoryRate < 8 || v.respiratoryRate > 35) score += 25;
  if (v.temperature < 35 || v.temperature > 40) score += 20;

  if (l.lactate > 4) score += 25;
  else if (l.lactate > 2) score += 15;
  if (l.creatinine > 2) score += 20;

  state.riskScore = Math.min(100, score);
  state.riskLevel = score >= 55 ? 'CRITICAL' : score >= 30 ? 'BORDERLINE' : 'STABLE';
}

function updateProbabilityDisplay() {
  const mlProbs = document.getElementById('mlProbabilities');
  if (state.mlProbabilities.logistic > 0) {
    mlProbs.style.display = 'block';
    document.getElementById('logisticProb').textContent = state.mlProbabilities.logistic.toFixed(3);
    document.getElementById('rfProb').textContent = state.mlProbabilities.rf.toFixed(3);
    document.getElementById('finalProb').textContent = state.mlProbabilities.final.toFixed(3);
  }
}

// ========== INITIALIZATION ==========
function init() {
  // Initialize responsive features first
  initResponsive();
  checkViewport();
  
  // Initialize original features
  initializeHistory();
  calculateWaveformParameters();
  renderPatientList();
  renderMedications();
  renderNotes();
  initGauge();
  renderTrajectory();
  renderHeatmap();
  
  // Initialize canvases
  resizeCanvases();
  startWaveforms();
  
  checkBackendConnection().then(connected => {
    if (connected) {
      console.log('Backend connected successfully');
      getMLPrediction();
    } else {
      console.warn('Using fallback risk calculation');
      fallbackRiskCalculation();
    }
    startSimulation();
  });
  
  updateClock();
  setInterval(updateClock, 1000);
}

function initializeHistory() {
  const now = Date.now();
  for (let i = 60; i >= 0; i--) {
    state.vitalHistory.push({
      time: now - i * 60000,
      hr: 75 + Math.random() * 15,
      spo2: 95 + Math.random() * 4,
      sbp: 115 + Math.random() * 20,
      rr: 14 + Math.random() * 6,
      temp: 36.8 + Math.random() * 0.8,
      cvp: 6 + Math.random() * 4,
      papSystolic: 22 + Math.random() * 6,
      papDiastolic: 8 + Math.random() * 4,
      icp: 10 + Math.random() * 6,
      co2: 35 + Math.random() * 8
    });
  }
  
  const baseRisk = state.riskScore;
  state.trajectory = Array.from({ length: 12 }, (_, i) => {
    const trend = (Math.random() - 0.5) * 10;
    return Math.max(0, Math.min(100, baseRisk + trend * (i / 12)));
  });
}

// ========== DYNAMIC WAVEFORM PARAMETER CALCULATION ==========
function calculateWaveformParameters() {
  const v = state.vitals;
  const wp = state.waveformParams;

  // ECG Parameters based on heart rate and rhythm
  const hr = v.heartRate;
  wp.ecg.frequency = hr / 60;
  wp.ecg.pWaveHeight = 0.3 * (hr > 100 ? 0.7 : hr < 50 ? 1.3 : 1.0);
  wp.ecg.qrsHeight = 1.0 * (hr > 120 ? 0.8 : hr < 40 ? 1.2 : 1.0);
  wp.ecg.tWaveHeight = 0.4 * (v.temperature > 38.5 ? 1.3 : 1.0);

  // Pleth Parameters based on SpO2 and perfusion
  wp.pleth.pulseStrength = v.spO2 / 100;
  wp.pleth.amplitude = 0.5 + (v.spO2 / 100) * 0.5;
  wp.pleth.baseline = 0.3 + (v.spO2 / 100) * 0.4;

  // Resp Parameters based on respiratory rate and pattern
  wp.resp.frequency = v.respiratoryRate / 12;
  wp.resp.amplitude = 0.5 + (v.respiratoryRate / 30) * 0.5;
  wp.resp.inspirationRatio = 0.4 * (v.respiratoryRate > 25 ? 0.7 : v.respiratoryRate < 10 ? 1.3 : 1.0);

  // ABP Parameters based on blood pressure
  const pulsePressure = v.systolicBP - v.diastolicBP;
  wp.abp.pulsePressureFactor = pulsePressure / 40;
  wp.abp.amplitude = (v.systolicBP / 120) * 0.8 + 0.2;
  wp.abp.dicroticNotchDepth = 0.3 * (pulsePressure > 60 ? 0.5 : pulsePressure < 20 ? 1.5 : 1.0);

  // CVP Parameters
  wp.cvp.aWaveHeight = 0.8 * (v.cvp > 12 ? 1.2 : v.cvp < 4 ? 0.8 : 1.0);
  wp.cvp.vWaveHeight = 0.6 * (v.cvp > 12 ? 1.3 : v.cvp < 4 ? 0.7 : 1.0);
  wp.cvp.xDescent = 0.4 * (v.heartRate > 100 ? 1.2 : 1.0);
  wp.cvp.yDescent = 0.5 * (v.cvp > 10 ? 0.8 : 1.0);

  // PAP Parameters
  wp.pap.systolicPeak = v.papSystolic / 25;
  wp.pap.diastolicTrough = v.papDiastolic / 10;
  wp.pap.amplitude = (v.papSystolic - v.papDiastolic) / 15;

  // ICP Parameters
  wp.icp.baseline = v.icp / 15;
  wp.icp.pulseAmplitude = 0.2 * (v.icp > 20 ? 1.5 : v.icp < 5 ? 0.5 : 1.0);
  wp.icp.amplitude = 0.5 + (v.icp / 30) * 0.5;

  // CO2 Parameters
  wp.co2.plateauHeight = v.co2 / 40;
  wp.co2.upstrokeSteepness = 0.7 * (v.respiratoryRate > 20 ? 1.3 : v.respiratoryRate < 10 ? 0.7 : 1.0);
  wp.co2.amplitude = 0.6 + (v.co2 / 60) * 0.4;
}

// ========== WAVEFORMS ==========
const waveformOffsets = { 
  ecg: 0, 
  pleth: 0, 
  resp: 0, 
  abp: 0,
  cvp: 0,
  pap: 0,
  icp: 0,
  co2: 0
};

function startWaveforms() {
  function drawWaveforms() {
    calculateWaveformParameters();
    
    // Get current canvas dimensions from references
    for (const [id, ref] of Object.entries(canvasReferences)) {
      if (!ref || !ref.canvas || !ref.ctx) continue;
      
      const canvas = ref.canvas;
      const ctx = ref.ctx;
      const container = ref.container;
      
      const w = container.clientWidth;
      const h = container.clientHeight;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Scale for high DPI
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // Draw based on waveform type
      switch(id) {
        case 'ecgCanvas':
          drawECG(ctx, w, h, waveformOffsets.ecg);
          waveformOffsets.ecg += 2 * state.waveformParams.ecg.frequency;
          break;
        case 'plethCanvas':
          drawPleth(ctx, w, h, waveformOffsets.pleth);
          waveformOffsets.pleth += 2 * (state.vitals.heartRate / 60);
          break;
        case 'respCanvas':
          drawResp(ctx, w, h, waveformOffsets.resp);
          waveformOffsets.resp += 1 * state.waveformParams.resp.frequency;
          break;
        case 'abpCanvas':
          drawABP(ctx, w, h, waveformOffsets.abp);
          waveformOffsets.abp += 2 * (state.vitals.heartRate / 60);
          break;
        case 'cvpCanvas':
          drawCVP(ctx, w, h, waveformOffsets.cvp);
          waveformOffsets.cvp += 1;
          break;
        case 'papCanvas':
          drawPAP(ctx, w, h, waveformOffsets.pap);
          waveformOffsets.pap += 1.5;
          break;
        case 'icpCanvas':
          drawICP(ctx, w, h, waveformOffsets.icp);
          waveformOffsets.icp += 0.8;
          break;
        case 'co2Canvas':
          drawCO2(ctx, w, h, waveformOffsets.co2);
          waveformOffsets.co2 += 1.2;
          break;
      }
    }
    
    requestAnimationFrame(drawWaveforms);
  }
  
  drawWaveforms();
}

function drawECG(ctx, w, h, offset) {
  const midY = h / 2;
  const amplitude = h * 0.35 * state.waveformParams.ecg.amplitude;
  const wp = state.waveformParams.ecg;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.3)';
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.beginPath();
  ctx.strokeStyle = 'hsl(120, 100%, 45%)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'hsl(120, 100%, 45%)';
  ctx.shadowBlur = 8;

  const cycleLength = 100 / wp.frequency;
  
  for (let x = 0; x < w; x++) {
    const cycle = (x + offset) % cycleLength;
    const norm = cycle / cycleLength;
    let y = midY;
    
    if (norm < 0.05) y = midY - amplitude * 0.1 * wp.pWaveHeight;
    else if (norm < 0.1) y = midY - amplitude * 0.15 * wp.pWaveHeight;
    else if (norm < 0.15) y = midY + amplitude * 0.1;
    else if (norm < 0.2) y = midY - amplitude * 0.9 * wp.qrsHeight;
    else if (norm < 0.25) y = midY + amplitude * 0.3 * wp.qrsHeight;
    else if (norm < 0.35) y = midY - amplitude * 0.2 * wp.tWaveHeight;
    else if (norm < 0.5) y = midY + amplitude * 0.1 * wp.tWaveHeight;
    else y = midY - amplitude * 0.1;

    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Sweep line
  const sweepX = offset % w;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.moveTo(sweepX, 0);
  ctx.lineTo(sweepX, h);
  ctx.stroke();
}

function drawPleth(ctx, w, h, offset) {
  const midY = h / 2;
  const amplitude = h * 0.35 * state.waveformParams.pleth.amplitude;
  const wp = state.waveformParams.pleth;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.3)';
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.beginPath();
  ctx.strokeStyle = 'hsl(190, 100%, 50%)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'hsl(190, 100%, 50%)';
  ctx.shadowBlur = 8;

  for (let x = 0; x < w; x++) {
    const cycle = (x + offset) % 80;
    const norm = cycle / 80;
    let y;
    
    if (norm < 0.15) {
      y = midY - amplitude * (wp.baseline + (0.8 * wp.pulseStrength) * Math.sin(norm * Math.PI / 0.15));
    } else if (norm < 0.3) {
      y = midY - amplitude * (1 - 0.3 * (norm - 0.15) / 0.15) * wp.pulseStrength;
    } else if (norm < 0.5) {
      y = midY - amplitude * (0.7 + 0.15 * wp.pulseStrength * Math.sin((norm - 0.3) * Math.PI / 0.2));
    } else {
      y = midY - amplitude * (0.85 - 0.65 * wp.pulseStrength * (norm - 0.5) / 0.5);
    }

    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawResp(ctx, w, h, offset) {
  const midY = h / 2;
  const amplitude = h * 0.3 * state.waveformParams.resp.amplitude;
  const wp = state.waveformParams.resp;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.3)';
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.beginPath();
  ctx.strokeStyle = 'hsl(55, 100%, 50%)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'hsl(55, 100%, 50%)';
  ctx.shadowBlur = 8;

  const cycleLength = 120 / wp.frequency;
  
  for (let x = 0; x < w; x++) {
    const cycle = (x + offset) % cycleLength;
    const norm = cycle / cycleLength;
    
    let y;
    if (norm < wp.inspirationRatio) {
      y = midY - amplitude * Math.sin((norm / wp.inspirationRatio) * Math.PI / 2);
    } else {
      y = midY - amplitude * Math.cos(((norm - wp.inspirationRatio) / (1 - wp.inspirationRatio)) * Math.PI / 2);
    }
    
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawABP(ctx, w, h, offset) {
  const wp = state.waveformParams.abp;
  const v = state.vitals;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.3)';
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.beginPath();
  ctx.strokeStyle = 'hsl(280, 100%, 65%)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'hsl(280, 100%, 65%)';
  ctx.shadowBlur = 8;

  const cycleLength = 60 * (60 / v.heartRate);
  
  for (let x = 0; x < w; x++) {
    const cycle = (x + offset) % cycleLength;
    const norm = cycle / cycleLength;
    let bp;
    
    if (norm < 0.2) {
      bp = v.diastolicBP + (v.systolicBP - v.diastolicBP) * Math.sin(norm * Math.PI / 0.4) * wp.pulsePressureFactor;
    } else if (norm < 0.25) {
      bp = v.systolicBP - (v.systolicBP - v.diastolicBP) * 0.3 * wp.dicroticNotchDepth;
    } else {
      bp = v.systolicBP - (v.systolicBP - v.diastolicBP) * (norm - 0.2) / 0.8;
    }
    
    const y = h - 5 - ((bp - 40) / 160) * (h - 10) * wp.amplitude;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawCVP(ctx, w, h, offset) {
  const wp = state.waveformParams.cvp;
  const v = state.vitals;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.3)';
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.beginPath();
  ctx.strokeStyle = 'hsl(200, 100%, 60%)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'hsl(200, 100%, 60%)';
  ctx.shadowBlur = 8;

  for (let x = 0; x < w; x++) {
    const cycle = (x + offset) % 80;
    const norm = cycle / 80;
    let pressure;
    
    if (norm < 0.2) {
      pressure = v.cvp + 3 * wp.aWaveHeight * Math.sin(norm * Math.PI * 5);
    } else if (norm < 0.3) {
      pressure = v.cvp - 2 * wp.xDescent * ((norm - 0.2) / 0.1);
    } else if (norm < 0.4) {
      pressure = v.cvp + 2 * wp.vWaveHeight * Math.sin((norm - 0.3) * Math.PI * 5);
    } else if (norm < 0.6) {
      pressure = v.cvp - 1.5 * wp.yDescent * ((norm - 0.4) / 0.2);
    } else {
      pressure = v.cvp + 0.5 * Math.sin((norm - 0.6) * Math.PI * 3);
    }
    
    const y = h - 5 - ((pressure - 0) / 30) * (h - 10) * wp.amplitude;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawPAP(ctx, w, h, offset) {
  const wp = state.waveformParams.pap;
  const v = state.vitals;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.3)';
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.beginPath();
  ctx.strokeStyle = 'hsl(330, 100%, 65%)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'hsl(330, 100%, 65%)';
  ctx.shadowBlur = 8;

  for (let x = 0; x < w; x++) {
    const cycle = (x + offset) % 70;
    const norm = cycle / 70;
    let pressure;
    
    if (norm < 0.25) {
      pressure = v.papDiastolic + (v.papSystolic - v.papDiastolic) * 
                Math.sin(norm * Math.PI / 0.5) * wp.systolicPeak;
    } else {
      pressure = v.papSystolic - (v.papSystolic - v.papDiastolic) * 
                (norm - 0.25) / 0.75 * wp.diastolicTrough;
    }
    
    const y = h - 5 - ((pressure - 0) / 60) * (h - 10) * wp.amplitude;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawICP(ctx, w, h, offset) {
  const wp = state.waveformParams.icp;
  const v = state.vitals;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.3)';
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.beginPath();
  ctx.strokeStyle = 'hsl(30, 100%, 55%)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'hsl(30, 100%, 55%)';
  ctx.shadowBlur = 8;

  for (let x = 0; x < w; x++) {
    const cycle = (x + offset) % 90;
    const norm = cycle / 90;
    let pressure;
    
    const baseline = v.icp * wp.baseline;
    const pulseWave = wp.pulseAmplitude * Math.sin(norm * Math.PI * 6);
    
    if (norm < 0.4) {
      pressure = baseline + 2 * pulseWave;
    } else if (norm < 0.7) {
      pressure = baseline - 1 * pulseWave;
    } else {
      pressure = baseline + 0.5 * pulseWave;
    }
    
    const y = h - 5 - ((pressure - 0) / 40) * (h - 10) * wp.amplitude;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawCO2(ctx, w, h, offset) {
  const wp = state.waveformParams.co2;
  const v = state.vitals;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.3)';
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.beginPath();
  ctx.strokeStyle = 'hsl(160, 100%, 50%)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'hsl(160, 100%, 50%)';
  ctx.shadowBlur = 8;

  for (let x = 0; x < w; x++) {
    const cycle = (x + offset) % 75;
    const norm = cycle / 75;
    let value;
    
    if (norm < 0.2) {
      value = v.co2 * (norm / 0.2) * wp.upstrokeSteepness;
    } else if (norm < 0.4) {
      value = v.co2 * wp.plateauHeight;
    } else if (norm < 0.6) {
      value = v.co2 * wp.plateauHeight * (1 - (norm - 0.4) / 0.2);
    } else if (norm < 0.8) {
      value = 0;
    } else {
      value = 0;
    }
    
    const y = h - 5 - ((value - 0) / 80) * (h - 10) * wp.amplitude;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawGrid(ctx, w, h) {
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

// ========== SIMULATION ==========
function startSimulation() {
  setInterval(() => {
    if (!state.isLive) return;
    updateVitals();
    calculateWaveformParameters();
    getMLPrediction();
    updateUI();
    checkAlerts();
  }, 3000);
}

function updateVitals() {
  const v = state.vitals;
  v.heartRate = clamp(v.heartRate + (Math.random() - 0.5) * 4, 40, 180);
  v.spO2 = clamp(v.spO2 + (Math.random() - 0.5) * 1.5, 70, 100);
  v.respiratoryRate = clamp(v.respiratoryRate + (Math.random() - 0.5) * 2, 6, 40);
  v.systolicBP = clamp(v.systolicBP + (Math.random() - 0.5) * 6, 60, 220);
  v.diastolicBP = clamp(v.diastolicBP + (Math.random() - 0.5) * 4, 40, 140);
  v.temperature = clamp(v.temperature + (Math.random() - 0.5) * 0.1, 34, 42);
  
  v.cvp = clamp(v.cvp + (Math.random() - 0.5) * 0.5, 2, 20);
  v.papSystolic = clamp(v.papSystolic + (Math.random() - 0.5) * 2, 15, 50);
  v.papDiastolic = clamp(v.papDiastolic + (Math.random() - 0.5) * 1, 5, 25);
  v.icp = clamp(v.icp + (Math.random() - 0.5) * 0.3, 5, 30);
  v.co2 = clamp(v.co2 + (Math.random() - 0.5) * 2, 20, 60);

  if (v.heartRate > 120) v.spO2 = Math.max(85, v.spO2 - Math.random() * 2);
  if (v.temperature > 38.5) v.heartRate = Math.min(160, v.heartRate + Math.random() * 5);
  if (v.icp > 20) v.heartRate = Math.max(50, v.heartRate - Math.random() * 5);

  state.vitalHistory.push({
    time: Date.now(),
    hr: v.heartRate,
    spo2: v.spO2,
    sbp: v.systolicBP,
    rr: v.respiratoryRate,
    temp: v.temperature,
    cvp: v.cvp,
    papSystolic: v.papSystolic,
    papDiastolic: v.papDiastolic,
    icp: v.icp,
    co2: v.co2
  });
  if (state.vitalHistory.length > 120) state.vitalHistory.shift();
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

// ========== UI UPDATE ==========
function updateUI() {
  const v = state.vitals;
  const map = Math.round((v.systolicBP + 2 * v.diastolicBP) / 3);

  document.getElementById('hrValue').textContent = Math.round(v.heartRate);
  document.getElementById('spo2Value').textContent = Math.round(v.spO2);
  document.getElementById('rrValue').textContent = Math.round(v.respiratoryRate);
  document.getElementById('bpWaveValue').textContent = Math.round(v.systolicBP);
  
  document.getElementById('cvpValue').textContent = v.cvp.toFixed(1);
  document.getElementById('papValue').textContent = `${Math.round(v.papSystolic)}/${Math.round(v.papDiastolic)}`;
  document.getElementById('icpValue').textContent = Math.round(v.icp);
  document.getElementById('co2Value').textContent = Math.round(v.co2);
  
  document.getElementById('hrCardValue').textContent = Math.round(v.heartRate);
  document.getElementById('spo2CardValue').textContent = Math.round(v.spO2);
  document.getElementById('rrCardValue').textContent = Math.round(v.respiratoryRate);
  document.getElementById('tempCardValue').textContent = v.temperature.toFixed(1);
  
  document.getElementById('bpValue').textContent = `${Math.round(v.systolicBP)}/${Math.round(v.diastolicBP)}`;
  document.getElementById('mapValue').textContent = map;

  updateVitalCardStatus('hrCard', 'hrCardValue', v.heartRate, 60, 100, 45, 140);
  updateVitalCardStatus('spo2Card', 'spo2CardValue', v.spO2, 94, 100, 88, 101);
  updateVitalCardStatus('rrCard', 'rrCardValue', v.respiratoryRate, 12, 20, 8, 35);
  updateVitalCardStatus('tempCard', 'tempCardValue', v.temperature, 36.1, 37.5, 35, 39.5);

  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  statusDot.className = 'status-dot ' + state.riskLevel.toLowerCase();
  statusText.className = 'status-text ' + state.riskLevel.toLowerCase() + ' font-mono';
  statusText.textContent = state.riskLevel;

  updateGauge();
  renderTrajectory();
  renderHeatmap();
  updateRecommendations();
}

function updateVitalCardStatus(cardId, valueId, value, low, high, critLow, critHigh) {
  const card = document.getElementById(cardId);
  const valueEl = document.getElementById(valueId);
  let status = 'stable';
  
  if (value < critLow || value > critHigh) status = 'critical';
  else if (value < low || value > high) status = 'warning';

  card.className = 'vital-card ' + status;
  valueEl.className = 'vital-card-value ' + status + ' font-mono';
}

// ========== GAUGE ==========
function initGauge() {
  const svg = document.querySelector('.risk-gauge-container svg');
  if (!svg) return;
  
  const width = parseInt(svg.getAttribute('width'));
  const height = parseInt(svg.getAttribute('height'));
  
  // Adjust gauge size based on responsive state
  const cx = width / 2;
  const cy = height - 40;
  const r = Math.min(cx, cy) - 10;
  
  function arc(start, end) {
    const s = { x: cx + r * Math.cos(start * Math.PI / 180), y: cy + r * Math.sin(start * Math.PI / 180) };
    const e = { x: cx + r * Math.cos(end * Math.PI / 180), y: cy + r * Math.sin(end * Math.PI / 180) };
    return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
  }

  document.getElementById('bgTrack').setAttribute('d', arc(-180, 0));
  document.getElementById('stableZone').setAttribute('d', arc(-180, -117));
  document.getElementById('warningZone').setAttribute('d', arc(-117, -72));
  document.getElementById('criticalZone').setAttribute('d', arc(-72, 0));
  
  // Position needle center
  document.getElementById('needleCenter').setAttribute('cx', cx);
  document.getElementById('needleCenter').setAttribute('cy', cy);
  
  // Adjust label positions based on size
  const labels = svg.querySelectorAll('text');
  labels[0].setAttribute('x', cx - r + 10);
  labels[0].setAttribute('y', cy + r - 10);
  labels[3].setAttribute('x', cx + r - 10);
  labels[3].setAttribute('y', cy + r - 10);
}

function updateGauge() {
  const svg = document.querySelector('.risk-gauge-container svg');
  if (!svg) return;
  
  const width = parseInt(svg.getAttribute('width'));
  const height = parseInt(svg.getAttribute('height'));
  
  const cx = width / 2;
  const cy = height - 40;
  const r = Math.min(cx, cy) - 40;
  
  const angle = (state.riskScore / 100) * 180 - 180;
  const rad = angle * Math.PI / 180;
  
  const needle = document.getElementById('needle');
  needle.setAttribute('x1', cx);
  needle.setAttribute('y1', cy);
  needle.setAttribute('x2', cx + r * Math.cos(rad));
  needle.setAttribute('y2', cy + r * Math.sin(rad));

  const color = state.riskLevel === 'CRITICAL' ? 'hsl(0, 85%, 50%)' : 
                state.riskLevel === 'BORDERLINE' ? 'hsl(45, 100%, 50%)' : 'hsl(120, 100%, 45%)';
  
  needle.setAttribute('stroke', color);
  document.getElementById('needleCenter').setAttribute('fill', color);
  
  const scoreEl = document.getElementById('riskScore');
  const labelEl = document.getElementById('riskLabel');
  scoreEl.textContent = Math.round(state.riskScore) + '%';
  scoreEl.style.color = color;
  scoreEl.style.textShadow = `0 0 20px ${color}`;
  labelEl.textContent = state.riskLevel;
  labelEl.style.color = color;
  labelEl.className = 'risk-label' + (state.riskLevel === 'CRITICAL' ? ' animate-pulse' : '');
  
  document.getElementById('riskConfidence').textContent = (85 + Math.random() * 10).toFixed(1);
}

// ========== TRAJECTORY ==========
function renderTrajectory() {
  const svg = document.getElementById('trajectoryChart');
  const container = svg.parentElement;
  const w = container.clientWidth - 40;
  const h = 80;
  const padding = { left: 30, right: 10, top: 10, bottom: 20 };
  
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${w + padding.left + padding.right} ${h + padding.top + padding.bottom}`);

  const data = state.trajectory;
  const currentIdx = Math.floor(data.length / 2);

  // Grid lines
  [0, 35, 60, 100].forEach(val => {
    const y = padding.top + h - (val / 100) * h;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padding.left);
    line.setAttribute('y1', y);
    line.setAttribute('x2', w + padding.left);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'hsl(220, 15%, 20%)');
    line.setAttribute('stroke-dasharray', val === 0 || val === 100 ? '0' : '4,4');
    svg.appendChild(line);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', padding.left - 5);
    text.setAttribute('y', y);
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', 'hsl(220, 10%, 50%)');
    text.setAttribute('font-size', '9');
    text.textContent = val;
    svg.appendChild(text);
  });

  // Now marker
  const nowX = padding.left + (currentIdx / (data.length - 1)) * w;
  const nowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  nowLine.setAttribute('x1', nowX);
  nowLine.setAttribute('y1', padding.top);
  nowLine.setAttribute('x2', nowX);
  nowLine.setAttribute('y2', padding.top + h);
  nowLine.setAttribute('stroke', 'hsl(180, 100%, 45%)');
  nowLine.setAttribute('stroke-dasharray', '2,2');
  nowLine.setAttribute('opacity', '0.5');
  svg.appendChild(nowLine);

  // Path
  const points = data.map((val, i) => {
    const x = padding.left + (i / (data.length - 1)) * w;
    const y = padding.top + h - (val / 100) * h;
    return { x, y, val };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'hsl(180, 100%, 45%)');
  path.setAttribute('stroke-width', '2');
  path.style.filter = 'drop-shadow(0 0 4px hsl(180, 100%, 45%))';
  svg.appendChild(path);

  // Points
  points.forEach((p, i) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', i === currentIdx ? 5 : 3);
    const color = p.val >= 60 ? 'hsl(0, 85%, 50%)' : p.val >= 35 ? 'hsl(45, 100%, 50%)' : 'hsl(120, 100%, 45%)';
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', 'hsl(220, 20%, 10%)');
    circle.style.filter = `drop-shadow(0 0 3px ${color})`;
    svg.appendChild(circle);
  });

  // Labels
  ['−1h', 'NOW', '+1h'].forEach((label, i) => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', padding.left + (i / 2) * w);
    text.setAttribute('y', h + padding.top + 15);
    text.setAttribute('text-anchor', i === 0 ? 'start' : i === 2 ? 'end' : 'middle');
    text.setAttribute('fill', i === 1 ? 'hsl(180, 100%, 45%)' : 'hsl(220, 10%, 50%)');
    text.setAttribute('font-size', '9');
    text.textContent = label;
    svg.appendChild(text);
  });
}

// ========== HEATMAP ==========
function renderHeatmap() {
  const container = document.getElementById('heatmapContainer');
  const vitals = ['HR', 'SpO₂', 'SBP', 'RR', 'Temp', 'CVP', 'PAP', 'ICP', 'CO₂'];
  const configs = [
    { key: 'hr', normal: [60, 100], critical: [45, 140], color: 'hsl(120, 100%, 45%)' },
    { key: 'spo2', normal: [94, 100], critical: [88, 101], color: 'hsl(190, 100%, 50%)' },
    { key: 'sbp', normal: [100, 140], critical: [80, 200], color: 'hsl(280, 100%, 65%)' },
    { key: 'rr', normal: [12, 20], critical: [8, 35], color: 'hsl(55, 100%, 50%)' },
    { key: 'temp', normal: [36.5, 37.5], critical: [35, 39.5], color: 'hsl(25, 100%, 55%)' },
    { key: 'cvp', normal: [2, 8], critical: [0, 12], color: 'hsl(200, 100%, 60%)' },
    { key: 'papSystolic', normal: [15, 25], critical: [10, 40], color: 'hsl(330, 100%, 65%)' },
    { key: 'icp', normal: [5, 15], critical: [3, 20], color: 'hsl(30, 100%, 55%)' },
    { key: 'co2', normal: [35, 45], critical: [25, 55], color: 'hsl(160, 100%, 50%)' }
  ];

  const data = state.vitalHistory.slice(-24);
  
  container.innerHTML = vitals.map((label, i) => {
    const config = configs[i];
    const cells = data.map(d => {
      const val = d[config.key];
      let color, opacity;
      
      if (val < config.critical[0] || val > config.critical[1]) {
        color = 'hsl(0, 85%, 50%)';
        opacity = 1;
      } else if (val < config.normal[0] || val > config.normal[1]) {
        color = 'hsl(45, 100%, 50%)';
        opacity = 0.8;
      } else {
        color = config.color;
        opacity = 0.6;
      }
      
      return `<div class="heatmap-cell" style="background: ${color}; opacity: ${opacity};"></div>`;
    }).join('');

    return `
      <div class="heatmap-row">
        <div class="heatmap-label">${label}</div>
        <div class="heatmap-cells">${cells}</div>
      </div>
    `;
  }).join('');
}

// ========== ALERTS ==========
function checkAlerts() {
  const alerts = [];
  const v = state.vitals;

  if (state.riskLevel === 'CRITICAL') alerts.push('AI RISK: CRITICAL');
  if (v.spO2 < 90) alerts.push(`HYPOXEMIA: SpO₂ ${Math.round(v.spO2)}%`);
  else if (v.spO2 < 94) alerts.push(`LOW SpO₂: ${Math.round(v.spO2)}%`);
  if (v.heartRate > 130) alerts.push(`TACHYCARDIA: HR ${Math.round(v.heartRate)}`);
  if (v.heartRate < 50) alerts.push(`BRADYCARDIA: HR ${Math.round(v.heartRate)}`);
  if (v.systolicBP < 90) alerts.push(`HYPOTENSION: BP ${Math.round(v.systolicBP)}/${Math.round(v.diastolicBP)}`);
  if (v.temperature > 39) alerts.push(`FEVER: ${v.temperature.toFixed(1)}°C`);
  
  if (v.icp > 20) alerts.push(`INTRACRANIAL HYPERTENSION: ICP ${Math.round(v.icp)} mmHg`);
  if (v.co2 > 50) alerts.push(`HYPERCAPNIA: CO₂ ${Math.round(v.co2)} mmHg`);
  if (v.cvp > 12) alerts.push(`ELEVATED CVP: ${v.cvp.toFixed(1)} mmHg`);
  if (v.papSystolic > 35) alerts.push(`PULMONARY HYPERTENSION: PAP ${Math.round(v.papSystolic)}/${Math.round(v.papDiastolic)}`);

  const banner = document.getElementById('alertBanner');
  const alertText = document.getElementById('alertText');

  if (alerts.length > 0 && !state.alertDismissed) {
    banner.style.display = 'flex';
    banner.className = 'alert-banner ' + (state.riskLevel === 'CRITICAL' ? 'alert-critical' : 'alert-warning');
    alertText.textContent = alerts.slice(0, 3).join(' | ');
    playAlertSound();
  } else {
    banner.style.display = 'none';
  }
}

function dismissAlert() {
  state.alertDismissed = true;
  document.getElementById('alertBanner').style.display = 'none';
}

function updateRecommendations() {
  const recs = document.getElementById('recommendations');
  const v = state.vitals;
  let html = '';

  if (state.riskLevel === 'STABLE') {
    html = `
      <div style="padding: 8px; background: rgba(34, 197, 94, 0.1); border-radius: 6px; margin-bottom: 8px;">✓ Vitals within normal limits</div>
      <div style="padding: 8px; background: var(--muted); border-radius: 6px;">Continue current monitoring protocol</div>
    `;
  } else if (state.riskLevel === 'BORDERLINE') {
    html = `
      <div style="padding: 8px; background: rgba(251, 191, 36, 0.1); border-radius: 6px; margin-bottom: 8px;">⚠️ Elevated risk detected</div>
      <div style="padding: 8px; background: var(--muted); border-radius: 6px; margin-bottom: 8px;">• Increase monitoring frequency</div>
      <div style="padding: 8px; background: var(--muted); border-radius: 6px;">• Review medication regimen</div>
    `;
  } else {
    html = `
      <div style="padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; margin-bottom: 8px;">🚨 CRITICAL - Immediate attention required</div>
      <div style="padding: 8px; background: var(--muted); border-radius: 6px; margin-bottom: 8px;">• Notify attending physician</div>
      <div style="padding: 8px; background: var(--muted); border-radius: 6px; margin-bottom: 8px;">• Prepare emergency interventions</div>
      ${v.spO2 < 90 ? '<div style="padding: 8px; background: var(--muted); border-radius: 6px;">• Consider increasing O₂ support</div>' : ''}
      ${v.icp > 20 ? '<div style="padding: 8px; background: var(--muted); border-radius: 6px;">• Consider ICP management</div>' : ''}
    `;
  }
  recs.innerHTML = html;
}

// ========== AUDIO ==========
function playAlertSound() {
  if (state.isMuted || !audioContext) return;
  
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.frequency.value = state.riskLevel === 'CRITICAL' ? 880 : 660;
  osc.type = 'sine';
  gain.gain.value = 0.1;
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.15);
}

function startHeartbeatAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  heartbeatInterval = setInterval(() => {
    if (!state.waveformAudioEnabled || state.isMuted) return;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.frequency.value = 200 + (state.vitals.spO2 - 85) * 20;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.05, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
  }, 60000 / state.vitals.heartRate);
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  const btn = document.getElementById('muteBtn');
  const icon = document.getElementById('muteIcon');
  const text = document.getElementById('muteText');
  
  if (state.isMuted) {
    icon.textContent = '🔇';
    text.textContent = 'Muted';
    btn.classList.remove('active');
  } else {
    icon.textContent = '🔊';
    text.textContent = 'Audio On';
    btn.classList.add('active');
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function toggleWaveformAudio() {
  state.waveformAudioEnabled = !state.waveformAudioEnabled;
  const btn = document.getElementById('waveformAudioBtn');
  
  if (state.waveformAudioEnabled) {
    btn.classList.add('active');
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    startHeartbeatAudio();
  } else {
    btn.classList.remove('active');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  }
}

// ========== CONTROLS ==========
function toggleLive() {
  state.isLive = !state.isLive;
  state.alertDismissed = false;
  const btn = document.getElementById('liveBtn');
  const text = document.getElementById('liveBtnText');
  const dot = document.getElementById('liveDot');
  
  if (state.isLive) {
    btn.className = 'live-btn active';
    text.textContent = 'LIVE';
    dot.style.display = 'block';
  } else {
    btn.className = 'live-btn paused';
    text.textContent = 'PAUSED';
    dot.style.display = 'none';
  }
}

function loadCriticalExample() {
  state.vitals = {
    heartRate: 160,
    spO2: 78,
    systolicBP: 82,
    diastolicBP: 44,
    respiratoryRate: 33,
    temperature: 39.1,
    cvp: 18,
    papSystolic: 42,
    papDiastolic: 18,
    icp: 24,
    co2: 58
  };
  state.labs = {
    lactate: 4.5,
    creatinine: 2.4,
    wbc: 21.0,
    hemoglobin: 8.9,
    glucose: 180,
    potassium: 5.2,
    crp: 27
  };
  state.additionalParams = {
    mobility_score: 0,
    nurse_alert: 1,
    sepsis_risk_score: 8,
    age: 80,
    comorbidity_index: 4,
    hour_from_admission: 2,
    gender: "F",
    oxygen_device: "ventilator",
    admission_type: "emergency",
    oxygen_flow: 14,
    crp_level: 27
  };
  state.alertDismissed = false;
  
  document.getElementById('lactateValue').textContent = state.labs.lactate;
  document.getElementById('creatinineValue').textContent = state.labs.creatinine;
  document.getElementById('wbcValue').textContent = state.labs.wbc;
  document.getElementById('hgbValue').textContent = state.labs.hemoglobin;
  document.getElementById('glucoseValue').textContent = state.labs.glucose;
  document.getElementById('potassiumValue').textContent = state.labs.potassium;
  document.getElementById('crpValue').textContent = state.labs.crp;
  
  document.getElementById('gcsValue').textContent = 10;
  document.getElementById('sofaValue').textContent = 12;
  document.getElementById('apacheValue').textContent = 28;
  document.getElementById('sepsisValue').textContent = state.additionalParams.sepsis_risk_score;
  
  document.getElementById('oxygenDevice').textContent = 
    `Ventilator @ ${state.additionalParams.oxygen_flow}L/min`;
  
  document.getElementById('inputHR').value = state.vitals.heartRate;
  document.getElementById('inputSpO2').value = state.vitals.spO2;
  document.getElementById('inputSBP').value = state.vitals.systolicBP;
  document.getElementById('inputDBP').value = state.vitals.diastolicBP;
  document.getElementById('inputTemp').value = state.vitals.temperature;
  document.getElementById('inputRR').value = state.vitals.respiratoryRate;
  document.getElementById('inputLactate').value = state.labs.lactate;
  document.getElementById('inputCreatinine').value = state.labs.creatinine;
  document.getElementById('inputWBC').value = state.labs.wbc;
  document.getElementById('inputHGB').value = state.labs.hemoglobin;
  document.getElementById('inputCRP').value = state.labs.crp;
  document.getElementById('inputO2Flow').value = state.additionalParams.oxygen_flow;
  document.getElementById('inputO2Device').value = state.additionalParams.oxygen_device;
  document.getElementById('inputMobility').value = state.additionalParams.mobility_score;
  document.getElementById('inputNurseAlert').value = state.additionalParams.nurse_alert;
  document.getElementById('inputSepsisRisk').value = state.additionalParams.sepsis_risk_score;
  document.getElementById('inputAge').value = state.additionalParams.age;
  document.getElementById('inputComorbidity').value = state.additionalParams.comorbidity_index;
  document.getElementById('inputHours').value = state.additionalParams.hour_from_admission;
  document.getElementById('inputGender').value = state.additionalParams.gender;
  document.getElementById('inputAdmissionType').value = state.additionalParams.admission_type;
  
  calculateWaveformParameters();
  getMLPrediction();
  updateUI();
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

function applyManualInputs() {
  state.vitals.heartRate = parseFloat(document.getElementById('inputHR').value);
  state.vitals.spO2 = parseFloat(document.getElementById('inputSpO2').value);
  state.vitals.systolicBP = parseFloat(document.getElementById('inputSBP').value);
  state.vitals.diastolicBP = parseFloat(document.getElementById('inputDBP').value);
  state.vitals.temperature = parseFloat(document.getElementById('inputTemp').value);
  state.vitals.respiratoryRate = parseFloat(document.getElementById('inputRR').value);
  
  state.labs.lactate = parseFloat(document.getElementById('inputLactate').value);
  state.labs.creatinine = parseFloat(document.getElementById('inputCreatinine').value);
  state.labs.wbc = parseFloat(document.getElementById('inputWBC').value);
  state.labs.hemoglobin = parseFloat(document.getElementById('inputHGB').value);
  state.labs.crp = parseFloat(document.getElementById('inputCRP').value);
  
  state.additionalParams.mobility_score = parseInt(document.getElementById('inputMobility').value);
  state.additionalParams.nurse_alert = parseInt(document.getElementById('inputNurseAlert').value);
  state.additionalParams.sepsis_risk_score = parseInt(document.getElementById('inputSepsisRisk').value);
  state.additionalParams.age = parseInt(document.getElementById('inputAge').value);
  state.additionalParams.comorbidity_index = parseInt(document.getElementById('inputComorbidity').value);
  state.additionalParams.hour_from_admission = parseInt(document.getElementById('inputHours').value);
  state.additionalParams.gender = document.getElementById('inputGender').value;
  state.additionalParams.admission_type = document.getElementById('inputAdmissionType').value;
  state.additionalParams.oxygen_flow = parseFloat(document.getElementById('inputO2Flow').value);
  state.additionalParams.oxygen_device = document.getElementById('inputO2Device').value;
  state.additionalParams.crp_level = parseFloat(document.getElementById('inputCRP').value);
  
  document.getElementById('lactateValue').textContent = state.labs.lactate;
  document.getElementById('creatinineValue').textContent = state.labs.creatinine;
  document.getElementById('wbcValue').textContent = state.labs.wbc;
  document.getElementById('hgbValue').textContent = state.labs.hemoglobin;
  document.getElementById('crpValue').textContent = state.labs.crp;
  document.getElementById('sepsisValue').textContent = state.additionalParams.sepsis_risk_score;
  document.getElementById('oxygenDevice').textContent = 
    `${state.additionalParams.oxygen_device.replace('_', ' ')} @ ${state.additionalParams.oxygen_flow}L/min`;
  
  calculateWaveformParameters();
  getMLPrediction();
  updateUI();
}

function toggleVent() {
  const enabled = document.getElementById('ventEnabled').checked;
  const grid = document.getElementById('ventGrid');
  grid.style.opacity = enabled ? '1' : '0.5';
  grid.style.pointerEvents = enabled ? 'auto' : 'none';
  document.getElementById('oxygenDevice').textContent = enabled ? 'Ventilator' : 'Nasal Cannula @ 2L/min';
  state.additionalParams.oxygen_device = enabled ? 'ventilator' : 'nasal_cannula';
}

function addNote() {
  const textarea = document.getElementById('newNote');
  const content = textarea.value.trim();
  if (!content) return;
  
  notes.unshift({
    author: 'Current User',
    role: 'RN',
    time: 'Just now',
    content
  });
  
  textarea.value = '';
  renderNotes();
}

function requestNotifications() {
  if ('Notification' in window) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification('ICU Alerts Enabled', { body: 'You will receive critical vital alerts' });
      }
    });
  }
}

// ========== RENDER LISTS ==========
function renderPatientList() {
  const container = document.getElementById('patientList');
  container.innerHTML = patients.map(p => {
    const riskClass = p.level === 'CRITICAL' ? 'critical' : p.level === 'BORDERLINE' ? 'warning' : '';
    const activeClass = p.id === state.activePatientId ? 'active' : '';
    
    return `
      <div class="patient-card ${riskClass} ${activeClass}" onclick="selectPatient('${p.id}')">
        <div class="patient-card-header">
          <span class="patient-bed">${p.bed}</span>
          <span class="patient-risk-badge ${riskClass || 'stable'}">${p.risk}%</span>
        </div>
        <div style="font-size: 12px; color: var(--muted-foreground); margin-bottom: 8px;">
          ${p.id} • ${p.age}y ${p.gender}
        </div>
        <div class="patient-card-vitals">
          <div class="mini-vital">❤️ <span class="mini-vital-value">${p.hr}</span></div>
          <div class="mini-vital">🫁 <span class="mini-vital-value">${p.spo2}%</span></div>
        </div>
      </div>
    `;
  }).join('');
}

function selectPatient(id) {
  state.activePatientId = id;
  const patient = patients.find(p => p.id === id);
  if (patient) {
    document.getElementById('patientId').textContent = patient.id;
    document.getElementById('patientDetails').textContent = `${patient.age}y ${patient.gender} • Emergency`;
    document.getElementById('patientBed').textContent = patient.bed;
    
    state.vitals.heartRate = patient.hr;
    state.vitals.spO2 = patient.spo2;
    state.riskScore = patient.risk;
    state.riskLevel = patient.level;
    state.alertDismissed = false;
    state.additionalParams.age = patient.age;
    state.additionalParams.gender = patient.gender;
    
    document.getElementById('inputAge').value = patient.age;
    document.getElementById('inputGender').value = patient.gender;
    
    calculateWaveformParameters();
    getMLPrediction();
    updateUI();
  }
  renderPatientList();
}

function renderMedications() {
  const container = document.getElementById('medList');
  container.innerHTML = medications.map(m => `
    <div class="med-item">
      <div>
        <div class="med-name">${m.name}</div>
        <div class="med-dose">${m.dose} • ${m.route}</div>
      </div>
      <span class="med-status ${m.status}">${m.status.toUpperCase()}</span>
    </div>
  `).join('');
}

function renderNotes() {
  const container = document.getElementById('notesList');
  container.innerHTML = notes.map(n => `
    <div class="note-item">
      <div class="note-header">
        <span class="note-author">${n.author} <span style="color: var(--muted-foreground);">(${n.role})</span></span>
        <span class="note-time">${n.time}</span>
      </div>
      <div class="note-content">${n.content}</div>
    </div>
  `).join('');
}

function updateClock() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleTimeString();
  
  const icuStart = Date.now() - 18 * 60 * 60 * 1000;
  const diff = Date.now() - icuStart;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  document.getElementById('icuTime').textContent = `${hours}h ${minutes}m`;
  
  state.additionalParams.hour_from_admission = hours;
}

// ========== INITIALIZE EVERYTHING ==========
window.addEventListener('load', init);
window.addEventListener('resize', handleResize);
document.addEventListener('DOMContentLoaded', init);

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready, init running");
  init();
});

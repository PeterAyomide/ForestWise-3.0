// ===== ENHANCED API CONFIGURATION =====
const API_KEYS = {
  OPEN_WEATHER: 'eb72c3ca636ba4bee8afcfedf448ad4d',
  OPENAI: '', 
  GEMINI: '',
  // New APIs for enhanced features
  SOILGRIDS: '', // ISRIC SoilGrids API (free, no key required)
  OPENMETEO: '', // OpenMeteo API (free, no key required)
  NASA_POWER: '' // NASA POWER API (free, no key required)
};

// API Endpoints
const API_ENDPOINTS = {
  soilGrids: 'https://rest.isric.org/soilgrids/v2.0/properties/query?',
  openMeteo: 'https://api.open-meteo.com/v1/forecast',
  openMeteoHistorical: 'https://archive-api.open-meteo.com/v1/archive',
  nasaPower: 'https://power.larc.nasa.gov/api/temporal/climatology/point',
  openWeather: 'https://api.openweathermap.org/data/2.5/weather'
};

// ===== ENHANCED GLOBAL STATE =====
let speciesData = null;
let currentWikiContext = '';
let userLocation = null;
let soilHealthHistory = [];
let currentRadarChart = null;

// Project type configuration
const PROJECT_TYPES = {
  agroforestry: { 
    icon: '🌳', 
    color: '#22c55e',
    name: 'Agroforestry',
    description: 'Integrating trees with crops and livestock'
  },
  restoration: { 
    icon: '🌱', 
    color: '#84cc16',
    name: 'Restoration',
    description: 'Restoring degraded lands and ecosystems'
  },
  carbon: { 
    icon: '🔥', 
    color: '#ef4444',
    name: 'Carbon Project',
    description: 'Focus on carbon sequestration and climate benefits'
  },
  watershed: { 
    icon: '💧', 
    color: '#3b82f6',
    name: 'Watershed Protection',
    description: 'Protecting water sources and preventing erosion'
  },
  urban: { 
    icon: '🏡', 
    color: '#8b5cf6',
    name: 'Urban Greening',
    description: 'Greening cities and urban areas'
  }
};

let isMenuOpen = false;
let currentPage = 'recommendation'; // Default page
let pageHistory = [];

// Define pages configuration
const pages = {
  'recommendation': { id: 'recommendation-page', name: 'Tree Recommender' },
  'projects':       { id: 'projects-page',       name: 'Projects & Mapping' },
  'soil-health':    { id: 'soil-health-page',    name: 'Land Health Check' }
};


// Soil health assessment weights
const SOIL_HEALTH_WEIGHTS = {
  soilStructure: 0.3,
  erosion: 0.3,
  vegetation: 0.25,
  landUse: 0.15
};

// ===== ENHANCED SOIL HEALTH ASSESSMENT SYSTEM =====
function initSoilHealthAssessment() {
  console.log('🌱 Initializing enhanced soil health assessment...');
  
  // Debug: Check if key elements exist
  const requiredElements = [
    'detectSoilData', 'apiStatus', 'autoDetectedData', 
    'soilProperties', 'climateData', 'soilHealthRadar',
    'soilResults', 'restartAssessment', 'refreshApiData'
  ];
  
  requiredElements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`Soil Health Element ${id}:`, element ? 'EXISTS' : 'MISSING');
  });

  // Event listeners for wizard navigation - with safety checks
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  
  if (nextButtons.length > 0) {
    nextButtons.forEach(btn => {
      btn.addEventListener('click', goToNextStep);
    });
    console.log(`✅ Added ${nextButtons.length} next-step listeners`);
  } else {
    console.warn('❌ No .next-step buttons found');
  }
  
  if (prevButtons.length > 0) {
    prevButtons.forEach(btn => {
      btn.addEventListener('click', goToPrevStep);
    });
    console.log(`✅ Added ${prevButtons.length} prev-step listeners`);
  } else {
    console.warn('❌ No .prev-step buttons found');
  }
  
  // Soil data detection
  const detectBtn = document.getElementById('detectSoilData');
  if (detectBtn) {
    detectBtn.addEventListener('click', detectSoilAndClimateData);
    console.log('✅ Added detectSoilData listener');
  } else {
    console.warn('❌ detectSoilData button not found');
  }
  
  const refreshBtn = document.getElementById('refreshApiData');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshApiData);
    console.log('✅ Added refreshApiData listener');
  }
  
  // Restart assessment
  const restartBtn = document.getElementById('restartAssessment');
  if (restartBtn) {
    restartBtn.addEventListener('click', restartAssessment);
    console.log('✅ Added restartAssessment listener');
  }
  
  // Data confirmation buttons
  const confirmButtons = document.querySelectorAll('.confirm-data');
  if (confirmButtons.length > 0) {
    confirmButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const isAccurate = this.dataset.confirm === 'true';
        handleDataConfirmation(isAccurate);
      });
    });
    console.log(`✅ Added ${confirmButtons.length} confirm-data listeners`);
  }
  
  // Assessment option selection
  const assessmentOptions = document.querySelectorAll('.assessment-option');
  if (assessmentOptions.length > 0) {
    assessmentOptions.forEach(option => {
      option.addEventListener('click', function() {
        const radio = this.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          // Update visual selection
          const parent = this.closest('.assessment-question');
          if (parent) {
            parent.querySelectorAll('.assessment-option').forEach(opt => {
              opt.classList.remove('selected');
            });
          }
          this.classList.add('selected');
          
          // Update radar chart if on step 2
          const activeStep = document.querySelector('.wizard-step.active');
          if (activeStep && activeStep.dataset.step === '2') {
            setTimeout(() => updateRadarChart(), 100);
          }
        }
      });
    });
    console.log(`✅ Added ${assessmentOptions.length} assessment-option listeners`);
  }
  
  // Load soil health history
  loadSoilHealthHistory();
  
  console.log('✅ Soil health assessment fully initialized');
}

async function detectSoilAndClimateData() {
  if (!userLocation) {
    showNotification('Please detect your location first', 'warning');
    return;
  }

  const detectBtn = document.getElementById('detectSoilData');
  const apiStatus = document.getElementById('apiStatus');
  const autoDetectedData = document.getElementById('autoDetectedData');
  
  // Show loading state
  detectBtn.innerHTML = '<div class="loading-spinner"></div> Fetching environmental data...';
  detectBtn.disabled = true;
  
  if (apiStatus) apiStatus.classList.remove('hidden');
  
  try {
    // Update API status
    updateApiStatus('soil', 'loading');
    updateApiStatus('weather', 'loading');
    updateApiStatus('climate', 'loading');
    
    // Fetch all data in parallel
    const [soilData, climateData, weatherData] = await Promise.all([
      fetchSoilData(userLocation.latitude, userLocation.longitude),
      fetchClimateData(userLocation.latitude, userLocation.longitude),
      fetchWeatherData(userLocation.latitude, userLocation.longitude)
    ]);
    
    // Display the data
    displayDetectedData(soilData, climateData, weatherData);
    
    // Update API status
    updateApiStatus('soil', 'connected');
    updateApiStatus('weather', 'connected');
    updateApiStatus('climate', 'connected');
    
    // Show auto-detected data section
    autoDetectedData.classList.remove('hidden');
    
    showNotification('Environmental data loaded successfully!', 'success');
    
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    showNotification('Failed to fetch some environmental data. Using fallback data.', 'error');
    
    // Update API status to show errors
    updateApiStatus('soil', 'disconnected');
    updateApiStatus('weather', 'disconnected');
    updateApiStatus('climate', 'disconnected');
    
    // Show fallback data
    displayFallbackData();
  } finally {
    // Reset button
    detectBtn.innerHTML = '<i class="fas fa-satellite mr-2"></i>Detect Soil & Climate Data';
    detectBtn.disabled = false;
  }
}

async function fetchSoilData(lat, lng) {
  try {
    const soilParams = ['clay', 'sand', 'silt', 'phh2o', 'soc'];
    const depth = '0-5cm';
    
    const responses = await Promise.all(
      soilParams.map(param => 
        fetch(`${API_ENDPOINTS.soilGrids}lat=${lat}&lon=${lng}&property=${param}&depth=${depth}&value=mean`)
          .then(r => r.json())
      )
    );
    
    const soilData = {};
    responses.forEach((response, index) => {
      const param = soilParams[index];
      if (response.properties && response.properties.layers) {
        const value = response.properties.layers[0].depths[0].values.mean;
        soilData[param] = value;
      }
    });
    
    return soilData;
  } catch (error) {
    console.error('Soil data fetch error:', error);
    // Return fallback data based on location
    return getFallbackSoilData(lat, lng);
  }
}

async function fetchClimateData(lat, lng) {
  try {
    // Use OpenMeteo for historical climate data
    const response = await fetch(
      `${API_ENDPOINTS.openMeteoHistorical}?latitude=${lat}&longitude=${lng}&start_date=2000-01-01&end_date=2020-12-31&daily=temperature_2m_mean,precipitation_sum&timezone=auto`
    );
    
    if (!response.ok) throw new Error('Climate API failed');
    
    const data = await response.json();
    
    // Calculate averages
    const tempData = data.daily.temperature_2m_mean;
    const precipData = data.daily.precipitation_sum;
    
    const avgTemp = tempData.reduce((a, b) => a + b, 0) / tempData.length;
    const annualRainfall = precipData.reduce((a, b) => a + b, 0) / (tempData.length / 365.25);
    
    return {
      averageTemperature: Math.round(avgTemp),
      annualRainfall: Math.round(annualRainfall),
      dataPoints: tempData.length
    };
  } catch (error) {
    console.error('Climate data fetch error:', error);
    return getFallbackClimateData(lat, lng);
  }
}

async function fetchWeatherData(lat, lng) {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.openWeather}?lat=${lat}&lon=${lng}&appid=${API_KEYS.OPEN_WEATHER}&units=metric`
    );
    
    if (!response.ok) throw new Error('Weather API failed');
    
    const data = await response.json();
    
    return {
      currentTemp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: data.wind.speed
    };
  } catch (error) {
    console.error('Weather data fetch error:', error);
    return getFallbackWeatherData(lat, lng);
  }
}

function getFallbackSoilData(lat, lng) {
  // Simple fallback based on latitude (tropical vs temperate)
  const isTropical = Math.abs(lat) < 30;
  
  return {
    clay: isTropical ? 25 : 35,
    sand: isTropical ? 45 : 40,
    silt: isTropical ? 30 : 25,
    phh2o: isTropical ? 6.2 : 6.8,
    soc: isTropical ? 1.8 : 2.5
  };
}

function getFallbackClimateData(lat, lng) {
  const isTropical = Math.abs(lat) < 30;
  
  return {
    averageTemperature: isTropical ? 28 : 15,
    annualRainfall: isTropical ? 1500 : 800,
    dataPoints: 7300, // 20 years of daily data
    isFallback: true
  };
}

function getFallbackWeatherData(lat, lng) {
  const isTropical = Math.abs(lat) < 30;
  
  return {
    currentTemp: isTropical ? 30 : 18,
    humidity: isTropical ? 75 : 60,
    description: 'Partly cloudy',
    windSpeed: 3.5,
    isFallback: true
  };
}

function displayDetectedData(soilData, climateData, weatherData) {
  const soilProperties = document.getElementById('soilProperties');
  const climateDisplay = document.getElementById('climateData');
  
  if (soilProperties) {
    soilProperties.innerHTML = `
      <div class="flex justify-between"><span>Clay Content:</span><span class="font-semibold">${soilData.clay?.toFixed(1) || 'N/A'}%</span></div>
      <div class="flex justify-between"><span>Sand Content:</span><span class="font-semibold">${soilData.sand?.toFixed(1) || 'N/A'}%</span></div>
      <div class="flex justify-between"><span>Silt Content:</span><span class="font-semibold">${soilData.silt?.toFixed(1) || 'N/A'}%</span></div>
      <div class="flex justify-between"><span>Soil pH:</span><span class="font-semibold">${soilData.phh2o?.toFixed(1) || 'N/A'}</span></div>
      <div class="flex justify-between"><span>Organic Carbon:</span><span class="font-semibold">${soilData.soc?.toFixed(1) || 'N/A'}%</span></div>
      ${soilData.isFallback ? '<div class="text-xs text-yellow-600 mt-1">⚠️ Using estimated data</div>' : ''}
    `;
  }
  
  if (climateDisplay) {
    climateDisplay.innerHTML = `
      <div class="flex justify-between"><span>Avg Temperature:</span><span class="font-semibold">${climateData.averageTemperature}°C</span></div>
      <div class="flex justify-between"><span>Annual Rainfall:</span><span class="font-semibold">${climateData.annualRainfall} mm</span></div>
      <div class="flex justify-between"><span>Current Weather:</span><span class="font-semibold">${weatherData.currentTemp}°C, ${weatherData.humidity}% humidity</span></div>
      <div class="flex justify-between"><span>Data Source:</span><span class="font-semibold">${climateData.dataPoints || weatherData.isFallback ? 'Historical' : 'Live'} Data</span></div>
      ${climateData.isFallback || weatherData.isFallback ? '<div class="text-xs text-yellow-600 mt-1">⚠️ Using estimated data</div>' : ''}
    `;
  }
}

function displayFallbackData() {
  const soilProperties = document.getElementById('soilProperties');
  const climateDisplay = document.getElementById('climateData');
  const autoDetectedData = document.getElementById('autoDetectedData');
  
  if (soilProperties && climateDisplay) {
    soilProperties.innerHTML = `
      <div class="text-yellow-600 text-sm">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        Soil data unavailable. Please manually assess your soil.
      </div>
    `;
    
    climateDisplay.innerHTML = `
      <div class="text-yellow-600 text-sm">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        Climate data unavailable. Please manually input climate information.
      </div>
    `;
    
    autoDetectedData.classList.remove('hidden');
  }
}

function updateApiStatus(api, status) {
  const statusElement = document.getElementById(`${api}ApiStatus`);
  if (statusElement) {
    statusElement.className = `api-status-${status}`;
    statusElement.innerHTML = `<i class="fas fa-circle mr-1"></i>${api.charAt(0).toUpperCase() + api.slice(1)} Data`;
    
    // Update icon based on status
    const icon = statusElement.querySelector('i');
    if (icon) {
      icon.className = `fas fa-${status === 'connected' ? 'check' : status === 'loading' ? 'sync' : 'exclamation'}-circle mr-1`;
    }
  }
}

function handleDataConfirmation(isAccurate) {
  if (isAccurate) {
    showNotification('Great! Using detected environmental data for assessment.', 'success');
    // Auto-proceed to next step
    setTimeout(() => goToNextStep(), 1000);
  } else {
    showNotification('Please manually assess your soil conditions in the next step.', 'info');
    // Still proceed but with manual assessment
    setTimeout(() => goToNextStep(), 1000);
  }
}

function updateRadarChart() {
  const canvas = document.getElementById('soilHealthRadar');
  if (!canvas) {
    console.error('Radar chart canvas element not found');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2D context for radar chart');
    return;
  }

  // Destroy existing chart if it exists
  if (currentRadarChart) {
    currentRadarChart.destroy();
  }

  const scores = calculateCurrentScores();
  console.log('Current scores for radar:', scores);
  
  const labels = ['Soil Structure', 'Erosion Control', 'Vegetation Cover', 'Land Management', 'Water Retention'];
  
  // Ensure we have valid scores (default to 1 if undefined)
  const currentScores = [
    scores.soilQuality || 1,
    scores.erosionControl || 1, 
    scores.vegetationCover || 1,
    scores.landManagement || 1,
    3 // Water retention estimated
  ];
  
  const idealScores = [5, 5, 5, 5, 5];

  try {
    currentRadarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Current Condition',
            data: currentScores,
            backgroundColor: 'rgba(212, 175, 55, 0.2)',
            borderColor: '#D4AF37',
            borderWidth: 2,
            pointBackgroundColor: '#D4AF37',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#D4AF37'
          },
          {
            label: 'Ideal Healthy Land',
            data: idealScores,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: '#22c55e',
            borderWidth: 1,
            borderDash: [5, 5],
            pointBackgroundColor: '#22c55e',
            pointBorderColor: '#fff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { 
              color: 'rgba(0, 0, 0, 0.1)',
              lineWidth: 1
            },
            grid: { 
              color: 'rgba(0, 0, 0, 0.1)',
              circular: true
            },
            pointLabels: { 
              font: { 
                size: 11,
                family: "'Inter', sans-serif" 
              },
              color: 'rgba(0, 0, 0, 0.7)'
            },
            min: 0,
            max: 5,
            ticks: { 
              stepSize: 1,
              backdropColor: 'transparent'
            },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: "'Inter', sans-serif"
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw}/5`;
              }
            }
          }
        },
        elements: {
          line: {
            tension: 0.1
          }
        }
      }
    });
    
    console.log('Radar chart created successfully');
  } catch (error) {
    console.error('Error creating radar chart:', error);
  }
}

function goToNextStep() {
  const currentStep = document.querySelector('.wizard-step.active');
  if (!currentStep) {
    console.error('No active step found');
    return;
  }

  const currentStepNumber = parseInt(currentStep.dataset.step);
  const nextStepNumber = currentStepNumber + 1;
  const nextStep = document.querySelector(`.wizard-step[data-step="${nextStepNumber}"]`);
  
  if (!nextStep) {
    console.warn(`Step ${nextStepNumber} not found`);
    return;
  }

  console.log(`Moving from step ${currentStepNumber} to step ${nextStepNumber}`);

  // Hide current step
  currentStep.classList.remove('active');
  currentStep.classList.add('hidden');

  // Show next step
  nextStep.classList.remove('hidden');
  nextStep.classList.add('active');

  // === CRITICAL LOGIC ===
  if (nextStepNumber === 2) {
    // We are now on Step 2, initialize/update radar
    setTimeout(() => {
      updateRadarChart();
    }, 300);
  } 
  else if (nextStepNumber === 3) {
    // We are moving to Step 3 (Results), perform calculation
    calculateEnhancedSoilHealthResults();
    saveSoilHealthAssessment();
  }
  // ======================

  // Scroll to top of new step
  nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Add this MISSING function to main.js
function goToPrevStep() {
  const currentStep = document.querySelector('.wizard-step.active');
  if (!currentStep) return;

  const currentStepNumber = parseInt(currentStep.dataset.step);
  const prevStepNumber = currentStepNumber - 1;
  const prevStep = document.querySelector(`.wizard-step[data-step="${prevStepNumber}"]`);
  
  if (!prevStep) return;

  console.log(`Moving from step ${currentStepNumber} to step ${prevStepNumber}`);

  // Hide current step
  currentStep.classList.remove('active');
  currentStep.classList.add('hidden');

  // Show previous step
  prevStep.classList.remove('hidden');
  prevStep.classList.add('active');

  // Re-initialize radar chart if going back to step 2
  if (prevStepNumber === 2) {
    setTimeout(() => {
      updateRadarChart();
    }, 300);
  }

  // Scroll to top of step
  prevStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function calculateEnhancedSoilHealthResults() {
  const scores = calculateCurrentScores();
  
  // Calculate weighted overall score
  const overallScore = (
    scores.soilQuality * SOIL_HEALTH_WEIGHTS.soilStructure +
    scores.erosionControl * SOIL_HEALTH_WEIGHTS.erosion +
    scores.vegetationCover * SOIL_HEALTH_WEIGHTS.vegetation +
    scores.landManagement * SOIL_HEALTH_WEIGHTS.landUse
  );
  
  // Generate enhanced recommendations
  const recommendations = generateEnhancedRecommendations(scores, overallScore);
  
  // Display enhanced results
  displayEnhancedSoilHealthResults(overallScore, scores, recommendations);
}

function generateEnhancedRecommendations(scores, overallScore) {
  const recommendations = [];
  const locationInfo = userLocation ? ` in your location` : '';
  
  // Soil quality recommendations
  if (scores.soilQuality <= 2) {
    recommendations.push({
      priority: 'high',
      title: 'Improve Soil Health',
      description: `Add organic matter like compost or manure${locationInfo}. Consider soil-improving trees like legumes (e.g., Leucaena, Gliricidia) to fix nitrogen.`,
      icon: 'fas fa-seedling',
      species: getSpeciesForGoal('soil_improvement')
    });
  }
  
  // Erosion control recommendations
  if (scores.erosionControl <= 2) {
    recommendations.push({
      priority: 'high',
      title: 'Control Erosion',
      description: `Plant ground cover species and erosion-control trees${locationInfo}. Use contour planting and terracing on slopes.`,
      icon: 'fas fa-mountain',
      species: getSpeciesForGoal('erosion_control')
    });
  }
  
  // Vegetation recommendations
  if (scores.vegetationCover <= 2) {
    recommendations.push({
      priority: 'medium',
      title: 'Increase Plant Cover',
      description: `Start with fast-growing pioneer species${locationInfo} to establish ground cover and create favorable conditions for other species.`,
      icon: 'fas fa-leaf',
      species: getSpeciesForGoal('pioneer')
    });
  }
  
  // Overall strategy based on weighted score
  if (overallScore >= 4) {
    recommendations.push({
      priority: 'low',
      title: 'Maintain & Enhance Biodiversity',
      description: `Your land is healthy! Focus on planting diverse native species${locationInfo} to enhance ecosystem resilience.`,
      icon: 'fas fa-check-circle',
      species: getSpeciesForGoal('biodiversity')
    });
  } else if (overallScore >= 2.5) {
    recommendations.push({
      priority: 'medium',
      title: 'Restore & Improve Gradually',
      description: `Mix pioneer species with medium-term trees${locationInfo} for gradual improvement. Focus on soil-building species.`,
      icon: 'fas fa-tools',
      species: getSpeciesForGoal('general_restoration')
    });
  } else {
    recommendations.push({
      priority: 'high',
      title: 'Urgent Restoration Needed',
      description: `Start with hardy pioneer species${locationInfo}. Consider soil amendments and water management techniques.`,
      icon: 'fas fa-exclamation-triangle',
      species: getSpeciesForGoal('hardy_pioneer')
    });
  }
  
  return recommendations;
}

// LAND HEALTH – RADAR SECTION
// ----------------------------

// Helper: safely read radio button values
function readRadioValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? parseInt(el.value) : null;   // null means “not answered yet”
}

// Main function: read the user's selections
function calculateCurrentScores() {
    return {
        canopy:       readRadioValue("canopyCondition"),
        soilStructure: readRadioValue("soilStructure"),
        organicMatter: readRadioValue("organicMatter"),
        moisture:      readRadioValue("moistureLevel"),
        biodiversity:  readRadioValue("biodiversityLevel")
    };
}

// Draw radar chart ONLY when user selects something
function updateRadarChart(scores) {
    const canvas = document.getElementById("soilHealthRadar");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Destroy old chart if exists
    if (currentRadarChart) {
        currentRadarChart.destroy();
    }

    // Convert nulls to 0 for chart visualization
    const datasetValues = [
        scores.canopy       ?? 0,
        scores.soilStructure ?? 0,
        scores.organicMatter ?? 0,
        scores.moisture      ?? 0,
        scores.biodiversity  ?? 0
    ];

    currentRadarChart = new Chart(ctx, {
        type: "radar",
        data: {
            labels: ["Canopy", "Soil Structure", "Org. Matter", "Moisture", "Biodiversity"],
            datasets: [{
                label: "Land Health Condition",
                data: datasetValues,
                fill: true,
                pointRadius: 4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// Listener: waits for user interaction
const landHealthForm = document.getElementById("landHealthForm");

if (landHealthForm) {
    landHealthForm.addEventListener("change", () => {
        const scores = calculateCurrentScores();

        // Update radar immediately
        updateRadarChart(scores);

        // Do NOT advance to scoring unless all 5 questions are answered
        const allAnswered = Object.values(scores).every(v => v !== null);

        if (allAnswered) {
            calculateLandHealthScore(scores);
        }
    });
}

// Final scoring function (Step 3)
function calculateLandHealthScore(scores) {
    const values = Object.values(scores);

    // Safe average
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const outOfFive = avg.toFixed(1);

    document.getElementById("landHealthScore").innerText =
        `Land Health Score: ${outOfFive} / 5`;

    document.getElementById("landScoreText").innerText =
        interpretHealthScore(avg);
}

// Optional: Give interpretation text
function interpretHealthScore(score) {
    if (score >= 4) return "Excellent land with strong ecological function.";
    if (score >= 3) return "Good land with minor issues.";
    if (score >= 2) return "Moderate land – some improvements needed.";
    return "Poor land health – restoration recommended."
} 

function getSpeciesForGoal(goal) {
  if (!speciesData) return [];
  
  const goalMap = {
    soil_improvement: ['Legume', 'Nitrogen Fixing'],
    erosion_control: ['Erosion Control', 'Ground Cover'],
    pioneer: ['Pioneer', 'Fast Growing'],
    biodiversity: ['Native', 'Biodiversity'],
    general_restoration: ['General Restoration'],
    hardy_pioneer: ['Pioneer', 'Drought Tolerant']
  };
  
  const goalKeywords = goalMap[goal] || [];
  
  return speciesData
    .filter(species => {
      const goals = (species['Restoration Goal'] || '').toLowerCase();
      return goalKeywords.some(keyword => goals.includes(keyword.toLowerCase()));
    })
    .slice(0, 3); // Return top 3 matches
}

function displayEnhancedSoilHealthResults(overallScore, scores, recommendations) {
  const resultsContainer = document.getElementById('soilResults');
  const scorePercentage = (overallScore / 5) * 100;
  
  let healthLevel, healthColor, healthDescription;
  
  if (overallScore >= 4) {
    healthLevel = 'Excellent';
    healthColor = 'health-score-excellent';
    healthDescription = 'Your land is in great condition with good restoration potential!';
  } else if (overallScore >= 3) {
    healthLevel = 'Good';
    healthColor = 'health-score-good';
    healthDescription = 'Your land has good potential with some targeted improvements.';
  } else if (overallScore >= 2) {
    healthLevel = 'Moderate';
    healthColor = 'health-score-moderate';
    healthDescription = 'Your land needs restoration work but has recovery potential.';
  } else {
    healthLevel = 'Poor';
    healthColor = 'health-score-poor';
    healthDescription = 'Urgent restoration needed. Start with hardy pioneer species.';
  }
  
  resultsContainer.innerHTML = `
    <!-- Overall Score -->
    <div class="glass p-6 text-center ${healthColor} rounded-2xl">
      <h4 class="text-2xl font-bold mb-2">Land Health Score</h4>
      <div class="text-5xl font-bold mb-2">${overallScore.toFixed(1)}/5.0</div>
      <div class="text-xl font-semibold mb-2">${healthLevel}</div>
      <p class="opacity-90">${healthDescription}</p>
      <div class="w-full bg-forest-200 dark:bg-forest-700 rounded-full h-3 mt-4">
        <div class="bg-gradient-to-r from-green-500 to-gold-400 h-3 rounded-full transition-all duration-1000" 
             style="width: ${scorePercentage}%"></div>
      </div>
    </div>
    
    <!-- Detailed Scores with Weights -->
    <div class="grid md:grid-cols-2 gap-4">
      <div class="health-indicator glass p-4 rounded-xl">
        <div class="flex justify-between items-center mb-2">
          <h5 class="font-semibold flex items-center">
            <i class="fas fa-seedling text-green-500 mr-2"></i>Soil Quality
          </h5>
          <span class="text-xs bg-forest-100 dark:bg-forest-700 px-2 py-1 rounded">${(SOIL_HEALTH_WEIGHTS.soilStructure * 100)}% weight</span>
        </div>
        <div class="text-2xl font-bold">${scores.soilQuality}/5</div>
      </div>
      
      <div class="health-indicator glass p-4 rounded-xl">
        <div class="flex justify-between items-center mb-2">
          <h5 class="font-semibold flex items-center">
            <i class="fas fa-mountain text-blue-500 mr-2"></i>Erosion Control
          </h5>
          <span class="text-xs bg-forest-100 dark:bg-forest-700 px-2 py-1 rounded">${(SOIL_HEALTH_WEIGHTS.erosion * 100)}% weight</span>
        </div>
        <div class="text-2xl font-bold">${scores.erosionControl}/5</div>
      </div>
      
      <div class="health-indicator glass p-4 rounded-xl">
        <div class="flex justify-between items-center mb-2">
          <h5 class="font-semibold flex items-center">
            <i class="fas fa-leaf text-green-400 mr-2"></i>Vegetation Cover
          </h5>
          <span class="text-xs bg-forest-100 dark:bg-forest-700 px-2 py-1 rounded">${(SOIL_HEALTH_WEIGHTS.vegetation * 100)}% weight</span>
        </div>
        <div class="text-2xl font-bold">${scores.vegetationCover}/5</div>
      </div>
      
      <div class="health-indicator glass p-4 rounded-xl">
        <div class="flex justify-between items-center mb-2">
          <h5 class="font-semibold flex items-center">
            <i class="fas fa-tractor text-amber-500 mr-2"></i>Land Management
          </h5>
          <span class="text-xs bg-forest-100 dark:bg-forest-700 px-2 py-1 rounded">${(SOIL_HEALTH_WEIGHTS.landUse * 100)}% weight</span>
        </div>
        <div class="text-2xl font-bold">${scores.landManagement}/5</div>
      </div>
    </div>
    
    <!-- Enhanced Recommendations -->
    <div class="mt-6">
      <h4 class="text-xl font-bold mb-4">📋 Smart Restoration Plan</h4>
      <div class="space-y-4">
        ${recommendations.map(rec => `
          <div class="recommendation p-4 rounded-xl border-l-4 ${
            rec.priority === 'high' ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
            rec.priority === 'medium' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' :
            'border-green-400 bg-green-50 dark:bg-green-900/20'
          }">
            <div class="flex items-start">
              <i class="${rec.icon} mt-1 mr-3 ${
                rec.priority === 'high' ? 'text-red-500' :
                rec.priority === 'medium' ? 'text-yellow-500' :
                'text-green-500'
              }"></i>
              <div class="flex-1">
                <h5 class="font-semibold">${rec.title}</h5>
                <p class="text-sm text-forest-600 dark:text-forest-300 mt-1">${rec.description}</p>
                
                ${rec.species && rec.species.length > 0 ? `
                  <div class="mt-3">
                    <h6 class="font-medium text-sm mb-2">Recommended Species:</h6>
                    <div class="flex flex-wrap gap-2">
                      ${rec.species.map(species => `
                        <span class="px-2 py-1 bg-white dark:bg-forest-800 rounded text-xs border chip transition-all hover:scale-105 cursor-pointer"
                              onclick="showWikiModal(${JSON.stringify(species).replace(/"/g, '&quot;')})">
                          ${species['Common Name'] || species['Species Name']}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function debugStep2() {
  console.log('=== STEP 2 DEBUG ===');
  
  // Check if step 2 elements exist
  const step2 = document.querySelector('.wizard-step[data-step="2"]');
  console.log('Step 2 element:', step2);
  
  const radarCanvas = document.getElementById('soilHealthRadar');
  console.log('Radar canvas:', radarCanvas);
  console.log('Canvas dimensions:', radarCanvas?.width, 'x', radarCanvas?.height);
  
  // Test radio button functionality
  const assessmentOptions = document.querySelectorAll('.assessment-option');
  console.log('Assessment options found:', assessmentOptions.length);
  
  // Manually try to show step 2
  if (step2) {
    document.querySelectorAll('.wizard-step').forEach(step => {
      step.classList.remove('active');
      step.classList.add('hidden');
    });
    step2.classList.remove('hidden');
    step2.classList.add('active');
    
    setTimeout(() => {
      updateRadarChart();
    }, 100);
  }
}

// Make it available globally
window.debugStep2 = debugStep2;

function saveSoilHealthAssessment() {
  const scores = calculateCurrentScores();
  const overallScore = (
    scores.soilQuality * SOIL_HEALTH_WEIGHTS.soilStructure +
    scores.erosionControl * SOIL_HEALTH_WEIGHTS.erosion +
    scores.vegetationCover * SOIL_HEALTH_WEIGHTS.vegetation +
    scores.landManagement * SOIL_HEALTH_WEIGHTS.landUse
  );
  
  const assessment = {
    id: 'assessment_' + Date.now(),
    timestamp: new Date().toISOString(),
    location: userLocation,
    scores: scores,
    overallScore: overallScore,
    recommendations: generateEnhancedRecommendations(scores, overallScore)
  };
  
  soilHealthHistory.push(assessment);
  localStorage.setItem('forestwise-soil-history', JSON.stringify(soilHealthHistory));
  
  // Update history display
  updateSoilHealthHistory();
}

function loadSoilHealthHistory() {
  const saved = localStorage.getItem('forestwise-soil-history');
  if (saved) {
    soilHealthHistory = JSON.parse(saved);
    updateSoilHealthHistory();
  }
}

function updateSoilHealthHistory() {
  const historySection = document.getElementById('soilHistorySection');
  const historyList = document.getElementById('soilHistoryList');
  
  if (!historySection || !historyList) return;
  
  if (soilHealthHistory.length === 0) {
    historySection.classList.add('hidden');
    return;
  }
  
  historySection.classList.remove('hidden');
  
  // Display latest assessments
  historyList.innerHTML = soilHealthHistory
    .slice(-5) // Show last 5 assessments
    .reverse() // Most recent first
    .map(assessment => `
      <div class="timeline-item">
        <div class="flex justify-between items-start">
          <div>
            <h5 class="font-semibold">Assessment Score: ${assessment.overallScore.toFixed(1)}/5.0</h5>
            <p class="text-sm text-forest-600 dark:text-forest-300">
              ${new Date(assessment.timestamp).toLocaleDateString()} • 
              Soil: ${assessment.scores.soilQuality}/5 • 
              Erosion: ${assessment.scores.erosionControl}/5
            </p>
          </div>
          <button onclick="viewAssessment('${assessment.id}')" class="text-gold-500 hover:text-gold-600 text-sm">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    `).join('');
  
  // Update chart if we have multiple assessments
  if (soilHealthHistory.length > 1) {
    updateSoilHealthChart();
  }
}

function updateSoilHealthChart() {
  const ctx = document.getElementById('soilHistoryChart')?.getContext('2d');
  if (!ctx) return;
  
  const labels = soilHealthHistory
    .slice(-6) // Last 6 assessments
    .map(assessment => new Date(assessment.timestamp).toLocaleDateString());
  
  const scores = soilHealthHistory
    .slice(-6)
    .map(assessment => assessment.overallScore);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Soil Health Score',
        data: scores,
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 5,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

function viewAssessment(assessmentId) {
  const assessment = soilHealthHistory.find(a => a.id === assessmentId);
  if (assessment) {
    // Could show a detailed modal with the assessment
    showNotification(`Viewing assessment from ${new Date(assessment.timestamp).toLocaleDateString()}`, 'info');
  }
}

function refreshApiData() {
  if (userLocation) {
    detectSoilAndClimateData();
  } else {
    showNotification('Please detect your location first', 'warning');
  }
}

function restartAssessment() {
  // Reset all inputs
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.checked = false;
  });
  
  document.querySelectorAll('.assessment-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // Hide auto-detected data
  document.getElementById('autoDetectedData')?.classList.add('hidden');
  
  // Reset API status
  document.getElementById('apiStatus')?.classList.add('hidden');
  
  // Go back to first step
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.classList.remove('active');
    step.classList.add('hidden');
  });
  
  const firstStep = document.querySelector('.wizard-step[data-step="1"]');
  firstStep.classList.remove('hidden');
  firstStep.classList.add('active');
  firstStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== ENHANCED MAPPING SYSTEM =====
let projectMap = null;
let userProjects = [];
let selectedLocation = null;
let tempMarker = null;

function initMappingSystem() {
  console.log('🗺️ Initializing enhanced mapping system...');
  
  // Initialize map centered on Nigeria
  projectMap = L.map('projectMap').setView([9.0820, 8.6753], 6);
  
  // Add base layers
  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(projectMap);
  
  const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google'
  });
  
  // Layer control
  const baseLayers = {
    "Street Map": osmLayer,
    "Satellite": satelliteLayer
  };
  
  L.control.layers(baseLayers).addTo(projectMap);
  
  // Load existing projects
  loadProjects();
  
  // Setup enhanced event listeners
  setupEnhancedMapEvents();
}

function setupEnhancedMapEvents() {
  // Click on map to select location
  projectMap.on('click', function(e) {
    selectLocation(e.latlng);
  });
  
  // Add project button
  document.getElementById('addProjectBtn').addEventListener('click', addNewProject);
  
  // Project type selection
  document.querySelectorAll('.project-type-option').forEach(option => {
    option.addEventListener('click', function() {
      document.querySelectorAll('.project-type-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      this.classList.add('selected');
    });
  });
  
  // Project filters
  document.querySelectorAll('.project-filter').forEach(filter => {
    filter.addEventListener('change', filterProjectsOnMap);
  });
  
  // Satellite view toggle
  document.getElementById('toggleSatellite').addEventListener('click', toggleSatelliteView);
  
  // Clear all projects
  document.getElementById('clearAllProjects').addEventListener('click', clearAllProjects);
}

function selectLocation(latlng) {
  selectedLocation = latlng;
  
  // Remove previous temp marker
  if (tempMarker) {
    projectMap.removeLayer(tempMarker);
  }
  
  // Add new temp marker
  tempMarker = L.marker(latlng, {
    icon: L.divIcon({
      className: 'temp-marker',
      html: '🎯',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    })
  }).addTo(projectMap);
  
  // Update location display
  document.getElementById('selectedLocation').innerHTML = `
    <div class="flex items-center text-green-600">
      <i class="fas fa-check-circle mr-2"></i>
      Location selected: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}
    </div>
  `;
}

function addNewProject() {
  const name = document.getElementById('projectName').value.trim();
  const description = document.getElementById('projectDescription').value.trim();
  const typeElement = document.querySelector('.project-type-option.selected');
  
  if (!name) {
    showNotification('Please enter a project name', 'error');
    return;
  }
  
  if (!typeElement) {
    showNotification('Please select a project type', 'error');
    return;
  }
  
  if (!selectedLocation) {
    showNotification('Please click on the map to select a location', 'error');
    return;
  }
  
  const projectType = typeElement.dataset.type;
  
  const project = {
    id: 'project_' + Date.now(),
    name: name,
    description: description,
    type: projectType,
    location: selectedLocation,
    created: new Date().toISOString(),
    species: [],
    photos: [],
    progress: {
      treesPlanted: 0,
      survivalRate: 0,
      lastUpdated: new Date().toISOString()
    }
  };
  
  userProjects.push(project);
  saveProjects();
  addProjectToMap(project);
  updateProjectsList();
  
  // Reset form
  document.getElementById('projectName').value = '';
  document.getElementById('projectDescription').value = '';
  document.getElementById('selectedLocation').innerHTML = 'Click on the map to select location...';
  document.querySelectorAll('.project-type-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  // Remove temp marker
  if (tempMarker) {
    projectMap.removeLayer(tempMarker);
    tempMarker = null;
  }
  
  selectedLocation = null;
  showNotification(`"${name}" ${PROJECT_TYPES[projectType].name} project created!`, 'success');
}

function addProjectToMap(project) {
  const projectType = PROJECT_TYPES[project.type];
  
  const marker = L.marker(project.location, {
    icon: L.divIcon({
      className: 'project-marker',
      html: projectType.icon,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    })
  }).addTo(projectMap);
  
  marker.bindPopup(`
    <div class="p-3 min-w-64">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-bold text-lg">${project.name}</h3>
        <span class="text-2xl">${projectType.icon}</span>
      </div>
      <p class="text-sm text-gray-600 mb-2">${project.description || 'No description'}</p>
      <div class="text-xs text-gray-500 space-y-1">
        <div class="flex justify-between">
          <span>Type:</span>
          <span class="font-medium">${projectType.name}</span>
        </div>
        <div class="flex justify-between">
          <span>Created:</span>
          <span>${new Date(project.created).toLocaleDateString()}</span>
        </div>
        ${project.progress.treesPlanted > 0 ? `
          <div class="flex justify-between">
            <span>Trees Planted:</span>
            <span class="font-medium">${project.progress.treesPlanted}</span>
          </div>
          <div class="flex justify-between">
            <span>Survival Rate:</span>
            <span class="font-medium">${project.progress.survivalRate}%</span>
          </div>
        ` : ''}
      </div>
      <div class="flex space-x-2 mt-3">
        <button onclick="viewProjectDetails('${project.id}')" 
                class="flex-1 bg-forest-600 hover:bg-forest-700 text-white px-3 py-1 rounded text-sm transition text-center">
          <i class="fas fa-info-circle mr-1"></i>Details
        </button>
        <button onclick="editProject('${project.id}')" 
                class="flex-1 bg-gold-500 hover:bg-gold-600 text-white px-3 py-1 rounded text-sm transition text-center">
          <i class="fas fa-edit mr-1"></i>Edit
        </button>
        <button onclick="deleteProject('${project.id}')" 
                class="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition text-center">
          <i class="fas fa-trash mr-1"></i>Delete
        </button>
      </div>
    </div>
  `);
  
  // Store marker reference in project
  project.marker = marker;
}

function updateProjectsList() {
  const list = document.getElementById('projectsList');
  if (!list) return;
  
  if (userProjects.length === 0) {
    list.innerHTML = `
      <div class="text-center py-8 text-forest-600 dark:text-forest-300">
        <i class="fas fa-map-marked-alt text-4xl mb-3 opacity-50"></i>
        <p>No projects yet</p>
        <p class="text-sm">Create your first project to see it here!</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = userProjects.map(project => {
    const projectType = PROJECT_TYPES[project.type];
    
    return `
      <div class="project-card project-category-${project.type} bg-white dark:bg-forest-800 rounded-xl p-4 border-l-4 transition-all hover:shadow-lg">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center mb-2">
              <span class="text-2xl mr-2">${projectType.icon}</span>
              <h5 class="font-bold text-forest-800 dark:text-forest-100">${project.name}</h5>
            </div>
            <p class="text-sm text-forest-600 dark:text-forest-300 mb-2">${project.description || 'No description'}</p>
            <div class="flex items-center text-xs text-forest-500 dark:text-forest-400 space-x-4">
              <span class="flex items-center">
                <i class="fas fa-map-marker-alt mr-1"></i>
                ${project.location.lat.toFixed(4)}, ${project.location.lng.toFixed(4)}
              </span>
              <span class="flex items-center">
                <i class="fas fa-calendar mr-1"></i>
                ${new Date(project.created).toLocaleDateString()}
              </span>
              ${project.progress.treesPlanted > 0 ? `
                <span class="flex items-center">
                  <i class="fas fa-tree mr-1"></i>
                  ${project.progress.treesPlanted} trees
                </span>
              ` : ''}
            </div>
          </div>
          <div class="flex space-x-1 ml-2">
            <button onclick="viewProjectDetails('${project.id}')" class="text-forest-500 hover:text-forest-700 transition p-1">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="editProject('${project.id}')" class="text-gold-500 hover:text-gold-600 transition p-1">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteProject('${project.id}')" class="text-red-500 hover:text-red-700 transition p-1">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function viewProjectDetails(projectId) {
  const project = userProjects.find(p => p.id === projectId);
  if (project) {
    // Center map on project
    projectMap.setView(project.location, 12);
    // Open popup
    if (project.marker) {
      project.marker.openPopup();
    }
    showNotification(`Viewing project: ${project.name}`, 'info');
  }
}

function editProject(projectId) {
  const project = userProjects.find(p => p.id === projectId);
  if (project) {
    // Populate form with project data
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description;
    
    // Select project type
    document.querySelectorAll('.project-type-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.type === project.type);
    });
    
    // Set location
    selectedLocation = project.location;
    selectLocation(project.location);
    
    // Remove the old project
    deleteProject(projectId, false);
    
    showNotification(`Editing project: ${project.name}`, 'info');
  }
}

function deleteProject(projectId, showNotification = true) {
  const projectIndex = userProjects.findIndex(p => p.id === projectId);
  if (projectIndex > -1) {
    const project = userProjects[projectIndex];
    
    // Remove marker from map
    if (project.marker) {
      projectMap.removeLayer(project.marker);
    }
    
    // Remove from array
    userProjects.splice(projectIndex, 1);
    
    // Save and update
    saveProjects();
    updateProjectsList();
    
    if (showNotification) {
      showNotification(`Project "${project.name}" deleted`, 'info');
    }
  }
}

function clearAllProjects() {
  if (userProjects.length === 0) {
    showNotification('No projects to clear', 'info');
    return;
  }
  
  if (confirm('Are you sure you want to delete all projects? This action cannot be undone.')) {
    // Remove all markers from map
    userProjects.forEach(project => {
      if (project.marker) {
        projectMap.removeLayer(project.marker);
      }
    });
    
    // Clear array
    userProjects = [];
    
    // Save and update
    saveProjects();
    updateProjectsList();
    
    showNotification('All projects cleared', 'info');
  }
}

function filterProjectsOnMap() {
  const activeFilters = Array.from(document.querySelectorAll('.project-filter:checked'))
    .map(checkbox => checkbox.value);
  
  userProjects.forEach(project => {
    if (project.marker) {
      if (activeFilters.includes(project.type)) {
        projectMap.addLayer(project.marker);
      } else {
        projectMap.removeLayer(project.marker);
      }
    }
  });
}

function toggleSatelliteView() {
  const button = document.getElementById('toggleSatellite');
  const isSatellite = button.textContent.includes('Satellite');
  
  if (isSatellite) {
    // Switch to street view
    projectMap.eachLayer(layer => {
      if (layer instanceof L.TileLayer && layer._url.includes('google.com')) {
        projectMap.removeLayer(layer);
      }
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(projectMap);
    
    button.innerHTML = '<i class="fas fa-map mr-2"></i>Street View';
  } else {
    // Switch to satellite view
    projectMap.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        projectMap.removeLayer(layer);
      }
    });
    
    L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google'
    }).addTo(projectMap);
    
    button.innerHTML = '<i class="fas fa-satellite mr-2"></i>Satellite View';
  }
}

function loadProjects() {
  const saved = localStorage.getItem('forestwise-projects');
  if (saved) {
    userProjects = JSON.parse(saved);
    userProjects.forEach(project => addProjectToMap(project));
    updateProjectsList();
    console.log(`📁 Loaded ${userProjects.length} projects`);
  }
}

function saveProjects() {
  localStorage.setItem('forestwise-projects', JSON.stringify(userProjects));
}

// ===== ENHANCED PLANTING GUIDE SYSTEM =====
function loadPlantingGuide(species) {
  const guideContainer = document.getElementById('plantingGuideContent');
  if (!guideContainer) return;
  
  // Generate comprehensive planting guide from species data
  const plantingGuide = generateComprehensivePlantingGuide(species);
  
  window.currentSpeciesPlantingGuide = plantingGuide;
  
  guideContainer.innerHTML = `
    <div class="mb-6 p-6 bg-gradient-to-r from-green-50 to-gold-50 dark:from-forest-800 dark:to-forest-700 rounded-2xl border border-gold-200 dark:border-gold-600">
      <h3 class="text-2xl font-bold text-forest-800 dark:text-forest-100 mb-3 flex items-center">
        <i class="fas fa-scroll mr-3 text-gold-400"></i>
        Comprehensive Planting Guide for ${species['Common Name'] || species['Species Name']}
      </h3>
      <p class="text-forest-600 dark:text-forest-300">
        Scientific name: <em>${species['Species Name']}</em>
      </p>
    </div>
    
    <div class="planting-grid">
      <!-- Best Season -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
          <i class="fas fa-calendar-alt text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-leaf mr-2 text-green-500"></i>
            Best Planting Season
          </h4>
          <p class="text-sm">${plantingGuide.bestSeason}</p>
        </div>
      </div>
      
      <!-- Planting Depth & Spacing -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <i class="fas fa-ruler-combined text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-arrows-alt-h mr-2 text-blue-500"></i>
            Planting Specifications
          </h4>
          <p class="text-sm"><strong>Depth:</strong> ${plantingGuide.plantingDepth}</p>
          <p class="text-sm"><strong>Spacing:</strong> ${plantingGuide.spacing}</p>
        </div>
      </div>
      
      <!-- Watering Schedule -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <i class="fas fa-tint text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-water mr-2 text-blue-400"></i>
            Watering Schedule
          </h4>
          <p class="text-sm">${plantingGuide.wateringSchedule}</p>
        </div>
      </div>
      
      <!-- Sunlight Requirements -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
          <i class="fas fa-sun text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-sun mr-2 text-yellow-500"></i>
            Sunlight Requirements
          </h4>
          <p class="text-sm">${plantingGuide.sunlightRequirements}</p>
        </div>
      </div>
      
      <!-- Soil Requirements -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
          <i class="fas fa-mountain text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-seedling mr-2 text-amber-500"></i>
            Soil Requirements
          </h4>
          <p class="text-sm"><strong>Type:</strong> ${plantingGuide.soilType}</p>
          <p class="text-sm"><strong>pH Range:</strong> ${plantingGuide.pHRange}</p>
        </div>
      </div>
      
      <!-- Climate Adaptation -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
          <i class="fas fa-thermometer-half text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-cloud-sun mr-2 text-green-500"></i>
            Climate Adaptation
          </h4>
          <p class="text-sm"><strong>Temperature:</strong> ${plantingGuide.temperatureRange}</p>
          <p class="text-sm"><strong>Rainfall:</strong> ${plantingGuide.rainfallRange}</p>
        </div>
      </div>
      
      <!-- Growth Characteristics -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
          <i class="fas fa-chart-line text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-tree mr-2 text-purple-500"></i>
            Growth Characteristics
          </h4>
          <p class="text-sm"><strong>Growth Rate:</strong> ${plantingGuide.growthRate}</p>
          <p class="text-sm"><strong>Maturity Age:</strong> ${plantingGuide.maturityAge}</p>
          <p class="text-sm"><strong>Max Height:</strong> ${plantingGuide.maxHeight}</p>
        </div>
      </div>
      
      <!-- Maintenance -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
          <i class="fas fa-tools text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-toolbox mr-2 text-red-500"></i>
            Maintenance
          </h4>
          <p class="text-sm"><strong>Pruning:</strong> ${plantingGuide.pruningInstructions}</p>
          <p class="text-sm"><strong>Fertilization:</strong> ${plantingGuide.fertilization}</p>
          <p class="text-sm"><strong>Pest Management:</strong> ${plantingGuide.pestManagement}</p>
        </div>
      </div>
      
      <!-- Ecological Benefits -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          <i class="fas fa-leaf text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-heart mr-2 text-emerald-500"></i>
            Ecological Benefits
          </h4>
          <p class="text-sm">${plantingGuide.ecologicalBenefits}</p>
          <p class="text-sm"><strong>Companion Plants:</strong> ${plantingGuide.companionPlants}</p>
        </div>
      </div>
      
      <!-- Special Instructions -->
      <div class="planting-section flex items-start">
        <div class="planting-icon bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <i class="fas fa-info-circle text-lg"></i>
        </div>
        <div class="planting-info flex-1">
          <h4 class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2 text-indigo-500"></i>
            Special Instructions
          </h4>
          <p class="text-sm">${plantingGuide.specialInstructions}</p>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="mt-8 p-6 bg-forest-50 dark:bg-forest-800 rounded-2xl border border-forest-200 dark:border-forest-600">
      <h4 class="font-semibold mb-4 text-forest-800 dark:text-forest-100 flex items-center">
        <i class="fas fa-bolt mr-2 text-gold-400"></i>Quick Actions
      </h4>
      <div class="flex flex-wrap gap-3">
        <button onclick="addToCalendar('${species['Common Name'] || species['Species Name']}')" 
                class="flex items-center px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition transform hover:scale-105">
          <i class="fas fa-calendar-plus mr-2"></i>Add to Calendar
        </button>
        <button onclick="addToMapFromSpecies('${species['Species Name']}', '${species['Common Name']}')" 
                class="flex items-center px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition transform hover:scale-105">
          <i class="fas fa-map-marker-alt mr-2"></i>Add to Map
        </button>
        <button onclick="showNotification('Print feature would be implemented here', 'info')" 
                class="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition transform hover:scale-105">
          <i class="fas fa-print mr-2"></i>Print Guide
        </button>
        <button onclick="toggleFavorite(currentSpecies)" 
                class="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition transform hover:scale-105">
          <i class="fas fa-heart mr-2"></i>Add to Favorites
        </button>
      </div>
    </div>
  `;
}

function generateComprehensivePlantingGuide(species) {
  // Generate planting guide from species data with intelligent defaults
  const sunlight = species['Sunlight'] || 'Full Sun to Partial Shade';
  const soilType = species['Soil Type'] || 'Well-draining loamy soil';
  const pHMin = species['pH Min'] || '5.5';
  const pHMax = species['pH Max'] || '7.5';
  const tempMin = species['Temp Min (°C)'] || '18';
  const tempMax = species['Temp Max (°C)'] || '35';
  const rainfallMin = species['Rainfall Min (mm)'] || '800';
  const rainfallMax = species['Rainfall Max (mm)'] || '2000';
  
  // Determine growth characteristics based on species data
  const growthRate = determineGrowthRate(species);
  const maturityAge = determineMaturityAge(species);
  const maxHeight = species['Max Height (m)'] || '15-25 meters';
  
  return {
    bestSeason: 'Early rainy season (March-June) for best establishment',
    plantingDepth: '30-45 cm deep, depending on seedling size',
    spacing: calculateOptimalSpacing(species),
    wateringSchedule: 'Weekly for first 3 months, then reduce to bi-weekly. Increase during dry spells.',
    sunlightRequirements: sunlight,
    soilType: soilType,
    pHRange: `${pHMin} - ${pHMax}`,
    temperatureRange: `${tempMin}°C - ${tempMax}°C`,
    rainfallRange: `${rainfallMin}mm - ${rainfallMax}mm annually`,
    growthRate: growthRate,
    maturityAge: maturityAge,
    maxHeight: maxHeight,
    pruningInstructions: 'Light pruning during dormant season to maintain shape and remove dead branches',
    fertilization: 'Organic fertilizer annually during growing season. Compost application recommended.',
    pestManagement: 'Monitor for common pests. Use organic treatments when necessary. Maintain tree health for natural resistance.',
    ecologicalBenefits: generateEcologicalBenefits(species),
    companionPlants: 'Legumes for nitrogen fixation, ground covers for moisture retention',
    specialInstructions: 'Protect young trees from strong winds and grazing animals. Mulch around base to retain moisture.'
  };
}

function determineGrowthRate(species) {
  const goals = (species['Restoration Goal'] || '').toLowerCase();
  
  if (goals.includes('pioneer') || goals.includes('fast')) {
    return 'Fast-growing (pioneer species)';
  } else if (goals.includes('slow')) {
    return 'Slow-growing (climax species)';
  } else {
    return 'Moderate growth rate';
  }
}

function determineMaturityAge(species) {
  const goals = (species['Restoration Goal'] || '').toLowerCase();
  
  if (goals.includes('pioneer') || goals.includes('fast')) {
    return '3-5 years for early maturity';
  } else if (goals.includes('timber')) {
    return '15-25 years for timber production';
  } else {
    return '8-12 years for full maturity';
  }
}

function calculateOptimalSpacing(species) {
  const goals = (species['Restoration Goal'] || '').toLowerCase();
  
  if (goals.includes('agroforestry')) {
    return '5-8 meters between trees for intercropping';
  } else if (goals.includes('timber')) {
    return '3-5 meters for timber production';
  } else if (goals.includes('erosion')) {
    return '2-4 meters for dense erosion control';
  } else {
    return '4-6 meters for general planting';
  }
}

function generateEcologicalBenefits(species) {
  const goals = (species['Restoration Goal'] || '').toLowerCase();
  const benefits = [];
  
  if (goals.includes('biodiversity')) benefits.push('Supports local wildlife and biodiversity');
  if (goals.includes('carbon')) benefits.push('Excellent carbon sequestration capacity');
  if (goals.includes('erosion')) benefits.push('Strong root system for erosion control');
  if (goals.includes('nitrogen') || goals.includes('legume')) benefits.push('Nitrogen-fixing capabilities improve soil fertility');
  if (goals.includes('medicinal')) benefits.push('Traditional medicinal uses');
  if (goals.includes('food')) benefits.push('Provides food/fruit for humans and wildlife');
  
  return benefits.length > 0 ? benefits.join('. ') + '.' : 'Provides general ecological benefits including habitat and soil improvement.';
}

// ===== LOCATION DETECTION =====
function initLocationDetection() {
  const detectBtn = document.getElementById('detectLocationBtn');
  if (detectBtn) {
    detectBtn.addEventListener('click', detectUserLocation);
    console.log('📍 Location detection initialized');
  }
}

async function detectUserLocation() {
  const detectBtn = document.getElementById('detectLocationBtn');
  const locationHeader = document.getElementById('locationHeader');
  
  if (!navigator.geolocation) {
    showNotification('Geolocation is not supported by your browser', 'error');
    return;
  }

  // Show loading state
  if (detectBtn) {
    detectBtn.innerHTML = '<div class="loading-spinner"></div> Detecting...';
    detectBtn.disabled = true;
  }

  showNotification('Detecting your location and environmental data...', 'info');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        userLocation = { latitude, longitude };
        
        // Get location name and environmental data
        const locationData = await getLocationName(latitude, longitude);
        const weatherData = await getWeatherData(latitude, longitude);
        
        // Update UI with location info
        updateLocationUI(locationData, weatherData);
        
        // Auto-fill form fields
        autoFillForm(weatherData);
        
        showNotification(`Location detected: ${locationData.city}, ${locationData.country}. Environmental data loaded.`, 'success');
        
      } catch (error) {
        console.error('Location detection error:', error);
        showNotification('Failed to get complete location data', 'error');
        resetLocationButton();
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      let errorMessage = 'Location access denied';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location permissions.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }
      
      showNotification(errorMessage, 'error');
      resetLocationButton();
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

async function getLocationName(latitude, longitude) {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    
    if (!response.ok) throw new Error('Reverse geocoding failed');
    
    const data = await response.json();
    return {
      city: data.city || data.locality || 'Unknown City',
      country: data.countryName || 'Unknown Country'
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      city: 'Unknown City',
      country: 'Unknown Country'
    };
  }
}

async function getWeatherData(latitude, longitude) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEYS.OPEN_WEATHER}&units=metric`
    );
    
    if (!response.ok) throw new Error('Weather API request failed');
    
    const data = await response.json();
    
    // Calculate annual rainfall (simplified - using monthly averages)
    const rainfall = data.rain ? data.rain['1h'] * 365 * 24 : 800; // Fallback to 800mm if no rain data
    
    return {
      temperature: Math.round(data.main.temp),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      rainfall: Math.round(rainfall),
      description: data.weather[0].description,
      country: data.sys.country
    };
  } catch (error) {
    console.error('Weather API error:', error);
    // Return fallback data based on latitude (tropical vs temperate)
    const isTropical = Math.abs(latitude) < 30;
    
    return {
      temperature: isTropical ? 28 : 15,
      tempMin: isTropical ? 22 : 5,
      tempMax: isTropical ? 35 : 25,
      humidity: isTropical ? 75 : 60,
      rainfall: isTropical ? 1500 : 800,
      description: 'Climate data estimated',
      country: 'Unknown'
    };
  }
}

function updateLocationUI(locationData, weatherData) {
  const locationHeader = document.getElementById('locationHeader');
  const currentLocation = document.getElementById('currentLocation');
  const detectBtn = document.getElementById('detectLocationBtn');
  
  if (locationHeader && currentLocation) {
    currentLocation.textContent = `${locationData.city}, ${locationData.country}`;
    locationHeader.classList.remove('hidden');
  }
  
  // Update button to show success state
  if (detectBtn) {
    detectBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Location Detected';
    detectBtn.classList.remove('from-gold-400', 'to-gold-500', 'hover:from-gold-500', 'hover:to-gold-600');
    detectBtn.classList.add('from-green-500', 'to-green-600', 'hover:from-green-600', 'hover:to-green-700');
    detectBtn.disabled = false;
  }
}

function autoFillForm(weatherData) {
  // Fill temperature fields
  const tempMin = document.getElementById('tempMin');
  const tempMax = document.getElementById('tempMax');
  const rainfall = document.getElementById('rainfall');
  const humidity = document.getElementById('humidity');
  
  if (tempMin) {
    tempMin.value = weatherData.tempMin;
    highlightField('tempMinField', `Based on local climate: ${weatherData.tempMin}°C`);
  }
  
  if (tempMax) {
    tempMax.value = weatherData.tempMax;
    highlightField('tempMaxField', `Based on local climate: ${weatherData.tempMax}°C`);
  }
  
  if (rainfall) {
    rainfall.value = weatherData.rainfall;
    highlightField('rainfallField', `Estimated annual rainfall: ${weatherData.rainfall}mm`);
  }
  
  if (humidity) {
    // Convert humidity percentage to category
    const humidityCategory = getHumidityCategory(weatherData.humidity);
    humidity.value = humidityCategory;
    highlightField('humidityField', `Based on local humidity: ${weatherData.humidity}%`);
  }
}

function getHumidityCategory(humidity) {
  if (humidity < 30) return 'Low';
  if (humidity < 60) return 'Medium';
  if (humidity < 80) return 'High';
  return 'Very High';
}

function highlightField(fieldId, message) {
  const field = document.getElementById(fieldId);
  const status = document.getElementById(fieldId.replace('Field', 'Status'));
  
  if (field && status) {
    field.classList.add('location-detected');
    status.textContent = message;
    status.classList.remove('hidden');
    
    // Add loading animation temporarily
    field.classList.add('location-loading');
    setTimeout(() => {
      field.classList.remove('location-loading');
    }, 1500);
  }
}

function resetLocationButton() {
  const detectBtn = document.getElementById('detectLocationBtn');
  if (detectBtn) {
    detectBtn.innerHTML = '<i class="fas fa-location-arrow mr-2"></i> Detect My Location';
    detectBtn.classList.remove('from-green-500', 'to-green-600', 'hover:from-green-600', 'hover:to-green-700');
    detectBtn.classList.add('from-gold-400', 'to-gold-500', 'hover:from-gold-500', 'hover:to-gold-600');
    detectBtn.disabled = false;
  }
}

// ===== FAVORITES SYSTEM =====
function initFavoritesSystem() {
  console.log('⭐ Initializing favorites system...');
  updateFavoritesBadge();
}

function getFavorites() {
  const favorites = localStorage.getItem('forestwise-favorites');
  return favorites ? JSON.parse(favorites) : [];
}

function saveFavorites(favorites) {
  localStorage.setItem('forestwise-favorites', JSON.stringify(favorites));
}

function toggleFavorite(species) {
  const favorites = getFavorites();
  const speciesId = species['Species Name'] + '|' + species['Common Name'];
  
  const existingIndex = favorites.findIndex(fav => 
    fav['Species Name'] === species['Species Name'] && 
    fav['Common Name'] === species['Common Name']
  );
  
  if (existingIndex > -1) {
    favorites.splice(existingIndex, 1);
    showNotification('Removed from favorites', 'info');
  } else {
    favorites.push(species);
    showNotification('Added to favorites!', 'success');
  }
  
  saveFavorites(favorites);
  updateFavoritesBadge();
  return existingIndex === -1; // Returns true if added, false if removed
}

function updateFavoritesBadge() {
  const favorites = getFavorites();
  const badge = document.getElementById('favoritesBadge');
  if (badge) {
    badge.textContent = favorites.length;
    badge.style.display = favorites.length > 0 ? 'flex' : 'none';
  }
}

function showFavoritesModal() {
  const favorites = getFavorites();
  const modal = document.getElementById('favoritesModal');
  const content = document.getElementById('favoritesContent');
  
  if (!modal || !content) return;
  
  if (favorites.length === 0) {
    content.innerHTML = `
      <div class="text-center p-8">
        <i class="fas fa-heart text-6xl text-gray-300 mb-4"></i>
        <p class="text-xl text-gray-600 dark:text-gray-300">No favorites yet</p>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Start adding species to your favorites!</p>
      </div>
    `;
  } else {
    content.innerHTML = favorites.map((species, index) => `
      <div class="bg-white dark:bg-forest-800 rounded-xl p-4 mb-3 flex justify-between items-center">
        <div>
          <h4 class="font-bold text-forest-800 dark:text-forest-100">${species['Species Name']}</h4>
          <p class="text-gold-400">${species['Common Name'] || ''}</p>
        </div>
        <button onclick="removeFavorite(${index})" class="text-red-400 hover:text-red-600 p-2">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  }
  
  modal.classList.add('show');
}

function removeFavorite(index) {
  const favorites = getFavorites();
  favorites.splice(index, 1);
  saveFavorites(favorites);
  showFavoritesModal();
  updateFavoritesBadge();
}

function isFavorited(species) {
  const favorites = getFavorites();
  return favorites.some(fav => 
    fav['Species Name'] === species['Species Name'] && 
    fav['Common Name'] === species['Common Name']
  );
}

function toggleFavoriteCard(starElement, species) {
  const wasAdded = toggleFavorite(species);
  starElement.classList.toggle('favorited', wasAdded);
  starElement.querySelector('i').classList.toggle('text-red-500', wasAdded);
  starElement.querySelector('i').classList.toggle('text-gray-400', !wasAdded);
}

// ===== PDF EXPORT =====
function exportToPDF() {
  const recommendations = document.querySelectorAll('#resultsContainer .glass');
  if (recommendations.length === 0) {
    showNotification('No recommendations to export', 'warning');
    return;
  }

  showLoading('Generating PDF report...');
  
  // Use html2canvas to capture the results section
  html2canvas(document.getElementById('resultsSection')).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const pageHeight = 280;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const formData = getFormValues();
    const fileName = `ForestWise_Recommendations_${new Date().toISOString().split('T')[0]}.pdf`;
    
    pdf.save(fileName);
    hideLoading();
    showNotification('PDF exported successfully!', 'success');
  }).catch(error => {
    console.error('PDF export error:', error);
    hideLoading();
    showNotification('Failed to export PDF', 'error');
  });
}

// ===== SHARE RESULTS =====
function generateShareableURL() {
  const formData = getFormValues();
  const compressedData = btoa(JSON.stringify(formData));
  const baseURL = window.location.origin + window.location.pathname;
  return `${baseURL}?data=${compressedData}`;
}

function copyShareableURL() {
  const url = generateShareableURL();
  navigator.clipboard.writeText(url).then(() => {
    showNotification('Shareable URL copied to clipboard!', 'success');
  }).catch(() => {
    // Fallback for older browsers
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showNotification('Shareable URL copied to clipboard!', 'success');
  });
}

function loadFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  
  if (dataParam) {
    try {
      const formData = JSON.parse(atob(dataParam));
      populateFormFromData(formData);
      showNotification('Loaded shared recommendations!', 'success');
      
      // Auto-scroll to results after a delay
      setTimeout(() => {
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
      }, 1000);
    } catch (error) {
      console.error('Error loading shared data:', error);
      showNotification('Invalid shared data', 'error');
    }
  }
}

function populateFormFromData(formData) {
  // Populate soil type
  const soilType = document.getElementById('soilType');
  if (soilType && formData.soil) soilType.value = formData.soil;
  
  // Populate pH sliders
  const pHMin = document.getElementById('pHMin');
  const pHMax = document.getElementById('pHMax');
  if (pHMin && formData.pHMin) pHMin.value = formData.pHMin;
  if (pHMax && formData.pHMax) pHMax.value = formData.pHMax;
  
  // Update pH labels
  const pHMinLabel = document.getElementById('pHMinLabel');
  const pHMaxLabel = document.getElementById('pHMaxLabel');
  if (pHMinLabel && formData.pHMin) pHMinLabel.textContent = formData.pHMin;
  if (pHMaxLabel && formData.pHMax) pHMaxLabel.textContent = formData.pHMax;
  
  // Populate other fields
  const rainfall = document.getElementById('rainfall');
  const tempMin = document.getElementById('tempMin');
  const tempMax = document.getElementById('tempMax');
  const humidity = document.getElementById('humidity');
  const sunlight = document.getElementById('sunlight');
  
  if (rainfall && formData.rainfall) rainfall.value = formData.rainfall;
  if (tempMin && formData.tempMin) tempMin.value = formData.tempMin;
  if (tempMax && formData.tempMax) tempMax.value = formData.tempMax;
  if (humidity && formData.humidity) humidity.value = formData.humidity;
  if (sunlight && formData.sunlight) sunlight.value = formData.sunlight;
  
  // Populate goal chips
  const goalChips = document.querySelectorAll('#goalChips .chip');
  goalChips.forEach(chip => {
    const goal = chip.dataset.goal;
    if (formData.goals && formData.goals.includes(goal)) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
  
  // Trigger recommendation if all required fields are filled
  if (formData.rainfall && formData.tempMin && formData.tempMax) {
    setTimeout(() => {
      handleRecommendation();
    }, 500);
  }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notif => notif.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-xl text-white font-semibold transform translate-x-full transition-transform duration-300 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  }`;
  
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-${
        type === 'success' ? 'check-circle' :
        type === 'error' ? 'exclamation-circle' :
        type === 'warning' ? 'exclamation-triangle' :
        'info-circle'
      } mr-3"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// ===== NEW FEATURES INITIALIZATION =====
function initNewFeatures() {
  // Favorites button
  document.getElementById('favoritesBtn')?.addEventListener('click', showFavoritesModal);
  document.getElementById('closeFavoritesModal')?.addEventListener('click', () => {
    document.getElementById('favoritesModal')?.classList.remove('show');
  });

  // Share button
  document.getElementById('shareBtn')?.addEventListener('click', copyShareableURL);

  // Export PDF button
  document.getElementById('exportPdfBtn')?.addEventListener('click', exportToPDF);
}

// ===== UTILITY FUNCTIONS =====
function showLoading(message = 'Loading species data…') {
  const loadingMsg = document.getElementById('loadingMsg');
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingMsg) loadingMsg.textContent = message;
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

// ===== RESET FUNCTIONALITY =====
function initResetButton() {
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetForm);
    console.log('✅ Reset button initialized');
  }
}

function resetForm() {
  console.log('🔄 Resetting form...');
  
  // Reset location
  userLocation = null;
  const locationHeader = document.getElementById('locationHeader');
  if (locationHeader) {
    locationHeader.classList.add('hidden');
  }
  
  resetLocationButton();
  
  // Remove location highlights from fields
  document.querySelectorAll('.location-detected').forEach(el => {
    el.classList.remove('location-detected');
  });
  
  document.querySelectorAll('[id$="Status"]').forEach(el => {
    el.classList.add('hidden');
  });
  
  // Reset form fields
  const soilType = document.getElementById('soilType');
  if (soilType) soilType.value = '';
  
  const pHMin = document.getElementById('pHMin');
  const pHMax = document.getElementById('pHMax');
  const pHMinLabel = document.getElementById('pHMinLabel');
  const pHMaxLabel = document.getElementById('pHMaxLabel');
  
  if (pHMin && pHMax) {
    pHMin.value = 5.5;
    pHMax.value = 7.0;
    if (pHMinLabel) pHMinLabel.textContent = '5.5';
    if (pHMaxLabel) pHMaxLabel.textContent = '7.0';
  }
  
  const rainfall = document.getElementById('rainfall');
  if (rainfall) rainfall.value = '';
  
  const tempMin = document.getElementById('tempMin');
  const tempMax = document.getElementById('tempMax');
  if (tempMin) tempMin.value = '';
  if (tempMax) tempMax.value = '';
  
  const humidity = document.getElementById('humidity');
  if (humidity) humidity.value = '';
  
  const sunlight = document.getElementById('sunlight');
  if (sunlight) sunlight.value = '';
  
  const goalChips = document.querySelectorAll('#goalChips .chip.active');
  goalChips.forEach(chip => {
    chip.classList.remove('active');
  });
  
  const resultsSection = document.getElementById('resultsSection');
  if (resultsSection) {
    resultsSection.style.display = 'none';
  }
  
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.style.width = '0%';
  }
  
  const recommendBtn = document.getElementById('recommendBtn');
  if (recommendBtn) {
    recommendBtn.innerHTML = '<i class="fas fa-tree mr-3"></i> Recommend Trees 🌱';
    recommendBtn.disabled = false;
    recommendBtn.classList.remove('loading-pulse');
  }
  
  document.getElementById('tool').scrollIntoView({ 
    behavior: 'smooth',
    block: 'start'
  });
  
  showResetConfirmation();
}

function showResetConfirmation() {
  // Create a temporary confirmation message
  const confirmation = document.createElement('div');
  confirmation.className = 'reset-confirmation';
  confirmation.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Form reset successfully!';
  
  document.body.appendChild(confirmation);
  
  // Remove after 3 seconds
  setTimeout(() => {
    confirmation.style.opacity = '0';
    confirmation.style.transform = 'translateY(-20px) translateX(-50%)';
    confirmation.style.transition = 'all 0.5s ease-out';
    
    setTimeout(() => {
      if (confirmation.parentNode) {
        confirmation.parentNode.removeChild(confirmation);
      }
    }, 500);
  }, 2000);
}

// ===== PARTICLES =====
function createParticles() {
  const container = document.getElementById('particlesContainer');
  if (!container) {
    console.error('Particles container not found');
    return;
  }

  container.innerHTML = '';
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    
    const size = 2 + Math.random() * 4;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    const delay = Math.random() * 10;
    const duration = 10 + Math.random() * 20;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    
    const opacity = 0.3 + Math.random() * 0.4;
    particle.style.backgroundColor = `rgba(212, 175, 55, ${opacity})`;
    
    container.appendChild(particle);
  }
  console.log('✨ Created particles');
}

// ===== THEME =====
function initTheme() {
  const toggleButton = document.getElementById('darkModeToggle');
  if (!toggleButton) return;

  const userPref = localStorage.getItem('forestwise-theme');
  const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = userPref === 'dark' || (userPref !== 'light' && systemPref);
  
  if (isDark) {
    document.documentElement.classList.add('dark');
  }

  updateToggleButtonIcon();

  toggleButton.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isNowDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('forestwise-theme', isNowDark ? 'dark' : 'light');
    updateToggleButtonIcon();
  });
}

function updateToggleButtonIcon() {
  const button = document.getElementById('darkModeToggle');
  if (!button) return;
  const isDark = document.documentElement.classList.contains('dark');
  const icon = button.querySelector('i');
  if (icon) {
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// ===== SLIDESHOW =====
function initSlideshow() {
  const slides = document.querySelectorAll('.slideshow-slide');
  const prevBtn = document.querySelector('.slideshow-prev');
  const nextBtn = document.querySelector('.slideshow-next');
  const dotsContainer = document.querySelector('.slideshow-dots');
  
  let currentSlide = 0;
  let autoPlayInterval;

  // Create dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.className = `slideshow-dot ${index === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });
  }

  const dots = document.querySelectorAll('.slideshow-dot');

  function goToSlide(n) {
    slides[currentSlide]?.classList.remove('active');
    dots[currentSlide]?.classList.remove('active');

    currentSlide = (n + slides.length) % slides.length;

    slides[currentSlide]?.classList.add('active');
    dots[currentSlide]?.classList.add('active');
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  // Event listeners
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  // Auto-play
  function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 5000);
  }
  
  startAutoPlay();
  console.log('🖼️ Slideshow initialized');
}

// ===== FORM =====
function initForm(data) {
  speciesData = data;
  console.log('📝 Initializing form with', data.length, 'species');
  
  populateSoilDropdown();
  setupPHSliders();
  setupGoalChips();
}

function populateSoilDropdown() {
  const select = document.getElementById('soilType');
  if (!select || !speciesData) return;

  const soils = [...new Set(
    speciesData
      .map(s => s['Soil Type'])
      .filter(Boolean)
  )].sort();

  select.innerHTML = '<option value="">-- Select Soil Type --</option>';
  soils.forEach(soil => {
    const option = document.createElement('option');
    option.value = soil;
    option.textContent = soil;
    select.appendChild(option);
  });
}

function setupPHSliders() {
  const pHMinSlider = document.getElementById('pHMin');
  const pHMaxSlider = document.getElementById('pHMax');
  const pHMinLabel = document.getElementById('pHMinLabel');
  const pHMaxLabel = document.getElementById('pHMaxLabel');

  if (!pHMinSlider || !pHMaxSlider) return;

  const updateLabels = () => {
    const min = parseFloat(pHMinSlider.value).toFixed(1);
    const max = parseFloat(pHMaxSlider.value).toFixed(1);
    if (pHMinLabel) pHMinLabel.textContent = min;
    if (pHMaxLabel) pHMaxLabel.textContent = max;
  };

  pHMinSlider.addEventListener('input', updateLabels);
  pHMaxSlider.addEventListener('input', updateLabels);
  updateLabels();
}

function setupGoalChips() {
  const chips = document.querySelectorAll('#goalChips .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
    });
  });
}

function getFormValues() {
  const soil = document.getElementById('soilType')?.value || '';
  const pHMin = parseFloat(document.getElementById('pHMin')?.value) || 5.5;
  const pHMax = parseFloat(document.getElementById('pHMax')?.value) || 7.0;
  const rainfall = parseInt(document.getElementById('rainfall')?.value) || NaN;
  const tempMin = parseInt(document.getElementById('tempMin')?.value) || NaN;
  const tempMax = parseInt(document.getElementById('tempMax')?.value) || NaN;
  const humidity = document.getElementById('humidity')?.value || '';
  const sunlight = document.getElementById('sunlight')?.value || '';
  const goals = Array.from(document.querySelectorAll('#goalChips .chip.active'))
    .map(chip => chip.dataset.goal);

  return {
    soil,
    pHMin,
    pHMax,
    rainfall,
    tempMin,
    tempMax,
    humidity,
    sunlight,
    goals
  };
}

function isFormValid() {
  const { rainfall, tempMin, tempMax } = getFormValues();
  return !isNaN(rainfall) && !isNaN(tempMin) && !isNaN(tempMax);
}

// ===== RECOMMENDATION ENGINE =====
function initRecommendationEngine(data) {
  speciesData = data;
  const recommendBtn = document.getElementById('recommendBtn');
  if (recommendBtn) {
    recommendBtn.addEventListener('click', handleRecommendation);
  }
}

function handleRecommendation() {
  if (!isFormValid()) {
    showNotification('Please fill in rainfall and temperature fields.', 'warning');
    return;
  }

  const recommendBtn = document.getElementById('recommendBtn');
  const resultsContainer = document.getElementById('resultsContainer');
  
  // Show loading state
  if (recommendBtn) {
    recommendBtn.innerHTML = '<div class="loading-spinner"></div> Analyzing...';
    recommendBtn.disabled = true;
    recommendBtn.classList.add('loading-pulse');
  }

  // Show loading state in results area
  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="col-span-3 text-center p-12">
        <div class="glass p-8 rounded-2xl card-magic">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="text-xl text-forest-700 dark:text-forest-200">Analyzing species data...</p>
          <p class="text-sm text-forest-600 dark:text-forest-300 mt-2">Finding the perfect trees for your conditions</p>
        </div>
      </div>
    `;
  }

  // Show results section
  const resultsSection = document.getElementById('resultsSection');
  if (resultsSection) {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  // Animate progress bar
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.style.width = '0%';
    setTimeout(() => {
      progressBar.style.width = '100%';
    }, 100);
  }

  // Process recommendations
  setTimeout(() => {
    const criteria = getFormValues();
    const recommendations = recommend(speciesData, criteria);

    // Restore button state
    if (recommendBtn) {
      recommendBtn.innerHTML = '<i class="fas fa-tree mr-3"></i> Recommend Trees 🌱';
      recommendBtn.disabled = false;
      recommendBtn.classList.remove('loading-pulse');
    }

    // Render results using your original beautiful cards
    renderResults(recommendations);
  }, 1500);
}

function recommend(speciesList, criteria) {
  const { soil, pHMin, pHMax, rainfall, tempMin, tempMax, humidity, sunlight, goals } = criteria;
  let scored = [];

  for (const s of speciesList) {
    let score = 0;

    // Soil match
    if (soil && s['Soil Type'] && s['Soil Type'].includes(soil)) score += 2;

    // pH range match
    const sPHMin = parseFloat(s['pH Min']);
    const sPHMax = parseFloat(s['pH Max']);
    if (!isNaN(sPHMin) && !isNaN(sPHMax)) {
      if (pHMin >= sPHMin && pHMax <= sPHMax) score += 2;
    }

    // Rainfall match
    const sRainMin = parseInt(s['Rainfall Min (mm)']);
    const sRainMax = parseInt(s['Rainfall Max (mm)']);
    if (!isNaN(sRainMin) && !isNaN(sRainMax)) {
      if (rainfall >= sRainMin && rainfall <= sRainMax) score += 2;
    }

    // Temperature match
    const sTempMin = parseInt(s['Temp Min (°C)']);
    const sTempMax = parseInt(s['Temp Max (°C)']);
    if (!isNaN(sTempMin) && !isNaN(sTempMax)) {
      if (tempMin >= sTempMin && tempMax <= sTempMax) score += 2;
    }

    // Sunlight match
    if (sunlight && s['Sunlight'] && s['Sunlight'].includes(sunlight)) score += 1;

    // Humidity match
    if (humidity && s['Humidity'] && s['Humidity'].includes(humidity)) score += 1;

    // Goal match
    const speciesGoals = (s['Restoration Goal'] || '').split(',').map(g => g.trim());
    for (const goal of goals) {
      if (speciesGoals.includes(goal)) score += 2;
    }

    if (score > 4) {
      scored.push({ ...s, score });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 6);
}

// ===== ENHANCED IMAGE FUNCTION =====
function getSpeciesImageUrl(species) {
  // Get the name (e.g., "African Mahogany")
  const name = species['Common Name'] || species['Species Name'] || 'Tree';
  
  // Create a strict prompt that forces a tree appearance
  // We use "botanical illustration style" or "national geographic photo" to ensure quality
  const prompt = `botanical photography of ${name} tree growing tall in a forest, realistic, bright sunlight, 4k, high detailed`;
  
  // Encode it so the URL doesn't break
  const encodedPrompt = encodeURIComponent(prompt);
  
  // Use Pollinations AI (It generates a new image based on the text description)
  // We add 'nologo=true' to keep it clean
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;
}

// ===== RESULTS RENDERING =====
function renderResults(recommendations) {
  const container = document.getElementById('resultsContainer');
  if (!container) return;

  // Clear any existing loading states
  container.innerHTML = '';

  if (recommendations.length === 0) {
    container.innerHTML = `
      <div class="col-span-3 text-center p-12 scroll-reveal">
        <div class="glass p-8 rounded-2xl card-magic">
          <i class="fas fa-search text-6xl text-gold-400 mb-4"></i>
          <p class="text-xl text-forest-700 dark:text-forest-200">No species match your criteria.</p>
          <p class="mt-2 text-forest-600 dark:text-forest-300">Try adjusting your site conditions or goals.</p>
        </div>
      </div>
    `;
    return;
  }

  recommendations.forEach((species, index) => {
    const card = document.createElement('div');
    card.className = 'glass card-magic overflow-hidden transition-all duration-500 cursor-default scroll-reveal';
    
    const goals = (species['Restoration Goal'] || '')
      .split(',')
      .map(g => g.trim())
      .slice(0, 3);

    const matchPercentage = Math.min(Math.round((species.score / 12) * 100), 100);

    card.innerHTML = `
      <div class="absolute top-4 right-4 z-10">
        <div class="bg-gradient-to-r from-gold-400 to-gold-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          ${matchPercentage}% Match
        </div>
      </div>

      <!-- FAVORITE STAR -->
      <div class="favorite-star ${isFavorited(species) ? 'favorited' : ''}" 
           onclick="toggleFavoriteCard(this, ${JSON.stringify(species).replace(/"/g, '&quot;')})">
        <i class="fas fa-heart ${isFavorited(species) ? 'text-red-500' : 'text-gray-400'}"></i>
      </div>

      <div class="relative h-48 overflow-hidden">
        <img 
          src="${getSpeciesImageUrl(species)}"
          alt="${species['Species Name']}" 
          class="w-full h-full object-cover transform hover:scale-110 transition duration-700 species-image"
          loading="lazy"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      <div class="p-6 relative z-10">
        <h4 class="text-2xl font-bold text-forest-800 dark:text-forest-100 mb-1 species-name hover:text-gold-400 transition-colors">
          ${species["Species Name"]}
        </h4>
        
        <p class="text-gold-400 font-semibold text-lg mb-3">${species["Common Name"] || ''}</p>

        <div class="mb-4">
          <div class="flex justify-between text-xs text-forest-600 dark:text-forest-300 mb-1">
            <span>Match Score</span>
            <span>${species.score}/12 points</span>
          </div>
          <div class="w-full bg-forest-200 dark:bg-forest-700 rounded-full h-2">
            <div class="bg-gradient-to-r from-green-500 to-gold-400 h-2 rounded-full progress-bar-glow" 
                 style="width: ${matchPercentage}%"></div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-4">
          ${goals.map(g => `
            <span class="px-3 py-1 bg-forest-100 dark:bg-forest-700 text-forest-700 dark:text-forest-200 rounded-full text-xs chip transition-all hover:scale-105">
              ${g}
            </span>
          `).join('')}
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div class="flex items-center space-x-1 text-forest-600 dark:text-forest-300">
            <i class="fas fa-thermometer-half text-gold-400"></i>
            <span>${species['Temp Min (°C)']}°-${species['Temp Max (°C)']}°C</span>
          </div>
          <div class="flex items-center space-x-1 text-forest-600 dark:text-forest-300">
            <i class="fas fa-tint text-blue-400"></i>
            <span>${species['Rainfall Min (mm)']}mm+</span>
          </div>
          <div class="flex items-center space-x-1 text-forest-600 dark:text-forest-300">
            <i class="fas fa-seedling text-green-400"></i>
            <span>pH ${species['pH Min']}-${species['pH Max']}</span>
          </div>
          <div class="flex items-center space-x-1 text-forest-600 dark:text-forest-300">
            <i class="fas fa-sun text-yellow-400"></i>
            <span>${species['Sunlight'] || 'Full Sun'}</span>
          </div>
        </div>

        <!-- BEAUTIFUL BUTTONS SECTION -->
        <div class="grid grid-cols-2 gap-3">
          <button class="viewWiki border border-forest-300 dark:border-forest-600 text-forest-700 dark:text-forest-200 hover:bg-forest-50 dark:hover:bg-forest-800 py-3 rounded-xl text-sm font-medium transition-all group">
            <i class="fas fa-book-open mr-2 group-hover:scale-110 transition-transform"></i>
            Learn More
          </button>
          <button onclick="addToMapFromSpecies('${species['Species Name']}', '${species['Common Name']}')" 
                  class="bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-white py-3 rounded-xl text-sm font-medium btn-magic transition-all group">
            <i class="fas fa-map-marker-alt mr-2 group-hover:scale-110 transition-transform"></i>
            Add to Project
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    card.querySelector('.viewWiki')?.addEventListener('click', () => {
      showWikiModal(species);
    });

    container.appendChild(card);
  });
}

// ===== ADD TO MAP FROM SPECIES =====
function addToMapFromSpecies(speciesName, commonName) {
  // Prompt user for project name
  const projectName = prompt(`Enter a name for your ${commonName || speciesName} planting project:`, `${commonName || speciesName} Garden`);
  
  if (projectName) {
    // Show mapping section
    document.getElementById('mappingSection').scrollIntoView({ behavior: 'smooth' });
    
    // Pre-fill the form
    document.getElementById('projectName').value = projectName;
    document.getElementById('projectDescription').value = `Planting ${commonName || speciesName} for ${getRandomGoal()}`;
    
    showNotification(`Ready to map your ${commonName || speciesName} project! Click on the map to select location.`, 'info');
  }
}

function getRandomGoal() {
  const goals = [
    'biodiversity enhancement',
    'carbon sequestration', 
    'soil improvement',
    'beautification',
    'shade provision',
    'wildlife habitat'
  ];
  return goals[Math.floor(Math.random() * goals.length)];
}

// ===== MODALS =====
function showGrowthModal(species) {
  const modal = document.getElementById('growthModal');
  const nameEl = document.getElementById('modalSpeciesName');
  
  if (!modal || !nameEl) return;

  nameEl.textContent = `Growth: ${species['Species Name']}`;
  modal.classList.add('show');

  // Simple growth chart
  const chartEl = document.getElementById('growthChart');
  if (window.Chart && chartEl) {
    const years = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const growthRate = Math.min(species.score / 10, 1.2);
    const height = years.map(y => y * growthRate * 1.8);

    new Chart(chartEl, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Height (m)',
          data: height,
          borderColor: '#D4AF37',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }
}

function showWikiModal(species) {
  const wikiModal = document.getElementById('wikiModal');
  const wikiSpeciesName = document.getElementById('wikiSpeciesName');
  
  if (!wikiModal || !wikiSpeciesName) return;

  // Store current species for planting guide
  window.currentSpecies = species;
  window.currentSpeciesPlantingGuide = null;
  
  wikiSpeciesName.textContent = species['Common Name'] || species['Species Name'];
  wikiModal.classList.add('show');

  // Reset to Wikipedia tab
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('[data-tab="wikipedia"]').classList.add('active');
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById('wikipedia-tab').classList.add('active');

  // Load Wikipedia content
  const contentEl = document.getElementById('wikiContent');
  const linkEl = document.getElementById('wikiLink');
  
  if (contentEl) contentEl.textContent = 'Loading Wikipedia information...';
  if (linkEl) linkEl.style.display = 'none';

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(species['Species Name'])}`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch Wikipedia data');
      return res.json();
    })
    .then(data => {
      currentWikiContext = data.extract || 'No detailed information available.';
      if (contentEl) contentEl.textContent = currentWikiContext;
      
      if (linkEl) {
        linkEl.href = data.content_urls?.desktop?.page || '#';
        linkEl.style.display = data.content_urls ? 'block' : 'none';
      }
    })
    .catch((error) => {
      console.error('Wikipedia fetch error:', error);
      if (contentEl) contentEl.textContent = 'Could not load Wikipedia data. Please check your internet connection.';
      if (linkEl) linkEl.style.display = 'none';
    });

  // AI question event listener
  document.getElementById('askAI')?.addEventListener('click', askAIQuestion);
}

async function askAIQuestion() {
  const questionInput = document.getElementById('userQuestion');
  const question = questionInput.value.trim();
  const responseEl = document.getElementById('aiResponse');
  const contentEl = responseEl?.querySelector('.ai-response-content');
  
  if (!question) {
    showNotification('Please enter a question', 'warning');
    return;
  }
  
  if (!contentEl) return;
  
  // Show loading state
  contentEl.textContent = 'Thinking...';
  responseEl.classList.remove('hidden');
  
  try {
    // 1. Get the current species context from the global window object
    const currentSpeciesName = window.currentSpecies ? 
      (window.currentSpecies['Common Name'] || window.currentSpecies['Species Name']) : 
      'this tree';
      
    // 2. Enhance the prompt to give the AI context about which tree is being discussed
    const enhancedQuestion = `Regarding the species "${currentSpeciesName}": ${question}`;

    // 3. ACTUAL API CALL
    const response = await forestWiseAI.sendMessage(enhancedQuestion);
    
    // 4. Display result
    contentEl.textContent = response;
    
  } catch (error) {
    console.error(error);
    contentEl.textContent = "Sorry, I couldn't get an answer right now. Please try again.";
  }
}

// ===== NAVIGATION FUNCTIONS ONLY =====

function initializeNavigation() {
    const navOrb = document.getElementById('navOrb');
    const navMenu = document.getElementById('navMenu');
    const menuItems = document.querySelectorAll('.menu-item');

    console.log('Navigation elements found:', {
        navOrb: !!navOrb,
        navMenu: !!navMenu,
        menuItems: menuItems.length
    });
    
    if (!navOrb) {
        console.log('Navigation orb not found - skipping navigation init');
        return;
    }
    
    // Orb click handler
    navOrb.addEventListener('click', toggleMenu);
    
    // Menu item click handlers
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
            closeMenu();
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!navOrb.contains(event.target) && !navMenu.contains(event.target)) {
            closeMenu();
        }
    });
}

/**
 * Toggles the navigation menu open and closed.
 */
function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  const navOrb = document.getElementById('navOrb');
  const icon = navOrb.querySelector('i');
  
  isMenuOpen = !isMenuOpen; // You might need to define 'let isMenuOpen = false;' at the top of your file
  navMenu.classList.toggle('active', isMenuOpen);
  
  if (icon) {
    icon.className = isMenuOpen ? 'fas fa-times' : 'fas fa-bars';
  }
}

/**
 * Closes the navigation menu.
 */
function closeMenu() {
  const navMenu = document.getElementById('navMenu');
  const navOrb = document.getElementById('navOrb');
  const icon = navOrb.querySelector('i');
  
  // You'll need 'isMenuOpen' for this too
  if (isMenuOpen) {
    isMenuOpen = false;
    navMenu.classList.remove('active');
    
    if (icon) {
      icon.className = 'fas fa-bars';
    }
  }
}

/**
 * Hides the current page and shows the new page.
 * @param {string} pageName - The key of the page from the 'pages' config object.
 */
function showPage(pageName) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // You will need to make sure 'pages', 'currentPage', and 'pageHistory' are defined globally in your script
  
  // Check if page exists in config
  if (!pages[pageName]) {
    console.error(`Page "${pageName}" is not defined in the pages configuration.`);
    return;
  }

  // Don't switch if already on the page
  if (pageName === currentPage) {
    return;
  }

  const newPageId = pages[pageName].id;
  const newPage = document.getElementById(newPageId);

  // Find current active page
  const oldPage = document.querySelector('.page.active');

  // Update menu active class
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  // Animate out the old page
  if (oldPage) {
    oldPage.classList.add('exit');
    oldPage.classList.remove('active');
    
    // Wait for the animation (0.6s defined in your CSS) to finish before removing exit class
    setTimeout(() => {
      oldPage.classList.remove('exit');
    }, 600);
  }

  // Animate in the new page
  if (newPage) {
    newPage.classList.add('active');
  }

  // Update global state
  currentPage = pageName;
  pageHistory.push(pageName);
}

// ===== PLANTING GUIDE TAB SYSTEM =====
function initPlantingGuideTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active tab content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      // If switching to planting guide and no content loaded yet, load it
      if (tabId === 'planting-guide' && !window.currentSpeciesPlantingGuide) {
        loadPlantingGuide(window.currentSpecies);
      }
    });
  });
}

// Modal event listeners
function initModals() {
  // Close buttons
  document.getElementById('closeGrowthModal')?.addEventListener('click', () => {
    document.getElementById('growthModal')?.classList.remove('show');
  });
  
  document.getElementById('closeWikiModal')?.addEventListener('click', () => {
    document.getElementById('wikiModal')?.classList.remove('show');
  });

  // Close on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
      });
    }
  });
}

// ===== CHAT WIDGET =====
function initChatWidget() {
  const toggle = document.getElementById('chatToggle');
  const box = document.getElementById('chatBox');
  
  if (!toggle || !box) return;

  toggle.addEventListener('click', () => {
    box.classList.toggle('hidden');
  });

  // Send message functionality
  document.getElementById('sendChat')?.addEventListener('click', sendChatMessage);
  document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const responseEl = document.getElementById('chatResponse');
  const contentEl = responseEl?.querySelector('.ai-response-content');
  
  if (!input || !contentEl) return;

  const question = input.value.trim();
  if (!question) return;

  // Show loading state
  contentEl.textContent = "Thinking...";
  responseEl.classList.remove('hidden');
  
  // Simulate AI response (Replace with actual OpenAI API call)
  setTimeout(() => {
    const responses = [
      "I can help you with tree selection and planting advice. For detailed species information, use the recommendation tool above.",
      "Based on common practices, I recommend starting with native species that match your local climate conditions.",
      "Consider factors like soil type, rainfall, and your restoration goals when choosing trees. The tool above can provide specific recommendations.",
      "I specialize in Nigerian tree species and reforestation strategies. What specific information are you looking for?"
    ];
    
    contentEl.textContent = responses[Math.floor(Math.random() * responses.length)];
    input.value = '';
  }, 1500);
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.scroll-reveal').forEach(el => {
    observer.observe(el);
  });
}

// ===== DATA LOADING =====
async function loadSpecies() {
  try {
    console.log('📦 Loading species data...');
    const response = await fetch('data/species.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load species data: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Species data is empty or invalid.');
    }

    console.log(`✅ Loaded ${data.length} species`);
    return data;
  } catch (error) {
    console.error('❌ Failed to load species data:', error);
    throw error;
  }
}

// ===== MAIN INITIALIZATION =====
async function initApp() {
  try {
    console.log('🚀 Starting Enhanced ForestWise app...');
    showLoading();

    // Initialize basic UI first
    initTheme();
    createParticles();
    initScrollAnimations();
    initSlideshow();
    initEnhancedChatWidget();
    initModals();
    initPlantingGuideTabs();
    initResetButton();
    initFavoritesSystem();
    initNewFeatures();
    initLocationDetection();
    initializeNavigation();
    
    // Load data and initialize data-dependent features
    speciesData = await loadSpecies();
    initForm(speciesData);
    initRecommendationEngine(speciesData);
    
    // Initialize mapping system
    initMappingSystem();
    
    // Initialize soil health assessment - only if on that page or element exists
    if (document.getElementById('soil-health-page') || document.getElementById('soilHealthSection')) {
      console.log('🟢 Initializing soil health assessment...');
      initSoilHealthAssessment();
    } else {
      console.log('🟡 Soil health page not found, skipping initialization');
    }
    
    // Load shared data from URL if present
    loadFromURL();

    // Scroll-to-tool button
    document.getElementById('getStartedBtn')?.addEventListener('click', () => {
      document.getElementById('tool').scrollIntoView({ behavior: 'smooth' });
    });

    hideLoading();
    console.log('✅ Enhanced ForestWise app fully loaded!');

  } catch (error) {
    console.error('❌ App initialization failed:', error);
    hideLoading();
    
    // Show error to user
    setTimeout(() => {
      alert('Failed to load the application. Please check your console for details and refresh the page.');
    }, 1000);
  }
}

// ===== ENHANCED AI ASSISTANT SYSTEM =====
class ForestWiseAI {
  constructor() {
    this.conversationHistory = [];
    this.isProcessing = false;
    this.currentContext = '';
  }

  async sendMessage(message, imageFile = null) {
    if (this.isProcessing) {
      throw new Error('Already processing a message');
    }
    
    this.isProcessing = true;
    
    try {
      let imageData = null;
      
      // Convert image to base64 if provided
      if (imageFile) {
        imageData = await this.fileToBase64(imageFile);
      }

      const userMessage = {
        role: "user",
        content: message
      };
      
      // Add to conversation history
      this.conversationHistory.push(userMessage);

      // --- CHANGE START: Access global speciesData ---
      // We pass the global speciesData variable loaded in initApp
      const currentSpeciesData = speciesData || [];
      // --- CHANGE END ---

     const response = await fetch('/forestwise-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: this.conversationHistory,
          imageData: imageData,
          context: this.currentContext,
          speciesData: currentSpeciesData // <--- Sending the database
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage = {
        role: "assistant",
        content: data.response
      };
      
      this.conversationHistory.push(assistantMessage);

      // Keep conversation history manageable (last 10 messages)
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return data.response;

    } catch (error) {
      console.error('AI Assistant error:', error);
      // Remove the user message if the request failed
      this.conversationHistory.pop();
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  setContext(context) {
    this.currentContext = context;
    console.log('AI Context updated:', context);
  }

  clearHistory() {
    this.conversationHistory = [];
    this.currentContext = '';
  }

  getHistory() {
    return this.conversationHistory;
  }
}

// Initialize AI Assistant
const forestWiseAI = new ForestWiseAI();

// ===== ENHANCED CHAT WIDGET FUNCTIONALITY =====
function initEnhancedChatWidget() {
  const chatToggle = document.getElementById('chatToggle');
  const chatBox = document.getElementById('chatBox');
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.getElementById('sendChat');
  const chatMessages = document.getElementById('chatMessages');
  const closeChat = document.getElementById('closeChat');
  const clearChat = document.getElementById('clearChat');
  const uploadButton = document.getElementById('uploadButton');
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');
  const removeImage = document.getElementById('removeImage');
  const contextButton = document.getElementById('contextButton');

  let currentImageFile = null;

  // Toggle chat visibility
  chatToggle.addEventListener('click', () => {
    chatBox.classList.toggle('hidden');
    if (!chatBox.classList.contains('hidden')) {
      chatInput.focus();
    }
  });

  // Close chat
  closeChat.addEventListener('click', () => {
    chatBox.classList.add('hidden');
  });

  // Clear chat history
  clearChat.addEventListener('click', () => {
    if (confirm('Clear conversation history?')) {
      chatMessages.innerHTML = `
        <div class="chat-message assistant-message">
          <div class="bg-forest-100 dark:bg-forest-700 rounded-xl p-3 max-w-xs">
            <p class="text-sm">Hello! I'm ForestWise AI. I can help you with tree identification, planting advice, soil health, and ecological restoration. You can even upload images for me to analyze!</p>
          </div>
        </div>
      `;
      forestWiseAI.clearHistory();
      showNotification('Conversation history cleared', 'info');
    }
  });

  // Image upload
  uploadButton.addEventListener('click', () => {
    imageUpload.click();
  });

  imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('Image must be smaller than 5MB', 'error');
        return;
      }
      
      currentImageFile = file;
      imagePreview.classList.remove('hidden');
      
      // Reset file input
      imageUpload.value = '';
    }
  });

  removeImage.addEventListener('click', () => {
    currentImageFile = null;
    imagePreview.classList.add('hidden');
  });

  // Set context based on current page
  contextButton.addEventListener('click', () => {
    const context = getCurrentContext();
    forestWiseAI.setContext(context);
    showNotification('Context updated for AI assistant', 'success');
  });

  // Send message
  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message && !currentImageFile) {
      showNotification('Please enter a message or upload an image', 'warning');
      return;
    }

    // Add user message to chat
    addMessageToChat('user', message, currentImageFile);
    chatInput.value = '';
    
    // Show loading state
    const loadingId = addLoadingMessage();

    try {
      const response = await forestWiseAI.sendMessage(message || "Analyze this image", currentImageFile);
      
      // Remove loading message and add AI response
      removeLoadingMessage(loadingId);
      addMessageToChat('assistant', response);
      
      // Clear image after send
      currentImageFile = null;
      imagePreview.classList.add('hidden');
      
    } catch (error) {
      removeLoadingMessage(loadingId);
      console.error('Chat error:', error);
      showNotification('Failed to get AI response. Please try again.', 'error');
      addMessageToChat('assistant', "I'm sorry, I'm having trouble responding right now. Please check your connection and try again.");
    }
  }

  // Event listeners for sending
  sendButton.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Chat helper functions
  function addMessageToChat(role, content, imageFile = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;
    
    if (role === 'user') {
      messageDiv.innerHTML = `
        <div class="flex justify-end">
          <div class="bg-gold-500 text-white rounded-xl p-3 max-w-xs">
            ${imageFile ? `
              <div class="mb-2">
                <img src="${URL.createObjectURL(imageFile)}" alt="Uploaded image" class="rounded-lg max-w-full h-32 object-cover">
              </div>
            ` : ''}
            <p class="text-sm">${content || '(Image)'}</p>
          </div>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="bg-forest-100 dark:bg-forest-700 rounded-xl p-3 max-w-full">
          <p class="text-sm whitespace-pre-wrap">${content}</p>
        </div>
      `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addLoadingMessage() {
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'chat-message assistant-message';
    loadingDiv.innerHTML = `
      <div class="bg-forest-100 dark:bg-forest-700 rounded-xl p-3 max-w-xs">
        <div class="flex items-center space-x-2">
          <div class="loading-spinner-small"></div>
          <span class="text-sm text-forest-600 dark:text-forest-300">ForestWise AI is thinking...</span>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingId;
  }

  function removeLoadingMessage(id) {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }
  }

  function getCurrentContext() {
    // Get context based on current section and form values
    let context = 'User is on ForestWise tree recommendation platform. ';
    
    try {
      const formValues = getFormValues();
      if (formValues.soil) context += `Soil type: ${formValues.soil}. `;
      if (formValues.rainfall) context += `Rainfall: ${formValues.rainfall}mm. `;
      if (formValues.tempMin && formValues.tempMax) {
        context += `Temperature range: ${formValues.tempMin}-${formValues.tempMax}°C. `;
      }
      if (formValues.goals && formValues.goals.length > 0) {
        context += `Restoration goals: ${formValues.goals.join(', ')}. `;
      }
    } catch (error) {
      console.log('Could not get form context:', error);
    }
    
    return context;
  }
}

// ===== PAGE SWITCH FIX (GUARANTEED WORKING) =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Navigation system ready");

  // Handle clicking menu items
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const targetPage = item.dataset.page;

      // Hide all pages
      document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));

      // Show target page
      const pageToShow = document.getElementById(`${targetPage}-page`);
      if (pageToShow) pageToShow.classList.add("active");

      // Update active menu style
      document.querySelectorAll(".menu-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      // Optional: reinitialize maps or data when switching
      if (targetPage === "projects" && typeof initMappingSystem === "function") {
        setTimeout(() => initMappingSystem(), 300);
      }
      if (targetPage === "soil-health" && typeof initSoilHealthAssessment === "function") {
        setTimeout(() => initSoilHealthAssessment(), 300);
      }
    });
  });

  // Ensure the first page shows on load
  const defaultPage = document.getElementById("recommendation-page");
  if (defaultPage) defaultPage.classList.add("active");
});

// Debug function for soil health
function debugSoilHealth() {
  console.log('=== SOIL HEALTH DEBUG ===');
  console.log('userLocation:', userLocation);
  console.log('soilHealthHistory:', soilHealthHistory);
  
  const activeStep = document.querySelector('.wizard-step.active');
  console.log('Active step:', activeStep ? activeStep.dataset.step : 'None');
  
  // Test radio button detection
  const soilTexture = document.querySelector('input[name="soilTexture"]:checked');
  const erosion = document.querySelector('input[name="erosion"]:checked');
  console.log('Selected soil texture:', soilTexture?.value);
  console.log('Selected erosion:', erosion?.value);
  
  // Test score calculation
  try {
    const scores = calculateCurrentScores();
    console.log('Current scores:', scores);
  } catch (e) {
    console.error('Error calculating scores:', e);
  }
}

// Make it globally available
window.debugSoilHealth = debugSoilHealth;

// ===== START THE APP =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();

}







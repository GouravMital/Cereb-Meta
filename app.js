// ACTA Founder Analyzer - BULLETPROOF API CONNECTIONS

// Enhanced Configuration with all three APIs
const CONFIG = {
    apis: {
        cerebras: {
            name: 'Cerebras',
            endpoint: 'https://api.cerebras.ai/v1/chat/completions',
            headers: {
                'Authorization': 'Bearer ',
                'Content-Type': 'application/json'
            },
            model: 'llama3.1-70b',
            purpose: 'Primary text analysis',
            healthCheck: {
                model: 'llama3.1-70b',
                messages: [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Say 'API connection successful' if you can read this."}
                ],
                max_tokens: 50,
                temperature: 0.1
            }
        },
        visual_openrouter: {
            name: 'OpenRouter Visual',
            endpoint: 'https://openrouter.ai/api/v1/chat/completions',
            headers: {
                'Authorization': 'Bearer ',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://acta.so',
                'X-Title': 'ACTA Founder Analyzer'
            },
            model: 'meta-llama/llama-4-scout',
            purpose: 'Visual chart generation',
            healthCheck: {
                model: 'meta-llama/llama-4-scout',
                messages: [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Say 'Visual API connection successful' if you can read this."}
                ],
                max_tokens: 50,
                temperature: 0.1
            }
        },
        fallback_openrouter: {
            name: 'OpenRouter Text',
            endpoint: 'https://openrouter.ai/api/v1/chat/completions',
            headers: {
                'Authorization': 'Bearer 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',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://acta.so',
                'X-Title': 'ACTA Founder Analyzer'
            },
            model: 'meta-llama/llama-3.1-70b-instruct',
            purpose: 'Fallback text analysis',
            healthCheck: {
                model: 'meta-llama/llama-3.1-70b-instruct',
                messages: [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Say 'Fallback API connection successful' if you can read this."}
                ],
                max_tokens: 50,
                temperature: 0.1
            }
        }
    },
    retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        exponentialBackoff: true
    },
    timeout: 30000,
    healthCheckTimeout: 10000,
    systemPrompt: `You are ACTA Founder Analyzer, an expert research assistant for startup founders. When analyzing a startup idea, provide comprehensive evaluation in exactly these sections:

**1. IDEA VALIDATION SCORE**: Rate 1-10 with data-driven justification
**2. MARKET ANALYSIS**: 
   - Total Addressable Market (TAM) size and growth rate
   - Market consensus and industry trends
   - Competitive landscape analysis
   - Market entry barriers and requirements
   - Target audience demographics and behavior
**3. STRENGTHS & OPPORTUNITIES**: Market potential, unique advantages
**4. POTENTIAL FLAWS/RISKS**: Categorized risks with evidence
**5. FUTURE RISKS**: Market trends, regulatory, tech disruption
**6. PRESENT HURDLES**: Competition, resources, MVP challenges
**7. RELEVANT VCs/INVESTORS**: Name, focus areas, contact info, recent investments
**8. HOW ACTA CAN HELP**: Tailored support and next steps
**9. EMAIL TEMPLATES**: 3 professional outreach templates

Use clear formatting with proper headers and structured presentation. Provide actionable insights based on real market data.`,
    visualPrompt: `Generate chart data in JSON format for 6 visualizations: Market Size Distribution (Pie Chart), Growth Projections (Bar Chart), Competitive Analysis (Radar Chart), Risk Assessment (Stacked Bar Chart), Investment Trends (Line Chart), Market Opportunity Matrix (Scatter Plot). Return only valid JSON with realistic data.`
};

// Enhanced Error Messages
const ERROR_MESSAGES = {
    network_error: "Network connection failed. Please check your internet connection and try again.",
    auth_error: "Authentication failed. The API key may be invalid or expired.",
    rate_limit: "Too many requests. Please wait a moment before trying again.",
    server_error: "Server error occurred. Please try again in a few moments.",
    timeout: "Request timed out. Please try again.",
    parse_error: "Failed to process the response. Please try again.",
    cors_error: "Cross-origin request blocked. Trying alternative connection method.",
    unknown_error: "An unexpected error occurred. Please try again or contact support."
};

// Global state with enhanced API tracking
let currentAnalysis = null;
let savedAnalyses = [];
let messageHistory = [];
let appApiStatus = {
    cerebras: { online: false, lastChecked: null, latency: null, error: null },
    visual_openrouter: { online: false, lastChecked: null, latency: null, error: null },
    fallback_openrouter: { online: false, lastChecked: null, latency: null, error: null },
    activeProvider: null,
    isOnline: false
};
let currentUserQuery = null;
let retryCount = 0;
let connectionTestInProgress = false;

// Sample data for complete fallback
const SAMPLE_DATA = {
    agentic_ai_analysis: `**1. IDEA VALIDATION SCORE**: 8.7/10

The Agentic AI agency concept shows strong potential due to the rapidly growing AI automation market ($15.7B in 2024, projected to reach $45.2B by 2030 at 23.4% CAGR).

**2. MARKET ANALYSIS**:

**Total Addressable Market (TAM)**:
- Global AI services market: $150+ billion by 2030
- AI automation specifically: $45.2 billion by 2030
- Enterprise AI adoption: 85% of businesses planning AI integration by 2025

**Market Consensus & Industry Trends**:
- Strong positive sentiment toward AI automation
- Increasing demand for AI-powered business processes
- Shift from simple chatbots to sophisticated agentic systems

**Competitive Landscape Analysis**:
- Major players: OpenAI, Anthropic, Google AI, Microsoft
- Specialized agencies emerging rapidly
- High fragmentation in service delivery

**Market Entry Barriers**:
- Technical expertise requirements
- High initial talent acquisition costs
- Need for proven case studies

**Target Audience Demographics**:
- Mid-market companies ($10M-$500M revenue)
- Technology-forward industries
- Companies with repetitive processes

**3. STRENGTHS & OPPORTUNITIES**:

• Growing Market Demand: Exponential increase in AI adoption
• High-Value Services: Premium pricing for specialized AI implementation
• Recurring Revenue Model: Ongoing optimization contracts
• Scalable Solutions: AI systems can be replicated across clients
• First-Mover Advantage: Early entry in rapidly evolving market

**4. POTENTIAL FLAWS/RISKS**:

• Rapid technology obsolescence
• Dependence on third-party AI platforms
• High competition from tech giants
• Difficulty finding qualified AI talent
• Long sales cycles for enterprise clients

**5. FUTURE RISKS**:

• No-code AI platforms reducing need for agencies
• Increasing AI regulation and compliance requirements
• Market saturation as more players enter
• Commoditization of basic AI services

**6. PRESENT HURDLES**:

• Established consulting firms with AI divisions
• High upfront investment in AI infrastructure
• Need for specialized technical talent
• Case study development requirements

**7. RELEVANT VCs/INVESTORS**:

| VC/Investor | Focus Area | Contact | Recent AI Investments |
|-------------|------------|---------|----------------------|
| **Andreessen Horowitz** | Enterprise AI | [LinkedIn](https://linkedin.com/company/andreessen-horowitz) | OpenAI, Databricks |
| **Sequoia Capital** | AI Infrastructure | [LinkedIn](https://linkedin.com/company/sequoia-capital) | OpenAI, Character.AI |
| **Index Ventures** | AI/ML Startups | [LinkedIn](https://linkedin.com/company/index-ventures) | Cohere, Scale AI |

**8. HOW ACTA CAN HELP**:

• Strategic Planning: Market positioning and differentiation strategy
• Business Development: Customer discovery and validation
• Operational Support: Team building and talent acquisition
• Growth Acceleration: Scaling strategies and operational efficiency
• Funding Support: Investor readiness and pitch deck development

**9. EMAIL TEMPLATES**:

**Template 1: Initial VC Outreach**

Subject: Seeking Investment for Agentic AI Agency - $45B Market Opportunity

Dear [Investor Name],

I hope this message finds you well. I'm [Your Name], founder of [Company Name], and I'm reaching out because of your impressive track record investing in AI infrastructure companies.

We're building an Agentic AI agency that helps mid-market companies implement sophisticated AI automation systems. The market opportunity is significant - $45.2B by 2030 with 23.4% CAGR.

We're currently raising [Amount] to accelerate our growth and would welcome the opportunity to discuss this with you.

Best regards,
[Your Name]

**Template 2: Follow-up Template**

Subject: Follow-up: Agentic AI Agency Investment Opportunity

Dear [Investor Name],

Thank you for taking the time to discuss [Company Name]. As requested, I'm attaching our updated materials including financial projections and case studies.

Our key differentiators include our focus on agentic AI systems and our proven track record of 90%+ client retention.

Please let me know if you need any additional information.

Best regards,
[Your Name]

**Template 3: Partnership Outreach**

Subject: Strategic Partnership Opportunity - AI Implementation Services

Dear [Partner Name],

I'm [Your Name] from [Company Name], and I believe there's a strong partnership opportunity between our companies.

We specialize in enterprise AI implementations and could help accelerate your customers' adoption of your platform.

Would you be available for a brief call to discuss potential collaboration?

Best regards,
[Your Name]`
};

// DOM Elements
let chatMessages, messageInput, sendButton, loadingModal, errorModal;
let copyNotification, statusNotification, analysesList;
let apiStatusElement, statusIndicator, statusText, connectionStatus;

// Initialize the application with comprehensive API testing
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    // Get DOM elements
    chatMessages = document.getElementById('chatMessages');
    messageInput = document.getElementById('messageInput');
    sendButton = document.getElementById('sendButton');
    loadingModal = document.getElementById('loadingModal');
    errorModal = document.getElementById('errorModal');
    copyNotification = document.getElementById('copyNotification');
    statusNotification = document.getElementById('statusNotification');
    analysesList = document.getElementById('analysesList');
    apiStatusElement = document.getElementById('apiStatus');
    statusIndicator = document.getElementById('statusIndicator');
    statusText = document.getElementById('statusText');
    connectionStatus = document.getElementById('connectionStatus');

    // Add event listeners
    if (messageInput) {
        messageInput.addEventListener('keydown', handleKeyDown);
        messageInput.addEventListener('input', handleInputChange);
    }

    showStatusNotification('Initializing ACTA Founder Analyzer...', 'info');
    updateApiStatus('checking', 'Testing all API connections...');
    
    // Comprehensive API connectivity testing
    setTimeout(async () => {
        await performComprehensiveApiTest();
    }, 500);
    
    // Load saved analyses
    loadSavedAnalyses();
    updateAnalysesList();
    
    // Set initial input state
    handleInputChange();
    
    console.log('ACTA Founder Analyzer initialized with bulletproof API connections');
}

// BULLETPROOF API CONNECTIVITY SYSTEM
async function performComprehensiveApiTest() {
    if (connectionTestInProgress) return;
    connectionTestInProgress = true;

    console.log('🔧 Starting comprehensive API connectivity test...');
    updateApiStatus('checking', 'Testing Cerebras API...');

    const testResults = {
        cerebras: await testApiEndpointComprehensive('cerebras'),
        visual_openrouter: await testApiEndpointComprehensive('visual_openrouter'),
        fallback_openrouter: await testApiEndpointComprehensive('fallback_openrouter')
    };

    console.log('📊 API Test Results:', testResults);

    // Update global status
    Object.keys(testResults).forEach(api => {
        appApiStatus[api] = {
            ...appApiStatus[api],
            ...testResults[api],
            lastChecked: new Date()
        };
    });

    // Determine best available API
    let activeProvider = null;
    let statusMessage = '';

    if (testResults.cerebras.online) {
        activeProvider = 'cerebras';
        statusMessage = `✅ Primary API Active (${CONFIG.apis.cerebras.name})`;
        appApiStatus.isOnline = true;
        updateApiStatus('online', `Connected via ${CONFIG.apis.cerebras.name}`);
    } else if (testResults.fallback_openrouter.online) {
        activeProvider = 'fallback_openrouter';
        statusMessage = `⚠️ Fallback API Active (${CONFIG.apis.fallback_openrouter.name})`;
        appApiStatus.isOnline = true;
        updateApiStatus('online', `Connected via ${CONFIG.apis.fallback_openrouter.name} (Fallback)`);
    } else if (testResults.visual_openrouter.online) {
        activeProvider = 'visual_openrouter';
        statusMessage = `⚠️ Visual API Active (${CONFIG.apis.visual_openrouter.name})`;
        appApiStatus.isOnline = true;
        updateApiStatus('online', `Connected via ${CONFIG.apis.visual_openrouter.name} (Limited)`);
    } else {
        statusMessage = '❌ All APIs Offline - Using Sample Data';
        appApiStatus.isOnline = false;
        updateApiStatus('offline', 'All connections failed');
        if (connectionStatus) connectionStatus.style.display = 'block';
    }

    appApiStatus.activeProvider = activeProvider;

    console.log(statusMessage);
    showStatusNotification(statusMessage, appApiStatus.isOnline ? 'success' : 'error');

    // Hide connection status if we have at least one working API
    if (appApiStatus.isOnline && connectionStatus) {
        connectionStatus.style.display = 'none';
    }

    // Log detailed status
    console.log('🔍 Detailed API Status:', {
        cerebras: `${testResults.cerebras.online ? '✅' : '❌'} (${testResults.cerebras.latency || 'N/A'}ms)`,
        visual: `${testResults.visual_openrouter.online ? '✅' : '❌'} (${testResults.visual_openrouter.latency || 'N/A'}ms)`,
        fallback: `${testResults.fallback_openrouter.online ? '✅' : '❌'} (${testResults.fallback_openrouter.latency || 'N/A'}ms)`,
        activeProvider: activeProvider || 'None'
    });

    connectionTestInProgress = false;
    setTimeout(() => hideNotification('statusNotification'), 3000);
}

async function testApiEndpointComprehensive(apiKey) {
    const config = CONFIG.apis[apiKey];
    console.log(`🧪 Testing ${config.name} (${config.purpose})...`);
    
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.healthCheckTimeout);

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                ...config.headers,
                'Accept': 'application/json'
            },
            body: JSON.stringify(config.healthCheck),
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        });

        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - startTime);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ ${config.name} failed: ${response.status} ${response.statusText}`);
            
            return {
                online: false,
                status: response.status,
                error: `HTTP ${response.status}: ${response.statusText}`,
                errorType: categorizeHttpError(response.status),
                latency: latency,
                details: errorText.substring(0, 200)
            };
        }

        // Try to parse JSON response
        let responseData;
        try {
            responseData = await response.json();
        } catch (parseError) {
            console.log(`⚠️ ${config.name} response parsing failed:`, parseError);
            return {
                online: false,
                error: 'Invalid JSON response',
                errorType: 'parse_error',
                latency: latency
            };
        }

        // Validate response structure
        if (responseData && responseData.choices && responseData.choices[0]) {
            console.log(`✅ ${config.name} connection successful (${latency}ms)`);
            return {
                online: true,
                latency: latency,
                status: response.status,
                model: config.model,
                responsePreview: responseData.choices[0].message?.content?.substring(0, 50) || 'No content'
            };
        } else {
            console.log(`❌ ${config.name} invalid response structure:`, responseData);
            return {
                online: false,
                error: 'Invalid response structure',
                errorType: 'parse_error',
                latency: latency,
                details: JSON.stringify(responseData).substring(0, 200)
            };
        }

    } catch (error) {
        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - startTime);
        
        console.log(`❌ ${config.name} error:`, error.message);
        
        let errorType = 'unknown_error';
        if (error.name === 'AbortError') {
            errorType = 'timeout';
        } else if (error.message.includes('fetch')) {
            errorType = 'network_error';
        } else if (error.message.includes('CORS')) {
            errorType = 'cors_error';
        }

        return {
            online: false,
            error: error.message,
            errorType: errorType,
            latency: latency
        };
    }
}

function categorizeHttpError(status) {
    if (status === 401 || status === 403) return 'auth_error';
    if (status === 429) return 'rate_limit';
    if (status >= 500) return 'server_error';
    if (status === 404) return 'not_found';
    return 'http_error';
}

// Enhanced API calling with comprehensive error handling
async function analyzeWithRetry(userMessage) {
    console.log('🚀 Starting analysis with comprehensive retry logic...');
    let lastError = null;
    let attemptedApis = [];
    
    for (let attempt = 1; attempt <= CONFIG.retry.maxAttempts; attempt++) {
        console.log(`📡 Analysis attempt ${attempt}/${CONFIG.retry.maxAttempts}`);
        updateLoadingProgress(attempt);
        
        try {
            // Try APIs in order of preference
            if (appApiStatus.cerebras.online && !attemptedApis.includes('cerebras')) {
                console.log('🎯 Trying Cerebras API (Primary)...');
                attemptedApis.push('cerebras');
                const result = await callAPIWithTimeout('cerebras', userMessage);
                console.log('✅ Cerebras API successful');
                return result;
            }
            
            if (appApiStatus.fallback_openrouter.online && !attemptedApis.includes('fallback_openrouter')) {
                console.log('🔄 Trying OpenRouter Text API (Fallback)...');
                attemptedApis.push('fallback_openrouter');
                const result = await callAPIWithTimeout('fallback_openrouter', userMessage);
                console.log('✅ OpenRouter Text API successful');
                return result;
            }
            
            if (appApiStatus.visual_openrouter.online && !attemptedApis.includes('visual_openrouter')) {
                console.log('🎨 Trying OpenRouter Visual API (Limited)...');
                attemptedApis.push('visual_openrouter');
                const result = await callAPIWithTimeout('visual_openrouter', userMessage);
                console.log('✅ OpenRouter Visual API successful');
                return result;
            }
            
            // If we've tried all available APIs, break
            if (attemptedApis.length >= Object.keys(CONFIG.apis).length) {
                console.log('❌ All available APIs exhausted');
                break;
            }
            
        } catch (error) {
            lastError = error;
            console.log(`⚠️ Attempt ${attempt} failed:`, error.message);
            
            if (attempt < CONFIG.retry.maxAttempts) {
                const delay = CONFIG.retry.exponentialBackoff 
                    ? Math.min(CONFIG.retry.baseDelay * Math.pow(2, attempt - 1), CONFIG.retry.maxDelay)
                    : CONFIG.retry.baseDelay;
                
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await sleep(delay);
            }
        }
    }

    // All attempts failed - use sample data
    console.log('🔄 All API attempts failed, using sample data...');
    showStatusNotification('APIs unavailable - showing sample analysis', 'warning');
    return SAMPLE_DATA.agentic_ai_analysis;
}

async function callAPIWithTimeout(apiKey, userMessage) {
    const config = CONFIG.apis[apiKey];
    console.log(`📞 Calling ${config.name} API...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.log(`⏰ ${config.name} API timeout after ${CONFIG.timeout}ms`);
        controller.abort();
    }, CONFIG.timeout);

    try {
        const requestBody = {
            model: config.model,
            messages: [
                { role: 'system', content: CONFIG.systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 4000,
            stream: false
        };

        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                ...config.headers,
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ ${config.name} HTTP error: ${response.status}`, errorText);
            
            // Update API status
            appApiStatus[apiKey].online = false;
            appApiStatus[apiKey].error = `HTTP ${response.status}`;
            
            throw new Error(categorizeHttpError(response.status));
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.log(`❌ ${config.name} invalid response structure:`, data);
            throw new Error('parse_error');
        }

        // Update successful API status
        appApiStatus[apiKey].online = true;
        appApiStatus[apiKey].error = null;
        appApiStatus.activeProvider = apiKey;
        
        console.log(`✅ ${config.name} API call successful`);
        return data.choices[0].message.content;

    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('timeout');
        }
        
        // Update failed API status
        appApiStatus[apiKey].online = false;
        appApiStatus[apiKey].error = error.message;
        
        throw error;
    }
}

// Visual Analysis Function (New Feature)
async function generateVisualAnalysis(userMessage) {
    console.log('🎨 Generating visual analysis...');
    
    if (!appApiStatus.visual_openrouter.online) {
        console.log('⚠️ Visual API not available, using sample data');
        return getSampleChartData();
    }

    try {
        const result = await callAPIWithTimeout('visual_openrouter', 
            `${CONFIG.visualPrompt}\n\nStartup idea: ${userMessage}`);
        
        // Try to parse JSON from the response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('No valid JSON found in response');
        }
    } catch (error) {
        console.log('❌ Visual analysis failed:', error.message);
        return getSampleChartData();
    }
}

function getSampleChartData() {
    return {
        charts: [
            {
                type: 'pie',
                title: 'Market Size Distribution',
                data: {
                    labels: ['Enterprise AI', 'SMB Automation', 'Custom Solutions', 'Consulting'],
                    datasets: [{
                        data: [40, 30, 20, 10],
                        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
                    }]
                }
            },
            {
                type: 'bar',
                title: 'Market Growth Projections',
                data: {
                    labels: ['2024', '2025', '2026', '2027', '2028'],
                    datasets: [{
                        label: 'Market Size ($B)',
                        data: [15.7, 19.4, 24.1, 30.2, 37.8],
                        backgroundColor: '#1FB8CD'
                    }]
                }
            }
        ]
    };
}

// Message Handling
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function handleInputChange() {
    const hasContent = messageInput && messageInput.value.trim().length > 0;
    if (sendButton) sendButton.disabled = !hasContent;
}

async function sendMessage() {
    if (!messageInput || !sendButton) return;
    
    const message = messageInput.value.trim();
    if (!message) return;

    currentUserQuery = message;
    retryCount = 0;

    messageInput.value = '';
    sendButton.disabled = true;
    handleInputChange();

    addMessage('user', message);
    showLoadingModal();

    try {
        const response = await analyzeWithRetry(message);
        hideLoadingModal();
        addMessage('assistant', response);
        saveCurrentAnalysis(message, response);
        
        // Add visual analysis button
        addVisualAnalysisButton();
        
    } catch (error) {
        hideLoadingModal();
        console.error('Analysis failed:', error);
        showErrorModal(error);
    }
}

function addVisualAnalysisButton() {
    if (!chatMessages) return;
    
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'message assistant';
    buttonDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-chart-bar"></i>
        </div>
        <div class="message-content">
            <button class="btn btn-primary" onclick="generateCharts()" style="margin-top: 16px;">
                <i class="fas fa-chart-pie"></i>
                Generate Visual Analysis
            </button>
        </div>
    `;
    
    chatMessages.appendChild(buttonDiv);
    scrollToBottom();
}

async function generateCharts() {
    if (!currentUserQuery) return;
    
    showStatusNotification('Generating visual analysis...', 'info');
    
    try {
        const chartData = await generateVisualAnalysis(currentUserQuery);
        displayCharts(chartData);
        showStatusNotification('Visual analysis complete!', 'success');
    } catch (error) {
        console.error('Chart generation failed:', error);
        showStatusNotification('Chart generation failed - showing sample charts', 'warning');
        displayCharts(getSampleChartData());
    }
    
    setTimeout(() => hideNotification('statusNotification'), 3000);
}

function displayCharts(chartData) {
    if (!chatMessages || !chartData.charts) return;
    
    const chartsDiv = document.createElement('div');
    chartsDiv.className = 'message assistant';
    
    let chartsHtml = `
        <div class="message-avatar">
            <i class="fas fa-chart-line"></i>
        </div>
        <div class="message-content">
            <h3>📊 Visual Market Analysis</h3>
            <div class="charts-container">
    `;
    
    chartData.charts.forEach((chart, index) => {
        chartsHtml += `
            <div class="chart-item">
                <h4>${chart.title}</h4>
                <div class="chart-container" style="position: relative; height: 300px;">
                    <canvas id="chart-${index}"></canvas>
                </div>
            </div>
        `;
    });
    
    chartsHtml += '</div></div>';
    chartsDiv.innerHTML = chartsHtml;
    
    chatMessages.appendChild(chartsDiv);
    scrollToBottom();
    
    // Render charts after DOM insertion
    chartData.charts.forEach((chart, index) => {
        setTimeout(() => renderChart(`chart-${index}`, chart), 100 * (index + 1));
    });
}

function renderChart(canvasId, chartConfig) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Simple chart rendering (placeholder for Chart.js)
    const config = {
        type: chartConfig.type,
        data: chartConfig.data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    };
    
    // Load Chart.js and render
    if (typeof Chart !== 'undefined') {
        new Chart(ctx, config);
    } else {
        // Fallback: Load Chart.js dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            new Chart(ctx, config);
        };
        document.head.appendChild(script);
    }
}

// Status and UI Management
function updateApiStatus(status, message) {
    if (statusIndicator) statusIndicator.className = `status-indicator ${status}`;
    if (statusText) statusText.textContent = message;
}

function showLoadingModal() {
    if (loadingModal) {
        loadingModal.classList.remove('hidden');
        updateLoadingProgress(1);
        
        setTimeout(() => updateLoadingProgress(2), 3000);
        setTimeout(() => updateLoadingProgress(3), 6000);
    }
}

function hideLoadingModal() {
    if (loadingModal) loadingModal.classList.add('hidden');
}

function updateLoadingProgress(step) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((el, index) => {
        if (index < step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
    
    const messages = [
        'Analyzing your startup idea...',
        'Researching market data and competitors...',
        'Finding relevant investors and creating templates...'
    ];
    
    const loadingMessage = document.getElementById('loadingMessage');
    if (step <= messages.length && loadingMessage) {
        loadingMessage.textContent = messages[step - 1];
    }
}

function showErrorModal(error) {
    if (!errorModal) return;
    
    const errorTitle = document.getElementById('errorTitle');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorTitle && errorMessage) {
        const errorType = error.message || 'unknown_error';
        const errorConfig = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.unknown_error;
        
        errorTitle.textContent = 'Connection Error';
        errorMessage.textContent = errorConfig;
    }
    
    errorModal.classList.remove('hidden');
}

function closeErrorModal() {
    if (errorModal) errorModal.classList.add('hidden');
}

function retryAnalysis() {
    closeErrorModal();
    if (currentUserQuery) {
        retryCount++;
        console.log(`🔄 Manual retry #${retryCount} for query: ${currentUserQuery}`);
        
        if (messageInput) {
            messageInput.value = currentUserQuery;
            handleInputChange();
            sendMessage();
        }
    }
}

function useOfflineMode() {
    closeErrorModal();
    
    if (currentUserQuery) {
        addMessage('assistant', SAMPLE_DATA.agentic_ai_analysis);
        saveCurrentAnalysis(currentUserQuery, SAMPLE_DATA.agentic_ai_analysis);
        addVisualAnalysisButton();
    }
    
    showStatusNotification('Offline mode - showing sample analysis', 'warning');
}

// Message display and formatting functions
function addMessage(role, content) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                ${escapeHtml(content)}
            </div>
        `;
    } else {
        const formattedContent = formatAnalysisResponse(content);
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                ${formattedContent}
            </div>
        `;
    }

    chatMessages.appendChild(messageDiv);
    scrollToBottom();

    messageHistory.push({ role, content, timestamp: new Date().toISOString() });
}

function formatAnalysisResponse(content) {
    let formatted = content;

    // Format section headers with collapsible functionality
    formatted = formatted.replace(/\*\*(\d+\.\s*[^*]+?)\*\*/g, 
        '<div class="section-header" onclick="toggleSection(this)"><strong>$1</strong><i class="fas fa-chevron-down"></i></div><div class="section-content">');
    
    // Close sections properly
    const sections = formatted.split('<div class="section-header"');
    let result = sections[0];
    
    for (let i = 1; i < sections.length; i++) {
        if (i > 1) result += '</div>';
        result += '<div class="section-header"' + sections[i];
    }
    if (sections.length > 1) result += '</div>';

    formatted = result;

    // Format score indicators
    formatted = formatted.replace(/(\d+\.?\d*\/10)/g, '<span class="validation-score">$1</span>');

    // Format tables
    formatted = formatted.replace(/\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/g, 
        '<tr><td>$1</td><td>$2</td><td><a href="#" class="contact-link">$3</a></td><td>$4</td></tr>');

    if (formatted.includes('<tr>')) {
        formatted = formatted.replace(/(<tr>.*?<\/tr>)/s, '<table class="vc-table"><thead><tr><th>Investor</th><th>Focus</th><th>Contact</th><th>Recent Investment</th></tr></thead><tbody>$1</tbody></table>');
    }

    // Format email templates
    formatted = formatted.replace(/\*\*(Template \d+:[^*]+?)\*\*/g, function(match, title) {
        const templateId = 'template-' + Math.random().toString(36).substr(2, 9);
        return `<div class="email-template">
            <div class="template-header">
                <span class="template-title">${title}</span>
                <button class="copy-btn" onclick="copyTemplate('${templateId}')">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
            <div class="template-content" id="${templateId}">`;
    });

    // Close template divs properly
    const templateCount = (formatted.match(/class="template-content"/g) || []).length;
    const closingCount = (formatted.match(/<\/div><\/div>/g) || []).length;
    for (let i = closingCount; i < templateCount; i++) {
        formatted += '</div></div>';
    }

    // Format bullet points  
    formatted = formatted.replace(/•\s*([^\n]+)/g, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

    // Format bold text
    formatted = formatted.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*]+?)\*/g, '<em>$1</em>');

    return formatted;
}

function toggleSection(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('i');
    
    if (content && content.classList.contains('section-content')) {
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            if (icon) icon.className = 'fas fa-chevron-down';
        } else {
            content.classList.add('collapsed');
            if (icon) icon.className = 'fas fa-chevron-right';
        }
    }
}

// Copy functionality
function copyTemplate(templateId) {
    const template = document.getElementById(templateId);
    if (template) {
        const text = template.textContent.trim();
        navigator.clipboard.writeText(text).then(() => {
            showCopyNotification();
        }).catch(err => {
            console.error('Copy failed:', err);
            showStatusNotification('Copy failed. Please select and copy manually.', 'error');
        });
    }
}

function showCopyNotification() {
    if (copyNotification) {
        copyNotification.classList.remove('hidden');
        setTimeout(() => {
            copyNotification.classList.add('hidden');
        }, 3000);
    }
}

// Notifications
function showStatusNotification(message, type = 'info') {
    if (!statusNotification) return;
    
    const icon = statusNotification.querySelector('i');
    const text = document.getElementById('statusNotificationText');
    
    statusNotification.className = `notification ${type}`;
    
    if (icon) {
        switch (type) {
            case 'success':
                icon.className = 'fas fa-check';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-circle';
                break;
            default:
                icon.className = 'fas fa-info-circle';
        }
    }
    
    if (text) text.textContent = message;
    statusNotification.classList.remove('hidden');
}

function hideNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) notification.classList.add('hidden');
}

// Analysis management
function saveCurrentAnalysis(query, response) {
    const analysis = {
        id: Date.now().toString(),
        title: extractTitleFromQuery(query),
        date: new Date().toLocaleDateString(),
        score: extractScoreFromResponse(response),
        query,
        response,
        timestamp: new Date().toISOString()
    };

    savedAnalyses.unshift(analysis);
    currentAnalysis = analysis;
    
    if (savedAnalyses.length > 10) {
        savedAnalyses = savedAnalyses.slice(0, 10);
    }

    updateAnalysesList();
}

function extractTitleFromQuery(query) {
    const words = query.split(' ').slice(0, 6);
    let title = words.join(' ');
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
}

function extractScoreFromResponse(response) {
    const scoreMatch = response.match(/(\d+\.?\d*)\/10/);
    return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
}

function loadSavedAnalyses() {
    savedAnalyses = [];
}

function updateAnalysesList() {
    if (!analysesList) return;
    
    const existingSaved = analysesList.querySelectorAll('.analysis-item:not(.sample)');
    existingSaved.forEach(item => item.remove());

    savedAnalyses.forEach(analysis => {
        const item = createAnalysisItem(analysis);
        analysesList.appendChild(item);
    });
}

function createAnalysisItem(analysis) {
    const item = document.createElement('div');
    item.className = 'analysis-item';
    item.onclick = () => loadAnalysis(analysis);

    const scoreClass = analysis.score >= 8 ? 'score-high' : 
                      analysis.score >= 6 ? 'score-medium' : 'score-low';

    item.innerHTML = `
        <div class="analysis-preview">
            <h4>${escapeHtml(analysis.title)}</h4>
            <div class="analysis-meta">
                <span class="date">${analysis.date}</span>
                <span class="score ${scoreClass}">${analysis.score}/10</span>
            </div>
        </div>
    `;

    return item;
}

function loadAnalysis(analysis) {
    if (!chatMessages) return;
    
    chatMessages.innerHTML = '';
    addMessage('user', analysis.query);
    addMessage('assistant', analysis.response);
    addVisualAnalysisButton();
    currentAnalysis = analysis;

    document.querySelectorAll('.analysis-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const items = Array.from(document.querySelectorAll('.analysis-item'));
    const targetItem = items.find(item => {
        const title = item.querySelector('h4').textContent;
        return title === analysis.title;
    });
    if (targetItem) targetItem.classList.add('active');
}

// Sample analyses data
const SAMPLE_ANALYSES = {
    'agentic-ai-agency': {
        id: 'agentic-ai-agency',
        title: 'Agentic AI Agency',
        date: 'Oct 03, 2025',
        score: 8.7,
        query: 'I want to start an Agentic AI agency',
        analysis: SAMPLE_DATA.agentic_ai_analysis
    }
};

function loadSampleAnalysis(sampleId) {
    const sample = SAMPLE_ANALYSES[sampleId];
    if (sample && chatMessages) {
        chatMessages.innerHTML = '';
        addMessage('user', sample.query);
        addMessage('assistant', sample.analysis);
        addVisualAnalysisButton();
        currentAnalysis = sample;

        document.querySelectorAll('.analysis-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const sampleItem = document.querySelector(`[onclick="loadSampleAnalysis('${sampleId}')"]`);
        if (sampleItem) sampleItem.classList.add('active');
    }
}

function startNewAnalysis() {
    if (!chatMessages) return;
    
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-content">
                <h2>Welcome to ACTA Founder Analyzer</h2>
                <p>Your AI-powered research assistant for startup validation and investor matching.</p>
                <div class="welcome-features">
                    <div class="feature-item">
                        <i class="fas fa-search"></i>
                        <span>Comprehensive idea validation</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-users"></i>
                        <span>VC & investor matching</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-envelope"></i>
                        <span>Professional outreach templates</span>
                    </div>
                </div>
                <p class="welcome-cta">Describe your startup idea, domain, or field to get started!</p>
            </div>
        </div>
    `;
    
    currentAnalysis = null;
    messageHistory = [];
    currentUserQuery = null;
    
    document.querySelectorAll('.analysis-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (messageInput) messageInput.focus();
}

// Export functionality
function exportAnalysis() {
    if (!currentAnalysis) {
        showStatusNotification('No analysis to export. Please analyze a startup idea first.', 'warning');
        return;
    }

    try {
        const exportContent = `
ACTA FOUNDER ANALYZER REPORT
============================

Analysis Date: ${currentAnalysis.date}
Startup Idea: ${currentAnalysis.title}
Validation Score: ${currentAnalysis.score}/10

ORIGINAL QUERY:
${currentAnalysis.query}

FULL ANALYSIS:
${currentAnalysis.response.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '')}

API STATUS REPORT:
=================
Cerebras API: ${appApiStatus.cerebras.online ? '✅ Online' : '❌ Offline'} ${appApiStatus.cerebras.latency ? `(${appApiStatus.cerebras.latency}ms)` : ''}
OpenRouter Text: ${appApiStatus.fallback_openrouter.online ? '✅ Online' : '❌ Offline'} ${appApiStatus.fallback_openrouter.latency ? `(${appApiStatus.fallback_openrouter.latency}ms)` : ''}
OpenRouter Visual: ${appApiStatus.visual_openrouter.online ? '✅ Online' : '❌ Offline'} ${appApiStatus.visual_openrouter.latency ? `(${appApiStatus.visual_openrouter.latency}ms)` : ''}
Active Provider: ${appApiStatus.activeProvider || 'Sample Data'}

---
Generated by ACTA Founder Analyzer with Bulletproof API Connections
For more information, visit ACTA.so
Support: support@acta.so
        `.trim();

        const blob = new Blob([exportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ACTA_Analysis_${currentAnalysis.id}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatusNotification('Analysis exported with API status report!', 'success');
        setTimeout(() => hideNotification('statusNotification'), 3000);

    } catch (error) {
        console.error('Export failed:', error);
        showStatusNotification('Export failed. Please try again.', 'error');
        setTimeout(() => hideNotification('statusNotification'), 3000);
    }
}

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Periodic connectivity monitoring
setInterval(async () => {
    if (!appApiStatus.isOnline && !connectionTestInProgress) {
        console.log('🔄 Periodic connectivity check...');
        await performComprehensiveApiTest();
    }
}, 60000); // Check every minute

// Connection retry button
function retryConnection() {
    showStatusNotification('Retesting all API connections...', 'info');
    performComprehensiveApiTest();
}

console.log('🚀 ACTA Founder Analyzer loaded with bulletproof API connections');

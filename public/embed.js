(function() {
    // Configuration
    let currentScript = document.currentScript;
    if (!currentScript) {
        currentScript = document.getElementById('salesiqscript');
    }
    // Fallback: try to find script by src if ID is missing and currentScript is null
    if (!currentScript) {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src && scripts[i].src.indexOf('/embed.js') !== -1) {
                currentScript = scripts[i];
                break;
            }
        }
    }

    const scriptUrl = currentScript ? new URL(currentScript.src) : null;
    
    // Get params from script URL or global config
    const urlParams = scriptUrl ? scriptUrl.searchParams : new URLSearchParams();
    
    const CONFIG = {
        baseUrl: 'http://localhost:3000', 
        companyId: urlParams.get("companyId"),
        websiteId: urlParams.get("websiteId")
    };

    if (!CONFIG.companyId) {
        console.error('SalesIQ: Company ID is missing. Please provide companyId in the script URL.');
        return; // Don't initialize if critical config is missing
    }

    console.log('SalesIQ: Initialized for company', CONFIG.companyId);

    // Inject CSS
    const css = `
        #salesiq-widget-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        #salesiq-iframe-wrapper {
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transform-origin: bottom right;
            background: white;
        }
        
        #salesiq-iframe-wrapper.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: all;
        }
        
        #salesiq-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        #salesiq-launcher {
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: #2563eb;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            position: relative;
        }
        
        #salesiq-launcher:hover {
            transform: scale(1.05);
            background: #1d4ed8;
        }
        
        #salesiq-launcher:active {
            transform: scale(0.95);
        }

        .salesiq-icon {
            width: 32px;
            height: 32px;
            transition: all 0.2s ease;
            position: absolute;
        }
        
        .salesiq-icon-close {
            opacity: 0;
            transform: rotate(-90deg);
        }
        
        #salesiq-launcher.open .salesiq-icon-chat {
            opacity: 0;
            transform: rotate(90deg);
        }
        
        #salesiq-launcher.open .salesiq-icon-close {
            opacity: 1;
            transform: rotate(0);
        }
        
        @media (max-width: 480px) {
            #salesiq-iframe-wrapper {
                width: calc(100vw - 48px);
                height: calc(100vh - 120px);
            }
        }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // Create Container
    const container = document.createElement('div');
    container.id = 'salesiq-widget-container';
    
    // Create Iframe Wrapper
    const iframeWrapper = document.createElement('div');
    iframeWrapper.id = 'salesiq-iframe-wrapper';
    
    // Create Iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'salesiq-iframe';
    const currentUrl = window.location.href;
    iframe.src = `${CONFIG.baseUrl}/widget?companyId=${CONFIG.companyId}&websiteId=${CONFIG.websiteId}&parentUrl=${encodeURIComponent(currentUrl)}`;
    iframe.allow = "camera; microphone; autoplay; encrypted-media;";
    
    iframeWrapper.appendChild(iframe);
    
    // Create Launcher
    const launcher = document.createElement('div');
    launcher.id = 'salesiq-launcher';
    launcher.innerHTML = `
        <svg class="salesiq-icon salesiq-icon-chat" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <svg class="salesiq-icon salesiq-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;
    
    container.appendChild(iframeWrapper);
    container.appendChild(launcher);
    document.body.appendChild(container);

    // State
    let isOpen = false;
    let hasAutoOpened = false;

    // Toggle Function
    function toggleWidget() {
        isOpen = !isOpen;
        if (isOpen) {
            iframeWrapper.classList.add('open');
            launcher.classList.add('open');
        } else {
            iframeWrapper.classList.remove('open');
            launcher.classList.remove('open');
        }
    }

    // Event Listeners
    launcher.addEventListener('click', toggleWidget);

    // Auto-open after 10 seconds
    setTimeout(() => {
        if (!isOpen && !hasAutoOpened) {
            toggleWidget();
            hasAutoOpened = true;
        }
    }, 10000);

    // Listen for messages from iframe (e.g., if we want to close from inside)
    window.addEventListener('message', (event) => {
        if (event.origin !== CONFIG.baseUrl) return;
        
        if (event.data.type === 'salesiq:close') {
            if (isOpen) toggleWidget();
        }
        if (event.data.type === 'salesiq:open') {
            if (!isOpen) toggleWidget();
        }
    });

})();

console.log('=== VANILLA JS TEST - BUNDLE IS LOADING ===');
console.log('Time:', new Date().toISOString());

// Test if DOM is ready
function testVanillaJS() {
    console.log('testVanillaJS function called');
    
    const rootElement = document.getElementById('root');
    console.log('Root element:', rootElement);
    
    if (rootElement) {
        rootElement.innerHTML = `
            <div style="
                padding: 20px; 
                background: white; 
                border: 2px solid red; 
                margin: 20px;
                font-family: Arial;
            ">
                <h1 style="color: green;">✅ VANILLA JS WORKING!</h1>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Bundle loaded:</strong> YES</p>
                <p><strong>DOM access:</strong> YES</p>
                <button onclick="alert('Button clicked! JavaScript events work!')" 
                        style="padding: 10px 20px; background: blue; color: white; border: none; cursor: pointer;">
                    Test Click Event
                </button>
                <div style="margin-top: 20px; font-size: 12px; color: #666;">
                    If you see this, the JavaScript bundle is loading and executing correctly.
                    The issue is with React, not the bundle system.
                </div>
            </div>
        `;
        console.log('✅ Vanilla JS content injected successfully');
    } else {
        console.error('❌ Root element not found!');
        document.body.innerHTML = `
            <div style="padding: 20px; background: red; color: white; font-family: Arial;">
                <h1>❌ ROOT ELEMENT NOT FOUND</h1>
                <p>The &lt;div id="root"&gt;&lt;/div&gt; element is missing from the HTML.</p>
            </div>
        `;
    }
}

// Try multiple ways to ensure the function runs
if (document.readyState === 'loading') {
    console.log('DOM is still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', testVanillaJS);
} else {
    console.log('DOM already loaded, running immediately...');
    testVanillaJS();
}

// Backup timeout
setTimeout(() => {
    console.log('Backup timeout fired - running testVanillaJS');
    testVanillaJS();
}, 1000);
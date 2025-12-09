/**
 * NoctoClick Tracker v1.0.0
 * Antifraud tracking script for Yandex Direct
 * (c) 2025 NoctoClick
 */

(function(window, document) {
  'use strict';

  // Configuration
  var config = {
    endpoint: null,
    siteId: null,
    debug: false
  };

  // Collected data
  var trackingData = {
    fingerprint: {},
    behavior: {},
    timestamp: Date.now()
  };

  /**
   * Initialize tracker from script tag attributes
   */
  function init() {
    var script = document.currentScript || document.querySelector('script[data-noctoclick]');
    
    if (script) {
      config.endpoint = script.getAttribute('data-endpoint') || 'http://localhost:3001/api/track';
      config.siteId = script.getAttribute('data-site-id') || 'demo';
      config.debug = script.getAttribute('data-debug') === 'true';
    }

    log('NoctoClick Tracker initialized', config);
    
    // Collect fingerprint immediately
    collectFingerprint();
    
    // Start behavioral tracking
    trackBehavior();
    
    // Send data on page unload
    window.addEventListener('beforeunload', sendData);
    
    // Send data after 5 seconds if user still on page
    setTimeout(sendData, 5000);
  }

  /**
   * Collect browser fingerprint
   */
  function collectFingerprint() {
    trackingData.fingerprint = {
      // Basic info
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages ? navigator.languages.join(',') : '',
      platform: navigator.platform,
      
      // Screen info
      screenResolution: screen.width + 'x' + screen.height,
      screenDepth: screen.colorDepth,
      availableResolution: screen.availWidth + 'x' + screen.availHeight,
      
      // Browser features
      timezone: getTimezone(),
      timezoneOffset: new Date().getTimezoneOffset(),
      sessionStorage: hasSessionStorage(),
      localStorage: hasLocalStorage(),
      indexedDB: !!window.indexedDB,
      
      // WebGL fingerprint
      webgl: getWebGLFingerprint(),
      
      // Canvas fingerprint
      canvas: getCanvasFingerprint(),
      
      // Plugins and fonts
      plugins: getPlugins(),
      fonts: detectFonts(),
      
      // Audio fingerprint
      audio: getAudioFingerprint(),
      
      // Hardware
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: navigator.deviceMemory || 0,
      
      // Touch support
      touchSupport: getTouchSupport(),
      
      // CPU class (IE only)
      cpuClass: navigator.cpuClass || 'unknown',
      
      // Do Not Track
      doNotTrack: getDoNotTrack()
    };

    // Generate hash
    trackingData.fingerprintHash = hashFingerprint(trackingData.fingerprint);
    
    log('Fingerprint collected', trackingData.fingerprint);
  }

  /**
   * Track user behavior
   */
  function trackBehavior() {
    var mouseMovements = 0;
    var clicks = 0;
    var keyPresses = 0;
    var scrolls = 0;
    var startTime = Date.now();
    var firstInteractionTime = null;

    // Mouse movement
    document.addEventListener('mousemove', function() {
      mouseMovements++;
      if (!firstInteractionTime) firstInteractionTime = Date.now();
    }, { passive: true });

    // Clicks
    document.addEventListener('click', function() {
      clicks++;
      if (!firstInteractionTime) firstInteractionTime = Date.now();
    });

    // Keyboard
    document.addEventListener('keypress', function() {
      keyPresses++;
      if (!firstInteractionTime) firstInteractionTime = Date.now();
    });

    // Scroll
    var scrollTimeout;
    window.addEventListener('scroll', function() {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function() {
        scrolls++;
      }, 100);
    }, { passive: true });

    // Update behavior data periodically
    setInterval(function() {
      trackingData.behavior = {
        mouseMovements: mouseMovements,
        clicks: clicks,
        keyPresses: keyPresses,
        scrolls: scrolls,
        timeOnPage: Math.floor((Date.now() - startTime) / 1000),
        timeToFirstInteraction: firstInteractionTime ? Math.floor((firstInteractionTime - startTime) / 1000) : null,
        pageHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        scrollDepth: Math.floor((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
      };
    }, 1000);
  }

  /**
   * Get timezone
   */
  function getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'unknown';
    }
  }

  /**
   * Check storage availability
   */
  function hasSessionStorage() {
    try {
      sessionStorage.setItem('test', '1');
      sessionStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }

  function hasLocalStorage() {
    try {
      localStorage.setItem('test', '1');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get WebGL fingerprint
   */
  function getWebGLFingerprint() {
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return 'not_supported';
      
      var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      
      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
        unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown'
      };
    } catch (e) {
      return 'error';
    }
  }

  /**
   * Get Canvas fingerprint
   */
  function getCanvasFingerprint() {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('NoctoClick 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Antifraud', 4, 17);
      
      return canvas.toDataURL().substr(0, 100); // First 100 chars
    } catch (e) {
      return 'error';
    }
  }

  /**
   * Get plugins list
   */
  function getPlugins() {
    if (!navigator.plugins || navigator.plugins.length === 0) {
      return 'none';
    }
    
    var plugins = [];
    for (var i = 0; i < navigator.plugins.length; i++) {
      plugins.push(navigator.plugins[i].name);
    }
    return plugins.join(',');
  }

  /**
   * Detect installed fonts
   */
  function detectFonts() {
    var baseFonts = ['monospace', 'sans-serif', 'serif'];
    var testFonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
      'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Impact'
    ];
    var detectedFonts = [];

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = '72px monospace';
    var baseWidth = ctx.measureText('mmmmmmmmmmlli').width;

    for (var i = 0; i < testFonts.length; i++) {
      ctx.font = '72px ' + testFonts[i] + ', monospace';
      var width = ctx.measureText('mmmmmmmmmmlli').width;
      if (width !== baseWidth) {
        detectedFonts.push(testFonts[i]);
      }
    }

    return detectedFonts.join(',');
  }

  /**
   * Get Audio fingerprint
   */
  function getAudioFingerprint() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return 'not_supported';

      var context = new AudioContext();
      var oscillator = context.createOscillator();
      var analyser = context.createAnalyser();
      var gainNode = context.createGain();
      var scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0;
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(0);

      var hash = 0;
      scriptProcessor.onaudioprocess = function(event) {
        var output = event.inputBuffer.getChannelData(0);
        for (var i = 0; i < output.length; i++) {
          hash += Math.abs(output[i]);
        }
        oscillator.disconnect();
      };

      return hash.toString().substr(0, 20);
    } catch (e) {
      return 'error';
    }
  }

  /**
   * Get touch support info
   */
  function getTouchSupport() {
    return {
      maxTouchPoints: navigator.maxTouchPoints || 0,
      touchEvent: 'ontouchstart' in window,
      touchPoints: navigator.msMaxTouchPoints || 0
    };
  }

  /**
   * Get Do Not Track setting
   */
  function getDoNotTrack() {
    return navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack || 'unknown';
  }

  /**
   * Simple hash function for fingerprint
   */
  function hashFingerprint(obj) {
    var str = JSON.stringify(obj);
    var hash = 0;
    
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Get client IP (will be determined on server)
   */
  function getClientData() {
    return {
      siteId: config.siteId,
      url: window.location.href,
      referrer: document.referrer || 'direct',
      // UTM parameters
      utm: getUTMParams()
    };
  }

  /**
   * Extract UTM parameters from URL
   */
  function getUTMParams() {
    var params = {};
    var searchParams = new URLSearchParams(window.location.search);
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function(param) {
      var value = searchParams.get(param);
      if (value) params[param] = value;
    });
    
    // Yandex Direct click ID
    if (searchParams.get('yclid')) {
      params.yclid = searchParams.get('yclid');
    }
    
    return params;
  }

  /**
   * Send data to server
   */
  function sendData() {
    if (!config.endpoint) {
      log('No endpoint configured, skipping send');
      return;
    }

    var payload = Object.assign({}, trackingData, getClientData());
    
    log('Sending data', payload);

    // Use sendBeacon if available (works even after page unload)
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(config.endpoint, blob);
    } else {
      // Fallback to fetch
      fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function(err) {
        log('Send error', err);
      });
    }
  }

  /**
   * Debug logging
   */
  function log() {
    if (config.debug && console && console.log) {
      console.log('[NoctoClick]', Array.prototype.slice.call(arguments));
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual initialization
  window.NoctoClick = {
    init: init,
    sendData: sendData,
    getData: function() { return trackingData; },
    version: '1.0.0'
  };

})(window, document);
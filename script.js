// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const contentInput = document.getElementById('content');
    const sizeSelect = document.getElementById('size');
    const foregroundColorInput = document.getElementById('foreground-color');
    const backgroundColorInput = document.getElementById('background-color');
    const errorCorrectionSelect = document.getElementById('error-correction');
    const formatSelect = document.getElementById('format');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    const qrcodeDiv = document.getElementById('qrcode');
    const previewLightDiv = document.getElementById('preview-light');
    const previewDarkDiv = document.getElementById('preview-dark');
    const errorMessage = document.getElementById('error-message');
    
    // QR code instances
    let mainQRCode = null;
    let previewLightQRCode = null;
    let previewDarkQRCode = null;
    
    // Generate initial QR code on page load
    generateQRCode();
    
    // Generate QR code when button is clicked
    generateBtn.addEventListener('click', generateQRCode);
    
    // Function to validate URL
    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    // Generate QR code function
    function generateQRCode() {
        const content = contentInput.value.trim();
        
        if (!content) {
            errorMessage.textContent = 'Please enter a valid URL or text';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Show URL validation warning but still generate QR code
        if (content.startsWith('http') && !isValidURL(content)) {
            errorMessage.textContent = 'Warning: URL format may be incorrect';
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
        
        // Get options
        const size = parseInt(sizeSelect.value);
        const foregroundColor = foregroundColorInput.value;
        const backgroundColor = backgroundColorInput.value;
        const errorCorrectionLevel = errorCorrectionSelect.value;
        
        // Clear previous QR codes
        qrcodeDiv.innerHTML = '';
        previewLightDiv.innerHTML = '';
        previewDarkDiv.innerHTML = '';
        
        // Create main QR code
        mainQRCode = new QRCode(qrcodeDiv, {
            text: content,
            width: size,
            height: size,
            colorDark: foregroundColor,
            colorLight: backgroundColor,
            correctLevel: getQRCodeErrorCorrectionLevel(errorCorrectionLevel)
        });
        
        // Create preview QR codes (smaller size)
        const previewSize = Math.min(size, 150);
        
        previewLightQRCode = new QRCode(previewLightDiv, {
            text: content,
            width: previewSize,
            height: previewSize,
            colorDark: foregroundColor,
            colorLight: backgroundColor,
            correctLevel: getQRCodeErrorCorrectionLevel(errorCorrectionLevel)
        });
        
        previewDarkQRCode = new QRCode(previewDarkDiv, {
            text: content,
            width: previewSize,
            height: previewSize,
            colorDark: foregroundColor,
            colorLight: backgroundColor,
            correctLevel: getQRCodeErrorCorrectionLevel(errorCorrectionLevel)
        });
        
        // Show action buttons
        downloadBtn.style.display = 'block';
        shareBtn.style.display = 'block';
    }
    
    // Function to convert error correction level string to QRCode constant
    function getQRCodeErrorCorrectionLevel(level) {
        switch(level) {
            case 'L': return QRCode.CorrectLevel.L;
            case 'M': return QRCode.CorrectLevel.M;
            case 'Q': return QRCode.CorrectLevel.Q;
            case 'H': 
            default: return QRCode.CorrectLevel.H;
        }
    }
    
    // Download QR code as image
    downloadBtn.addEventListener('click', function() {
        const canvas = qrcodeDiv.querySelector('canvas');
        if (canvas) {
            const format = formatSelect.value;
            let mimeType;
            let fileName;
            
            switch(format) {
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    fileName = 'qrcode.jpg';
                    break;
                case 'svg':
                    // For SVG, we need to create an SVG from the canvas
                    downloadSVG();
                    return;
                case 'png':
                default:
                    mimeType = 'image/png';
                    fileName = 'qrcode.png';
            }
            
            // Create a temporary canvas to handle JPEG conversion if needed
            if (format === 'jpeg') {
                const tempCanvas = document.createElement('canvas');
                const ctx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                
                // Fill with white background for JPEG
                ctx.fillStyle = backgroundColorInput.value;
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                ctx.drawImage(canvas, 0, 0);
                
                const dataUrl = tempCanvas.toDataURL(mimeType, 0.9);
                downloadImage(dataUrl, fileName);
            } else {
                const dataUrl = canvas.toDataURL(mimeType);
                downloadImage(dataUrl, fileName);
            }
        }
    });
    
    // Function to download the image
    function downloadImage(dataUrl, fileName) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    // Function to download as SVG
    function downloadSVG() {
        const canvas = qrcodeDiv.querySelector('canvas');
        if (!canvas) return;
        
        const imgData = canvas.getContext('2d').getImageData(
            0, 0, canvas.width, canvas.height
        );
        const data = imgData.data;
        const size = canvas.width;
        const cellSize = size / 25; // QR code is typically 25 cells per side
        
        // Create SVG
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <rect width="100%" height="100%" fill="${backgroundColorInput.value}"/>`;
        
        // Scan the canvas data and create rectangles for each QR code cell
        for (let y = 0; y < size; y += cellSize) {
            for (let x = 0; x < size; x += cellSize) {
                const idx = (Math.floor(y) * size + Math.floor(x)) * 4;
                // If pixel is dark (QR code dot)
                if (data[idx] < 128) {
                    svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${foregroundColorInput.value}"/>`;
                }
            }
        }
        
        svg += '</svg>';
        
        // Create download link
        const blob = new Blob([svg], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Share QR code if Web Share API is available
    shareBtn.addEventListener('click', function() {
        const canvas = qrcodeDiv.querySelector('canvas');
        if (canvas && navigator.share) {
            canvas.toBlob(function(blob) {
                const file = new File([blob], 'qrcode.png', { type: 'image/png' });
                
                navigator.share({
                    title: 'QR Code',
                    text: 'QR Code for: ' + contentInput.value,
                    files: [file]
                }).catch(console.error);
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            alert('Sharing is not supported in your browser. You can download the QR code instead.');
        }
    });
    
    // Add input event listeners for real-time validation
    contentInput.addEventListener('input', function() {
        if (contentInput.value.trim()) {
            errorMessage.style.display = 'none';
        }
    });
    
    // Add event listeners for real-time QR code updates (debounced)
    let debounceTimer;
    const debounceDelay = 500; // 500ms delay
    
    function setupDebounceListener(element) {
        element.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(generateQRCode, debounceDelay);
        });
    }
    
    // Add debounced listeners to all input elements
    setupDebounceListener(contentInput);
    setupDebounceListener(sizeSelect);
    setupDebounceListener(foregroundColorInput);
    setupDebounceListener(backgroundColorInput);
    setupDebounceListener(errorCorrectionSelect);
});
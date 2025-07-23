class ImageToPDFConverter {
    constructor() {
        this.selectedImages = [];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.previewSection = document.getElementById('previewSection');
        this.imageGrid = document.getElementById('imageGrid');
        this.convertSection = document.getElementById('convertSection');
        this.convertBtn = document.getElementById('convertBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.downloadSection = document.getElementById('downloadSection');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.newConversionBtn = document.getElementById('newConversionBtn');
    }

    bindEvents() {
        
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        
        
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        
        this.convertBtn.addEventListener('click', this.convertToPDF.bind(this));
        this.clearBtn.addEventListener('click', this.clearImages.bind(this));
        this.newConversionBtn.addEventListener('click', this.resetApp.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showNotification('Please select valid image files.', 'error');
            return;
        }

        imageFiles.forEach(file => {
            if (file.size > 10 * 1024 * 1024) { 
                this.showNotification(`${file.name} is too large. Please select images under 10MB.`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.selectedImages.push({
                    file: file,
                    dataUrl: e.target.result,
                    name: file.name
                });
                this.updatePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    updatePreview() {
        if (this.selectedImages.length === 0) {
            this.previewSection.style.display = 'none';
            this.convertSection.style.display = 'none';
            return;
        }

        this.previewSection.style.display = 'block';
        this.previewSection.classList.add('fade-in');
        this.convertSection.style.display = 'block';
        this.convertSection.classList.add('slide-up');

        this.imageGrid.innerHTML = '';
        
        this.selectedImages.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${image.dataUrl}" alt="${image.name}">
                <button class="remove-image" onclick="converter.removeImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            this.imageGrid.appendChild(imageItem);
        });
    }

    removeImage(index) {
        this.selectedImages.splice(index, 1);
        this.updatePreview();
    }

    clearImages() {
        this.selectedImages = [];
        this.updatePreview();
        this.fileInput.value = '';
    }

    async convertToPDF() {
        if (this.selectedImages.length === 0) {
            this.showNotification('Please select images first.', 'error');
            return;
        }

        
        this.convertSection.style.display = 'none';
        
        
        this.progressSection.style.display = 'block';
        this.progressSection.classList.add('fade-in');

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            for (let i = 0; i < this.selectedImages.length; i++) {
                const image = this.selectedImages[i];
                
                
                const progress = Math.round(((i + 1) / this.selectedImages.length) * 100);
                this.updateProgress(progress);
                
                
                await this.delay(500);
                
                
                if (i > 0) {
                    pdf.addPage();
                }
                
                
                const img = new Image();
                img.src = image.dataUrl;
                
                await new Promise(resolve => {
                    img.onload = () => {
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        const margin = 20;
                        
                        const maxWidth = pageWidth - (margin * 2);
                        const maxHeight = pageHeight - (margin * 2);
                        
                        let { width, height } = this.calculateImageSize(
                            img.width, 
                            img.height, 
                            maxWidth, 
                            maxHeight
                        );
                        
                        const x = (pageWidth - width) / 2;
                        const y = (pageHeight - height) / 2;
                        
                        pdf.addImage(image.dataUrl, 'JPEG', x, y, width, height);
                        resolve();
                    };
                });
            }
            
            
            const pdfBlob = pdf.output('blob');
            this.pdfBlob = pdfBlob;
            
            
            setTimeout(() => {
                this.progressSection.style.display = 'none';
                this.downloadSection.style.display = 'block';
                this.downloadSection.classList.add('slide-up');
            }, 500);
            
        } catch (error) {
            console.error('Error converting to PDF:', error);
            this.showNotification('Error converting images to PDF. Please try again.', 'error');
            
            this.convertSection.style.display = 'block';
        }
    }

    calculateImageSize(imgWidth, imgHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        return {
            width: imgWidth * ratio,
            height: imgHeight * ratio
        };
    }

    updateProgress(percentage) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${percentage}%`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    resetConvertButton() {
        this.convertBtn.classList.remove('loading');
        this.convertBtn.innerHTML = '<span class="btn-text">Convert to PDF</span><span class="btn-icon"><i class="fas fa-magic"></i></span>';
    }

    resetApp() {
        this.selectedImages = [];
        this.fileInput.value = '';
        this.previewSection.style.display = 'none';
        this.convertSection.style.display = 'none';
        this.progressSection.style.display = 'none';
        this.downloadSection.style.display = 'none';
        this.resetConvertButton();
    }

    showNotification(message, type = 'info') {
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.converter = new ImageToPDFConverter();
    
    
    document.getElementById('downloadBtn').addEventListener('click', () => {
        if (converter.pdfBlob) {
            const url = URL.createObjectURL(converter.pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `NBM-Converter-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });
});


const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

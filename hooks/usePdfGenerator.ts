import React, { useCallback, useState } from 'react';

// Make jspdf and html2canvas available from window object
declare const jspdf: any;
declare const html2canvas: any;

export const usePdfGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(async (elementRef: React.RefObject<HTMLDivElement>, fileName: string) => {
    const input = elementRef.current;
    if (!input) {
      console.error("Element to capture is not available");
      return;
    }

    setIsGenerating(true);

    try {
      const { jsPDF } = jspdf;
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      const slides = input.querySelectorAll('.pdf-slide') as NodeListOf<HTMLElement>;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // Temporarily make slide visible for capture if it's hidden by carousel
        const originalDisplay = slide.style.display;
        slide.style.display = 'block';

        const canvas = await html2canvas(slide, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#1a202c', // Dark slate gray for PDF background
        });

        slide.style.display = originalDisplay;

        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`${fileName.replace(/ /g, '_')}_Plan.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { isGenerating, generatePdf };
};
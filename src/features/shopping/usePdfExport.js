import html2pdf from "html2pdf.js";
import { useCallback, useState } from "react";

export function usePdfExport() {
	const [pdfState, setPdfState] = useState({
		isGenerating: false,
		error: null,
		success: false,
	});

	const exportToPDF = useCallback(async (element) => {
		if (!element) return;
		setPdfState({ isGenerating: true, error: null, success: false });
		const opt = {
			margin: 1,
			filename: "lista-de-compras.pdf",
			image: { type: "jpeg", quality: 0.98 },
			html2canvas: { scale: 2 },
			jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
		};
		try {
			await html2pdf().set(opt).from(element).save();
			setPdfState({ isGenerating: false, error: null, success: true });
			setTimeout(() => {
				setPdfState((prev) => ({ ...prev, success: false }));
			}, 3000);
		} catch (err) {
			console.error("PDF generation error:", err);
			setPdfState({
				isGenerating: false,
				error: "Failed to generate PDF. Please try again.",
				success: false,
			});
		}
	}, []);

	return { pdfState, exportToPDF };
}

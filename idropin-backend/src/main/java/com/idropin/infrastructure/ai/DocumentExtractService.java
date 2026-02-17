package com.idropin.infrastructure.ai;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class DocumentExtractService {

    private static final int MAX_CHARS = 4000;
    private static final int HEAD_CHARS = 3000;
    private static final int TAIL_CHARS = 1000;

    public String extractText(InputStream inputStream, String mimeType) {
        if (inputStream == null || mimeType == null) return "";
        try {
            String raw = switch (mimeType) {
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> extractDocx(inputStream);
                case "application/pdf" -> extractPdf(inputStream);
                case "text/plain", "text/csv", "text/markdown" -> extractPlainText(inputStream);
                default -> "";
            };
            return truncate(normalize(raw));
        } catch (Exception e) {
            log.warn("Failed to extract text from document (mimeType={}): {}", mimeType, e.getMessage());
            return "";
        }
    }

    private String extractDocx(InputStream is) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(is)) {
            StringBuilder sb = new StringBuilder();
            for (XWPFParagraph p : doc.getParagraphs()) {
                sb.append(p.getText()).append('\n');
            }
            return sb.toString();
        }
    }

    private String extractPdf(InputStream is) throws IOException {
        try (PDDocument doc = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    private String extractPlainText(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            char[] buf = new char[4096];
            int read;
            while ((read = reader.read(buf)) != -1) {
                sb.append(buf, 0, read);
                if (sb.length() > MAX_CHARS * 2) break;
            }
        }
        return sb.toString();
    }

    private String normalize(String text) {
        if (text == null || text.isEmpty()) return text;
        return text.replaceAll("\\s+", " ").trim();
    }

    private String truncate(String text) {
        if (text == null || text.length() <= MAX_CHARS) return text;
        return text.substring(0, HEAD_CHARS) + "\n...[truncated]...\n" + text.substring(text.length() - TAIL_CHARS);
    }
}

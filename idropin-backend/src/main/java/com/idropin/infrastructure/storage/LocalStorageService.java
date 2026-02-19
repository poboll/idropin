package com.idropin.infrastructure.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.io.*;
import java.nio.file.*;
import java.util.List;

@Slf4j
public class LocalStorageService implements StorageService {

    private final String basePath;
    private final String baseUrl;

    public LocalStorageService(String basePath, String baseUrl) {
        this.basePath = basePath;
        this.baseUrl = baseUrl;
    }

    public void init() {
        try {
            Files.createDirectories(Paths.get(basePath));
            log.info("Local storage initialized at: {}", basePath);
        } catch (IOException e) {
            log.error("Failed to create storage directory", e);
        }
    }

    @Override
    public String uploadFile(String path, InputStream inputStream, String contentType, long size) {
        try {
            Path filePath = Paths.get(basePath, path);
            Files.createDirectories(filePath.getParent());
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("File saved to: {}", filePath);
            return getFileUrl(path);
        } catch (IOException e) {
            throw new RuntimeException("文件保存失败: " + e.getMessage(), e);
        }
    }

    @Override
    public InputStream downloadFile(String path) {
        try {
            return Files.newInputStream(Paths.get(basePath, path));
        } catch (IOException e) {
            throw new RuntimeException("文件读取失败: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String path) {
        try {
            Files.deleteIfExists(Paths.get(basePath, path));
        } catch (IOException e) {
            log.error("Failed to delete file: {}", path, e);
        }
    }

    @Override
    public void deleteFiles(List<String> paths) {
        paths.forEach(this::deleteFile);
    }

    @Override
    public String getFileUrl(String path) {
        String dynamicBaseUrl = getDynamicBaseUrl();
        return dynamicBaseUrl + "/" + path;
    }
    
    private String getDynamicBaseUrl() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                
                String scheme = getHeaderOrDefault(request, "X-Forwarded-Proto", request.getScheme());
                String serverName = getHeaderOrDefault(request, "X-Forwarded-Host", request.getServerName());
                String portHeader = request.getHeader("X-Forwarded-Port");
                int serverPort = portHeader != null ? Integer.parseInt(portHeader) : request.getServerPort();
                String contextPath = request.getContextPath();
                
                StringBuilder url = new StringBuilder();
                url.append(scheme).append("://").append(serverName);
                
                if ((scheme.equals("http") && serverPort != 80) || 
                    (scheme.equals("https") && serverPort != 443)) {
                    url.append(":").append(serverPort);
                }
                
                url.append(contextPath).append("/files/download");
                return url.toString();
            }
        } catch (Exception e) {
            log.warn("Failed to get dynamic base URL, falling back to configured base URL", e);
        }
        return baseUrl;
    }
    
    private String getHeaderOrDefault(HttpServletRequest request, String headerName, String defaultValue) {
        String value = request.getHeader(headerName);
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }

    @Override
    public String getPresignedUrl(String path, int expiry) {
        return getFileUrl(path);  // 本地存储不需要预签名
    }

    @Override
    public boolean fileExists(String path) {
        return Files.exists(Paths.get(basePath, path));
    }

    @Override
    public long getFileSize(String path) {
        try {
            return Files.size(Paths.get(basePath, path));
        } catch (IOException e) {
            return 0;
        }
    }

    @Override
    public String getContentType(String path) {
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".gif")) return "image/gif";
        if (path.endsWith(".pdf")) return "application/pdf";
        if (path.endsWith(".txt")) return "text/plain";
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".mp4")) return "video/mp4";
        if (path.endsWith(".mp3")) return "audio/mpeg";
        if (path.endsWith(".doc")) return "application/msword";
        if (path.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (path.endsWith(".xls")) return "application/vnd.ms-excel";
        if (path.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (path.endsWith(".zip")) return "application/zip";
        return "application/octet-stream";
    }
}

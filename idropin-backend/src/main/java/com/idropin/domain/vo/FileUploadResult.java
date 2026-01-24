package com.idropin.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文件上传结果
 *
 * @author Idrop.in Team
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResult {

    /**
     * 原始文件名
     */
    private String filename;

    /**
     * 是否成功
     */
    private Boolean success;

    /**
     * 文件信息（成功时）
     */
    private FileVO file;

    /**
     * 错误信息（失败时）
     */
    private String errorMessage;

    /**
     * 创建成功结果
     */
    public static FileUploadResult success(String filename, FileVO file) {
        return FileUploadResult.builder()
                .filename(filename)
                .success(true)
                .file(file)
                .build();
    }

    /**
     * 创建失败结果
     */
    public static FileUploadResult failure(String filename, String errorMessage) {
        return FileUploadResult.builder()
                .filename(filename)
                .success(false)
                .errorMessage(errorMessage)
                .build();
    }
}

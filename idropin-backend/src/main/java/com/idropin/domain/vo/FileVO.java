package com.idropin.domain.vo;

import com.idropin.domain.entity.File;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * 文件视图对象
 *
 * @author Idrop.in Team
 */
@Data
public class FileVO {

    private String id;
    private String name;
    private String originalName;
    private Long fileSize;
    private String mimeType;
    private String url;
    private String thumbnailUrl;
    private List<String> tags;
    private String categoryId;
    private String categoryName;
    private String status;
    private LocalDateTime createdAt;

    /**
     * 从实体转换为VO
     */
    public static FileVO fromEntity(File file, String url) {
        FileVO vo = new FileVO();
        vo.setId(file.getId());
        vo.setName(file.getName());
        vo.setOriginalName(file.getOriginalName());
        vo.setFileSize(file.getFileSize());
        vo.setMimeType(file.getMimeType());
        vo.setUrl(url);
        vo.setTags(file.getTags() != null ? Arrays.asList(file.getTags()) : Collections.emptyList());
        vo.setCategoryId(file.getCategoryId());
        vo.setStatus(file.getStatus());
        vo.setCreatedAt(file.getCreatedAt());
        return vo;
    }
}

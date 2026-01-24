package com.idropin.domain.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

/**
 * 文件查询请求
 *
 * @author Idrop.in Team
 */
@Data
public class FileQueryRequest {

    /**
     * 页码（从0开始）
     */
    private Integer page = 0;

    /**
     * 每页大小
     */
    private Integer size = 20;

    /**
     * 分类ID
     */
    private UUID categoryId;

    /**
     * 标签列表
     */
    private List<String> tags;

    /**
     * 搜索关键字
     */
    private String keyword;

    /**
     * 排序字段（createdAt, fileSize, name）
     */
    private String sortBy = "createdAt";

    /**
     * 排序方向（asc, desc）
     */
    private String sortOrder = "desc";
}

package com.idropin.domain.dto;

import lombok.Data;
import java.util.List;

/**
 * 文件更新请求
 *
 * @author Idrop.in Team
 */
@Data
public class FileUpdateRequest {

    /**
     * 文件名
     */
    private String name;

    /**
     * 分类ID
     */
    private String categoryId;

    /**
     * 标签列表
     */
    private List<String> tags;

    /**
     * 元数据（JSON字符串）
     */
    private String metadata;
}

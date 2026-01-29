package com.idropin.domain.dto;

import lombok.Data;
import jakarta.validation.constraints.Min;

/**
 * 更新用户配额请求
 *
 * @author Idrop.in Team
 */
@Data
public class UpdateQuotaRequest {
    
    /**
     * 存储配额(字节)
     */
    @Min(value = 0, message = "存储配额不能为负数")
    private Long storageLimit;
    
    /**
     * 任务数量限制
     */
    @Min(value = 0, message = "任务限制不能为负数")
    private Integer taskLimit;
}

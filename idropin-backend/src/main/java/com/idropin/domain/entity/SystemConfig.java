package com.idropin.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_system_config")
public class SystemConfig {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String configKey;

    private String configValue;

    private String configType;

    private String description;

    private Boolean isEnabled;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}

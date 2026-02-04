package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.CollectionTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 收集任务Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface CollectionTaskMapper extends BaseMapper<CollectionTask> {
    
    /**
     * 根据ID查询任务（使用XML定义，明确指定VARCHAR类型避免UUID类型问题）
     */
    CollectionTask selectByIdString(@Param("id") String id);

    /**
     * 根据创建者ID查询任务列表
     */
    java.util.List<CollectionTask> selectByCreatedBy(@Param("createdBy") String createdBy);

    /**
     * 获取回收站任务列表（仅 deleted=true）
     *
     * NOTE: 不能用 BaseMapper.selectList，因为会生成包含不存在列的 SELECT（例如 limit_one_per_device）。
     */
    java.util.List<CollectionTask> selectDeletedByCreatedBy(@Param("createdBy") String createdBy);

    /**
     * 软删除：移动到回收站（deleted=true）
     */
    int softDeleteByIdAndCreatedBy(@Param("id") String id, @Param("createdBy") String createdBy);

    /**
     * 从回收站恢复（deleted=false）
     */
    int restoreByIdAndCreatedBy(@Param("id") String id, @Param("createdBy") String createdBy);

    /**
     * 永久删除（物理删除）
     */
    int deletePermanentlyByIdAndCreatedBy(@Param("id") String id, @Param("createdBy") String createdBy);
}

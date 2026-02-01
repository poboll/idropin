package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FileSubmission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 文件提交记录Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface FileSubmissionMapper extends BaseMapper<FileSubmission> {
    
    /**
     * 根据任务ID和提交者姓名查询提交记录
     */
    List<FileSubmission> findByTaskIdAndSubmitterName(@Param("taskId") String taskId, @Param("submitterName") String submitterName);
}

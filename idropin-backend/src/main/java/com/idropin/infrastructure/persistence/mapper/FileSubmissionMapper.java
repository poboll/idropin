package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FileSubmission;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文件提交记录Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface FileSubmissionMapper extends BaseMapper<FileSubmission> {
}

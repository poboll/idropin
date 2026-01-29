package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.domain.entity.OperationLog;
import com.idropin.domain.vo.OperationLogVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 操作日志Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface OperationLogMapper extends BaseMapper<OperationLog> {
    
    /**
     * 分页查询操作日志
     */
    IPage<OperationLogVO> selectLogPage(Page<OperationLogVO> page);
    
    /**
     * 获取日志数量
     */
    Long countLogs();
    
    /**
     * 获取昨日新增日志数量
     */
    Long countLogsYesterday();
}

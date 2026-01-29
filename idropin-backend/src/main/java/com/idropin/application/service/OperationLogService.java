package com.idropin.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.idropin.domain.vo.OperationLogVO;

/**
 * 操作日志服务接口
 *
 * @author Idrop.in Team
 */
public interface OperationLogService {
    
    /**
     * 记录操作日志
     *
     * @param operatorId 操作者ID
     * @param operationType 操作类型
     * @param targetType 目标类型
     * @param targetId 目标ID
     * @param description 描述
     * @param ipAddress IP地址
     */
    void log(String operatorId, String operationType, String targetType, String targetId, String description, String ipAddress);
    
    /**
     * 分页查询操作日志
     *
     * @param page 页码
     * @param size 每页大小
     * @return 日志分页列表
     */
    IPage<OperationLogVO> getLogs(Integer page, Integer size);
    
    /**
     * 获取日志数量
     */
    Long countLogs();
    
    /**
     * 获取昨日新增日志数量
     */
    Long countLogsYesterday();
}

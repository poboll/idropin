package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.application.service.OperationLogService;
import com.idropin.domain.entity.OperationLog;
import com.idropin.domain.vo.OperationLogVO;
import com.idropin.infrastructure.persistence.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 操作日志服务实现
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OperationLogServiceImpl implements OperationLogService {

    private final OperationLogMapper operationLogMapper;

    @Override
    @Transactional
    public void log(String operatorId, String operationType, String targetType, String targetId, String description, String ipAddress) {
        OperationLog operationLog = new OperationLog();
        operationLog.setOperatorId(operatorId);
        operationLog.setOperationType(operationType);
        operationLog.setTargetType(targetType);
        operationLog.setTargetId(targetId);
        operationLog.setDescription(description);
        operationLog.setIpAddress(ipAddress);
        operationLog.setCreatedAt(LocalDateTime.now());
        operationLogMapper.insert(operationLog);
    }

    @Override
    public IPage<OperationLogVO> getLogs(Integer page, Integer size) {
        Page<OperationLogVO> pageParam = new Page<>(page, size);
        return operationLogMapper.selectLogPage(pageParam);
    }

    @Override
    public Long countLogs() {
        return operationLogMapper.countLogs();
    }

    @Override
    public Long countLogsYesterday() {
        return operationLogMapper.countLogsYesterday();
    }
}

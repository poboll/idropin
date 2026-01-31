package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.AccessLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 访问日志Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface AccessLogMapper extends BaseMapper<AccessLog> {

    /**
     * 统计今日PV（页面访问量）
     */
    @Select("SELECT COUNT(*) FROM sys_access_log WHERE DATE(created_at) = CURRENT_DATE")
    Long countTodayPV();

    /**
     * 统计今日UV（独立访客数）- 基于session_id
     */
    @Select("SELECT COUNT(DISTINCT session_id) FROM sys_access_log WHERE DATE(created_at) = CURRENT_DATE")
    Long countTodayUV();

    /**
     * 统计历史总PV
     */
    @Select("SELECT COUNT(*) FROM sys_access_log")
    Long countTotalPV();

    /**
     * 统计历史总UV - 基于session_id
     */
    @Select("SELECT COUNT(DISTINCT session_id) FROM sys_access_log")
    Long countTotalUV();

    /**
     * 统计昨日PV
     */
    @Select("SELECT COUNT(*) FROM sys_access_log WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'")
    Long countYesterdayPV();

    /**
     * 统计昨日UV
     */
    @Select("SELECT COUNT(DISTINCT session_id) FROM sys_access_log WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'")
    Long countYesterdayUV();

    /**
     * 检查会话是否在指定时间内访问过
     */
    @Select("SELECT COUNT(*) > 0 FROM sys_access_log WHERE session_id = #{sessionId} AND created_at >= #{since}")
    boolean hasRecentAccess(@Param("sessionId") String sessionId, @Param("since") java.time.LocalDateTime since);
}

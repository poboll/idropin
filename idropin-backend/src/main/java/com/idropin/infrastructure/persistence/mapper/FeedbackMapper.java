package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.domain.entity.Feedback;
import com.idropin.domain.vo.FeedbackVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 反馈Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface FeedbackMapper extends BaseMapper<Feedback> {
    
    /**
     * 分页查询用户反馈
     */
    IPage<FeedbackVO> selectUserFeedbackPage(Page<FeedbackVO> page, @Param("userId") String userId);
    
    /**
     * 分页查询所有反馈（管理员）
     */
    IPage<FeedbackVO> selectAllFeedbackPage(Page<FeedbackVO> page, @Param("status") String status);
}

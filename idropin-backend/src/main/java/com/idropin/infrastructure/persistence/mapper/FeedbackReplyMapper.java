package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.idropin.domain.entity.FeedbackReply;
import com.idropin.domain.vo.FeedbackReplyVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 反馈回复Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface FeedbackReplyMapper extends BaseMapper<FeedbackReply> {
    
    /**
     * 查询反馈的所有回复
     */
    List<FeedbackReplyVO> selectRepliesByFeedbackId(@Param("feedbackId") String feedbackId);
}

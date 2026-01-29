package com.idropin.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.idropin.domain.entity.Message;
import com.idropin.domain.vo.MessageVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 消息Mapper
 *
 * @author Idrop.in Team
 */
@Mapper
public interface MessageMapper extends BaseMapper<Message> {
    
    /**
     * 分页查询用户消息
     */
    IPage<MessageVO> selectMessagePage(
        Page<MessageVO> page,
        @Param("recipientId") String recipientId,
        @Param("unreadOnly") Boolean unreadOnly
    );
    
    /**
     * 获取未读消息数量
     */
    Integer countUnread(@Param("recipientId") String recipientId);
    
    /**
     * 标记所有消息为已读
     */
    int markAllAsRead(@Param("recipientId") String recipientId);
}

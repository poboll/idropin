package com.idropin.interfaces.websocket;

import com.idropin.application.service.StatisticsService;
import com.idropin.domain.vo.FileStatisticsVO;
import com.idropin.infrastructure.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

/**
 * 统计数据WebSocket控制器
 *
 * @author Idrop.in Team
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class StatisticsWebSocketController {

  private final StatisticsService statisticsService;
  private final SimpMessagingTemplate messagingTemplate;

  /**
   * 处理客户端请求统计数据
   */
  @MessageMapping("/statistics/request")
  @SendTo("/topic/statistics")
  public FileStatisticsVO requestStatistics(Authentication authentication) {
    try {
      if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUserId();
        return statisticsService.getFileStatistics(userId);
      }
      return null;
    } catch (Exception e) {
      log.error("Failed to get statistics", e);
      return null;
    }
  }

  /**
   * 定时推送统计数据（每30秒）
   */
  @Scheduled(fixedRate = 30000)
  public void broadcastStatistics() {
    try {
      FileStatisticsVO systemStats = statisticsService.getSystemStatistics();
      messagingTemplate.convertAndSend("/topic/statistics/system", systemStats);
      log.debug("Broadcasted system statistics");
    } catch (Exception e) {
      log.error("Failed to broadcast statistics", e);
    }
  }

  /**
   * 推送用户统计数据
   */
  public void sendUserStatistics(String userId) {
    try {
      FileStatisticsVO userStats = statisticsService.getFileStatistics(userId);
      messagingTemplate.convertAndSendToUser(
          userId,
          "/queue/statistics",
          userStats
      );
    } catch (Exception e) {
      log.error("Failed to send user statistics to user: {}", userId, e);
    }
  }
}

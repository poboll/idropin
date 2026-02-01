package com.idropin.application.service;

import com.idropin.domain.dto.CreateShareRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileShare;
import com.idropin.domain.vo.ShareInfoVO;

import java.util.List;

/**
 * 文件分享服务接口
 *
 * @author Idrop.in Team
 */
public interface FileShareService {

  /**
   * 获取分享信息（不需要密码）
   */
  ShareInfoVO getShareInfo(String shareCode);

  /**
   * 创建文件分享
   */
  FileShare createShare(CreateShareRequest request, String userId);

  /**
   * 获取用户的分享列表
   */
  List<FileShare> getUserShares(String userId);

  /**
   * 访问分享链接
   */
  File accessShare(String shareCode, String password);

  /**
   * 获取分享详情
   */
  FileShare getShare(String shareId, String userId);

  /**
   * 更新分享设置
   */
  FileShare updateShare(String shareId, CreateShareRequest request, String userId);

  /**
   * 取消分享
   */
  void cancelShare(String shareId, String userId);
}

package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.idropin.application.service.FileShareService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.CreateShareRequest;
import com.idropin.domain.entity.CollectionTask;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileShare;
import com.idropin.domain.entity.FileSubmission;
import com.idropin.domain.entity.User;
import com.idropin.domain.vo.ShareInfoVO;
import com.idropin.infrastructure.persistence.mapper.CollectionTaskMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.persistence.mapper.FileShareMapper;
import com.idropin.infrastructure.persistence.mapper.FileSubmissionMapper;
import com.idropin.infrastructure.persistence.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 文件分享服务实现类
 *
 * @author Idrop.in Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileShareServiceImpl implements FileShareService {

  private final FileShareMapper shareMapper;
  private final FileMapper fileMapper;
  private final UserMapper userMapper;
  private final FileSubmissionMapper fileSubmissionMapper;
  private final CollectionTaskMapper collectionTaskMapper;

  @Override
  public ShareInfoVO getShareInfo(String shareCode) {
    FileShare share = shareMapper.findByShareCode(shareCode);
    if (share == null) {
      throw new BusinessException("分享不存在");
    }

    if (share.getExpireAt() != null && share.getExpireAt().isBefore(LocalDateTime.now())) {
      throw new BusinessException("分享已过期");
    }

    if (share.getDownloadLimit() != null && share.getDownloadCount() >= share.getDownloadLimit()) {
      throw new BusinessException("下载次数已用完");
    }

    File file = fileMapper.selectById(share.getFileId());
    if (file == null) {
      throw new BusinessException("文件不存在");
    }

    ShareInfoVO info = new ShareInfoVO();
    info.setShareCode(share.getShareCode());
    info.setFileName(file.getOriginalName());
    info.setFileSize(file.getFileSize());
    info.setFileType(file.getMimeType());
    info.setHasPassword(share.getPassword() != null && !share.getPassword().isEmpty());
    info.setExpireAt(share.getExpireAt());
    info.setDownloadLimit(share.getDownloadLimit());
    info.setDownloadCount(share.getDownloadCount());
    
    // 获取创建者用户名 - 规范化UUID格式（移除连字符）
    String normalizedCreatedBy = share.getCreatedBy() != null ? share.getCreatedBy().replace("-", "") : null;
    if (normalizedCreatedBy != null) {
      User creator = userMapper.findById(normalizedCreatedBy);
      if (creator != null) {
        info.setCreatorUsername(creator.getUsername());
      }
    }

    return info;
  }

  @Override
  @Transactional
  public FileShare createShare(CreateShareRequest request, String userId) {
    File file = fileMapper.selectById(request.getFileId());
    if (file == null) {
      throw new BusinessException("文件不存在");
    }

    // 规范化UUID格式进行比较（移除连字符）
    String normalizedUploaderId = file.getUploaderId() != null ? file.getUploaderId().replace("-", "") : "";
    String normalizedUserId = userId != null ? userId.replace("-", "") : "";
    
    // 检查权限：用户是上传者 或 用户是该文件所属任务的创建者
    boolean hasPermission = normalizedUploaderId.equals(normalizedUserId);
    
    if (!hasPermission) {
      // 检查用户是否是该文件所属任务的创建者
      hasPermission = isTaskOwnerOfFile(file.getId(), normalizedUserId);
    }
    
    if (!hasPermission) {
      throw new BusinessException("无权限分享此文件");
    }

    // Check if share already exists for this file by this user
    List<FileShare> existingShares = shareMapper.selectByCreatedBy(userId);
    boolean shareExists = existingShares.stream()
        .anyMatch(share -> share.getFileId().equals(file.getId()));
    
    if (shareExists) {
      throw new BusinessException("该文件已存在分享");
    }

    String shareCode = generateShareCode();

    FileShare share = new FileShare();
    share.setFileId(file.getId());
    share.setShareCode(shareCode);
    share.setPassword(request.getPassword());
    share.setExpireAt(request.getExpireAt());
    share.setDownloadLimit(request.getDownloadLimit());
    share.setDownloadCount(0);
    share.setCreatedBy(userId);
    share.setCreatedAt(LocalDateTime.now());

    shareMapper.insert(share);
    log.info("File share created: {} for file {} by user {}", shareCode, file.getId(), userId);

    return share;
  }

  @Override
  public File accessShare(String shareCode, String password) {
    FileShare share = shareMapper.findByShareCode(shareCode);
    if (share == null) {
      throw new BusinessException("分享不存在");
    }

    if (share.getPassword() != null && !share.getPassword().equals(password)) {
      throw new BusinessException("密码错误");
    }

    if (share.getExpireAt() != null && share.getExpireAt().isBefore(LocalDateTime.now())) {
      throw new BusinessException("分享已过期");
    }

    if (share.getDownloadLimit() != null && share.getDownloadCount() >= share.getDownloadLimit()) {
      throw new BusinessException("下载次数已用完");
    }

    share.setDownloadCount(share.getDownloadCount() + 1);
    // Avoid MyBatis-Plus updateById (uuid=varchar) by using an explicit CAST update.
    shareMapper.updateDownloadCountById(share.getId(), share.getDownloadCount());

    File file = fileMapper.selectById(share.getFileId());
    if (file == null) {
      throw new BusinessException("文件不存在");
    }

    return file;
  }

  @Override
  public FileShare getShare(String shareId, String userId) {
    FileShare share = shareMapper.selectByIdString(shareId);
    if (share == null) {
      throw new BusinessException("分享不存在");
    }
    if (!share.getCreatedBy().equals(userId)) {
      throw new BusinessException("无权限访问此分享");
    }
    return share;
  }

  @Override
  public List<FileShare> getUserShares(String userId) {
    return shareMapper.selectByCreatedBy(userId);
  }

  @Override
  @Transactional
  public FileShare updateShare(String shareId, CreateShareRequest request, String userId) {
    FileShare share = getShare(shareId, userId);

    if (request.getPassword() != null) {
      share.setPassword(request.getPassword());
    }
    if (request.getExpireAt() != null) {
      share.setExpireAt(request.getExpireAt());
    }
    if (request.getDownloadLimit() != null) {
      share.setDownloadLimit(request.getDownloadLimit());
    }

    shareMapper.updateShareSettingsById(
        share.getId(),
        share.getPassword(),
        share.getExpireAt(),
        share.getDownloadLimit(),
        share.getDownloadCount());
    log.info("File share updated: {} by user {}", shareId, userId);

    return share;
  }

  @Override
  @Transactional
  public void cancelShare(String shareId, String userId) {
    FileShare share = getShare(shareId, userId);
    shareMapper.deleteByIdString(share.getId());
    log.info("File share cancelled: {} by user {}", shareId, userId);
  }

  private String generateShareCode() {
    String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    SecureRandom random = new SecureRandom();
    StringBuilder code = new StringBuilder(8);
    for (int i = 0; i < 8; i++) {
      code.append(chars.charAt(random.nextInt(chars.length())));
    }
    return code.toString();
  }

  private boolean isTaskOwnerOfFile(String fileId, String normalizedUserId) {
    LambdaQueryWrapper<FileSubmission> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(FileSubmission::getFileId, fileId);
    List<FileSubmission> submissions = fileSubmissionMapper.selectList(wrapper);
    
    for (FileSubmission submission : submissions) {
      if (submission.getTaskId() != null) {
        CollectionTask task = collectionTaskMapper.selectByIdString(submission.getTaskId());
        if (task != null && task.getCreatedBy() != null) {
          String normalizedCreatedBy = task.getCreatedBy().replace("-", "");
          if (normalizedCreatedBy.equals(normalizedUserId)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

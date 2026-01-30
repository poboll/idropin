package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.idropin.application.service.FileShareService;
import com.idropin.common.exception.BusinessException;
import com.idropin.domain.dto.CreateShareRequest;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileShare;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.persistence.mapper.FileShareMapper;
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

  @Override
  @Transactional
  public FileShare createShare(CreateShareRequest request, String userId) {
    File file = fileMapper.selectById(request.getFileId());
    if (file == null) {
      throw new BusinessException("文件不存在");
    }

    if (!file.getUploaderId().equals(userId)) {
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
    shareMapper.updateById(share);

    File file = fileMapper.selectById(share.getFileId());
    if (file == null) {
      throw new BusinessException("文件不存在");
    }

    return file;
  }

  @Override
  public FileShare getShare(String shareId, String userId) {
    FileShare share = shareMapper.selectById(shareId);
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

    shareMapper.updateById(share);
    log.info("File share updated: {} by user {}", shareId, userId);

    return share;
  }

  @Override
  @Transactional
  public void cancelShare(String shareId, String userId) {
    FileShare share = getShare(shareId, userId);
    shareMapper.deleteById(shareId);
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
}

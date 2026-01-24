package com.idropin.common.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 统一响应状态码
 *
 * @author Idrop.in Team
 */
@Getter
@AllArgsConstructor
public enum ResultCode {

  // 成功
  SUCCESS(200, "操作成功"),

  // 通用错误
  ERROR(500, "操作失败"),

  // 客户端错误 4xx
  BAD_REQUEST(400, "请求参数错误"),
  UNAUTHORIZED(401, "未授权，请先登录"),
  FORBIDDEN(403, "无访问权限"),
  NOT_FOUND(404, "资源不存在"),
  METHOD_NOT_ALLOWED(405, "请求方法不支持"),
  CONFLICT(409, "资源冲突"),
  UNPROCESSABLE_ENTITY(422, "无法处理的实体"),
  TOO_MANY_REQUESTS(429, "请求过于频繁"),

  // 服务端错误 5xx
  INTERNAL_SERVER_ERROR(500, "服务器内部错误"),
  SERVICE_UNAVAILABLE(503, "服务暂不可用"),

  // 业务错误 1000-1999
  USER_NOT_FOUND(1001, "用户不存在"),
  USER_ALREADY_EXISTS(1002, "用户已存在"),
  PASSWORD_ERROR(1003, "密码错误"),
  TOKEN_INVALID(1004, "Token无效"),
  TOKEN_EXPIRED(1005, "Token已过期"),

  // 文件相关错误 2000-2999
  FILE_NOT_FOUND(2001, "文件不存在"),
  FILE_UPLOAD_FAILED(2002, "文件上传失败"),
  FILE_DOWNLOAD_FAILED(2003, "文件下载失败"),
  FILE_SIZE_EXCEEDED(2004, "文件大小超出限制"),
  FILE_TYPE_NOT_ALLOWED(2005, "文件类型不允许"),
  FILE_DELETE_FAILED(2006, "文件删除失败"),

  // 收集任务相关错误 3000-3999
  TASK_NOT_FOUND(3001, "收集任务不存在"),
  TASK_CLOSED(3002, "收集任务已关闭"),
  TASK_EXPIRED(3003, "收集任务已过期"),
  TASK_SUBMISSION_FAILED(3004, "文件提交失败"),

  // 分享相关错误 4000-4999
  SHARE_NOT_FOUND(4001, "分享不存在"),
  SHARE_PASSWORD_ERROR(4002, "分享密码错误"),
  SHARE_EXPIRED(4003, "分享已过期"),
  SHARE_DOWNLOAD_LIMIT_EXCEEDED(4004, "下载次数已用完"),

  // AI相关错误 5000-5999
  AI_CLASSIFICATION_FAILED(5001, "AI分类失败"),
  AI_CONTENT_MODERATION_FAILED(5002, "内容审核失败"),

  // 搜索相关错误 6000-6999
  SEARCH_FAILED(6001, "搜索失败"),
  INDEX_FAILED(6002, "索引创建失败");

  private final int code;
  private final String message;
}

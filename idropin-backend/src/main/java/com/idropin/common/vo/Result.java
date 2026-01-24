package com.idropin.common.vo;

import com.idropin.common.constant.ResultCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 统一响应结果
 *
 * @author Idrop.in Team
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> implements Serializable {

  private static final long serialVersionUID = 1L;

  /**
   * 状态码
   */
  private Integer code;

  /**
   * 响应消息
   */
  private String message;

  /**
   * 响应数据
   */
  private T data;

  /**
   * 时间戳
   */
  private Long timestamp;

  public Result(Integer code, String message) {
    this.code = code;
    this.message = message;
    this.timestamp = System.currentTimeMillis();
  }

  public Result(Integer code, String message, T data) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = System.currentTimeMillis();
  }

  /**
   * 成功响应
   */
  public static <T> Result<T> success() {
    return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage());
  }

  public static <T> Result<T> success(T data) {
    return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
  }

  public static <T> Result<T> success(String message, T data) {
    return new Result<>(ResultCode.SUCCESS.getCode(), message, data);
  }

  /**
   * 失败响应
   */
  public static <T> Result<T> error(Integer code, String message) {
    return new Result<>(code, message);
  }

  public static <T> Result<T> error(Integer code, String message, T data) {
    return new Result<>(code, message, data);
  }

  public static <T> Result<T> error(ResultCode resultCode) {
    return new Result<>(resultCode.getCode(), resultCode.getMessage());
  }

  public static <T> Result<T> error(ResultCode resultCode, String message) {
    return new Result<>(resultCode.getCode(), message);
  }

  /**
   * 失败响应（仅消息）
   */
  public static <T> Result<T> error(String message) {
    return new Result<>(ResultCode.ERROR.getCode(), message);
  }
}

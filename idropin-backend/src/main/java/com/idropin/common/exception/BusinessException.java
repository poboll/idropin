package com.idropin.common.exception;

import com.idropin.common.constant.ResultCode;
import lombok.Getter;

/**
 * 业务异常
 *
 * @author Idrop.in Team
 */
@Getter
public class BusinessException extends RuntimeException {

  private final Integer code;

  public BusinessException(String message) {
    super(message);
    this.code = 500;
  }

  public BusinessException(Integer code, String message) {
    super(message);
    this.code = code;
  }

  public BusinessException(ResultCode resultCode) {
    super(resultCode.getMessage());
    this.code = resultCode.getCode();
  }

  public BusinessException(ResultCode resultCode, String message) {
    super(message);
    this.code = resultCode.getCode();
  }
}

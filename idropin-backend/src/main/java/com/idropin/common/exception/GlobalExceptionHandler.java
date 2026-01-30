package com.idropin.common.exception;

import com.idropin.common.vo.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 *
 * @author Idrop.in Team
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  /**
   * 业务异常
   */
  @ExceptionHandler(BusinessException.class)
  @ResponseStatus(HttpStatus.OK)
  public Result<?> handleBusinessException(BusinessException e) {
    log.error("业务异常: {}", e.getMessage());
    return Result.error(e.getCode(), e.getMessage());
  }

  /**
   * 参数校验异常
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Result<?> handleValidationException(MethodArgumentNotValidException e) {
    Map<String, String> errors = new HashMap<>();
    e.getBindingResult().getAllErrors().forEach(error -> {
      String fieldName = ((FieldError) error).getField();
      String errorMessage = error.getDefaultMessage();
      errors.put(fieldName, errorMessage);
    });
    log.error("参数校验异常: {}", errors);
    return Result.error(400, "参数校验失败", errors);
  }

  /**
   * 访问拒绝异常
   */
  @ExceptionHandler(AccessDeniedException.class)
  @ResponseStatus(HttpStatus.FORBIDDEN)
  public Result<?> handleAccessDeniedException(AccessDeniedException e) {
    log.error("访问拒绝: {}", e.getMessage());
    return Result.error(403, "无访问权限");
  }

  /**
   * 运行时异常
   */
  @ExceptionHandler(RuntimeException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public Result<?> handleRuntimeException(RuntimeException e) {
    log.error("运行时异常: ", e);
    String message = e.getMessage() != null ? e.getMessage() : "服务器内部错误";
    return Result.error(500, message);
  }

  /**
   * 其他异常
   */
  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public Result<?> handleException(Exception e) {
    log.error("未知异常: ", e);
    String message = e.getMessage() != null ? e.getMessage() : "未知错误";
    return Result.error(500, message);
  }
}

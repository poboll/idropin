package com.idropin.domain.dto;

import com.idropin.domain.vo.UserVO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应DTO
 *
 * @author Idrop.in Team
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private UserVO user;
}

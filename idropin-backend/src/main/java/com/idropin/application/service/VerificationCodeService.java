package com.idropin.application.service;

public interface VerificationCodeService {
    
    void sendEmailCode(String email, String purpose);
    
    void sendSmsCode(String phone, String purpose);
    
    boolean verifyCode(String target, String code, String purpose);
    
    void invalidateCode(String target, String purpose);
}

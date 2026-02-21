package com.idropin.application.service;

public interface AiGradingService {

    void processSubmission(String submissionId);

    void regradeSubmission(String submissionId, String customPrompt);

    int retryAllPending();
}

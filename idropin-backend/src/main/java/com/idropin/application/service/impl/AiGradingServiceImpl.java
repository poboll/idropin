package com.idropin.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.idropin.application.service.AiGradingService;
import com.idropin.application.service.ConfigService;
import com.idropin.domain.entity.CollectionTask;
import com.idropin.domain.entity.File;
import com.idropin.domain.entity.FileSubmission;
import com.idropin.domain.vo.AiEvaluationResult;
import com.idropin.infrastructure.ai.AiClientService;
import com.idropin.infrastructure.ai.DocumentExtractService;
import com.idropin.infrastructure.persistence.mapper.CollectionTaskMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.persistence.mapper.FileSubmissionMapper;
import com.idropin.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiGradingServiceImpl implements AiGradingService {

    private static final int AI_STATUS_PENDING = 0;
    private static final int AI_STATUS_PROCESSING = 1;
    private static final int AI_STATUS_COMPLETED = 2;
    private static final int AI_STATUS_FAILED = -1;

    private final FileSubmissionMapper submissionMapper;
    private final FileMapper fileMapper;
    private final CollectionTaskMapper taskMapper;
    private final StorageService storageService;
    private final DocumentExtractService documentExtractService;
    private final AiClientService aiClientService;
    private final ConfigService configService;

    @Override
    @Transactional
    public void processSubmission(String submissionId) {
        FileSubmission submission = submissionMapper.selectByIdString(submissionId);
        if (submission == null) {
            log.warn("Submission not found: {}", submissionId);
            return;
        }

        if (submission.getAiStatus() != null && submission.getAiStatus() != AI_STATUS_PENDING) {
            log.info("Submission {} already processed (status={}), skipping", submissionId, submission.getAiStatus());
            return;
        }

        doProcess(submission, null);
    }

    @Override
    @Transactional
    public void regradeSubmission(String submissionId, String customPrompt) {
        FileSubmission submission = submissionMapper.selectByIdString(submissionId);
        if (submission == null) {
            log.warn("Submission not found: {}", submissionId);
            return;
        }
        doProcess(submission, customPrompt);
    }

    private void doProcess(FileSubmission submission, String customPrompt) {
        String submissionId = submission.getId();
        updateAiStatus(submissionId, AI_STATUS_PROCESSING);

        try {
            File file = fileMapper.selectById(submission.getFileId());
            if (file == null) {
                log.warn("File not found for submission {}", submissionId);
                updateAiStatus(submissionId, AI_STATUS_FAILED);
                return;
            }

            String text = extractText(file);
            if (text.isBlank()) {
                log.info("No extractable text for submission {}, marking as failed", submissionId);
                updateAiStatus(submissionId, AI_STATUS_FAILED);
                return;
            }

            float[] embedding = aiClientService.generateEmbedding(text);

            boolean plagiarized = checkPlagiarism(submission, embedding);

            if (plagiarized) {
                FileSubmission updateEntity = new FileSubmission();
                updateEntity.setId(submissionId);
                updateEntity.setAiStatus(AI_STATUS_COMPLETED);
                submissionMapper.updateById(updateEntity);                log.info("Submission {} flagged as plagiarized, skipping AI evaluation", submissionId);
                return;
            }

            String taskTitle = getTaskTitle(submission.getTaskId());
            String prompt = customPrompt != null ? customPrompt : getTaskPrompt(submission.getTaskId());
            AiEvaluationResult evaluation = aiClientService.evaluate(text, taskTitle, prompt);

            FileSubmission updateEntity = new FileSubmission();
            updateEntity.setId(submissionId);
            updateEntity.setAiStatus(AI_STATUS_COMPLETED);
            updateEntity.setAiEvaluation(evaluation);
            submissionMapper.updateById(updateEntity);

            log.info("AI grading completed for submission {}: score={}", submissionId, evaluation.getScore());

        } catch (AiClientService.AiServiceException e) {
            log.error("AI service error for submission {}: {}", submissionId, e.getMessage());
            updateAiStatus(submissionId, AI_STATUS_FAILED);
        } catch (Exception e) {
            log.error("Unexpected error processing submission {}", submissionId, e);
            updateAiStatus(submissionId, AI_STATUS_FAILED);
        }
    }

    private String extractText(File file) {
        try (InputStream is = storageService.downloadFile(file.getStoragePath())) {
            return documentExtractService.extractText(is, file.getMimeType());
        } catch (Exception e) {
            log.warn("Failed to extract text from file {}: {}", file.getId(), e.getMessage());
            return "";
        }
    }

    private boolean checkPlagiarism(FileSubmission submission, float[] embedding) {
        String thresholdStr = configService.getSystemConfigValue("ai.plagiarism_threshold");
        double threshold = thresholdStr != null ? Double.parseDouble(thresholdStr) : 0.85;

        List<FileSubmission> similar = submissionMapper.findSimilarByVector(
                submission.getTaskId(), submission.getId(), embedding, threshold, 1
        );

        if (!similar.isEmpty()) {
            FileSubmission match = similar.get(0);
            FileSubmission updateEntity = new FileSubmission();
            updateEntity.setId(submission.getId());
            updateEntity.setIsPlagiarized(true);
            updateEntity.setSimilarToId(match.getId());
            submissionMapper.updateById(updateEntity);
            log.warn("Plagiarism detected: submission {} is similar to {}", submission.getId(), match.getId());
            return true;
        }
        return false;
    }

    private String getTaskTitle(String taskId) {
        try {
            CollectionTask task = taskMapper.selectByIdString(taskId);
            return task != null ? task.getTitle() : taskId;
        } catch (Exception e) {
            return taskId;
        }
    }

    private String getTaskPrompt(String taskId) {
        try {
            CollectionTask task = taskMapper.selectByIdString(taskId);
            return task != null ? task.getAiPrompt() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private void updateAiStatus(String submissionId, int status) {
        LambdaUpdateWrapper<FileSubmission> update = new LambdaUpdateWrapper<>();
        update.eq(FileSubmission::getId, submissionId)
                .set(FileSubmission::getAiStatus, status);
        submissionMapper.update(null, update);
    }

    @Override
    public int retryAllPending() {
        List<FileSubmission> pending = submissionMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<FileSubmission>()
                        .eq(FileSubmission::getAiStatus, AI_STATUS_PENDING)
                        .isNotNull(FileSubmission::getFileId)
        );
        for (FileSubmission s : pending) {
            regradeSubmission(s.getId(), null);
        }
        return pending.size();
    }
}

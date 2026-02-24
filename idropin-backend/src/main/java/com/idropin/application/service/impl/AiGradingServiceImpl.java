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
import com.idropin.infrastructure.email.EmailService;
import com.idropin.interfaces.rest.AiProgressSseController;
import com.idropin.infrastructure.persistence.mapper.CollectionTaskMapper;
import com.idropin.infrastructure.persistence.mapper.FileMapper;
import com.idropin.infrastructure.persistence.mapper.FileSubmissionMapper;
import com.idropin.domain.entity.AiEvaluationHistory;
import com.idropin.infrastructure.persistence.mapper.AiEvaluationHistoryMapper;
import com.idropin.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiGradingServiceImpl implements AiGradingService {

    private static final int AI_STATUS_PENDING    = 0;
    private static final int AI_STATUS_PROCESSING = 1;
    private static final int AI_STATUS_COMPLETED  = 2;
    private static final int AI_STATUS_FAILED     = -1;

    // MIME types from which text can be extracted
    private static final Set<String> SUPPORTED_MIME_TYPES = Set.of(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "application/pdf",
            "text/plain",
            "text/csv",
            "text/markdown"
    );

    private final FileSubmissionMapper submissionMapper;
    private final FileMapper fileMapper;
    private final CollectionTaskMapper taskMapper;
    private final StorageService storageService;
    private final DocumentExtractService documentExtractService;
    private final AiClientService aiClientService;
    private final ConfigService configService;
    private final AiEvaluationHistoryMapper historyMapper;

    @Autowired(required = false)
    private EmailService emailService;

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
        AiProgressSseController.broadcast(submission.getTaskId(), submissionId, AI_STATUS_PROCESSING, null);

        try {
            File file = fileMapper.selectById(submission.getFileId());
            if (file == null) {
                log.warn("File not found for submission {}", submissionId);
                failWithReason(submissionId, "文件不存在，可能已被删除");
                return;
            }

            String mimeType = file.getMimeType();
            // Fallback: if MIME is generic/unknown, infer from file extension
            if (!SUPPORTED_MIME_TYPES.contains(mimeType)) {
                String name = file.getOriginalName() != null ? file.getOriginalName() : file.getName();
                if (name != null) {
                    int dot = name.lastIndexOf('.');
                    String ext = dot >= 0 ? name.substring(dot + 1).toLowerCase() : "";
                    mimeType = switch (ext) {
                        case "doc"  -> "application/msword";
                        case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                        case "pdf"  -> "application/pdf";
                        case "txt"  -> "text/plain";
                        case "csv"  -> "text/csv";
                        case "md"   -> "text/markdown";
                        default     -> mimeType;
                    };
                    if (!ext.isEmpty() && !mimeType.equals(file.getMimeType())) {
                        log.info("MIME fallback: {} -> {} for submission {}", file.getMimeType(), mimeType, submissionId);
                    }
                }
            }
            if (!SUPPORTED_MIME_TYPES.contains(mimeType)) {
                log.info("Unsupported mime type {} for submission {}, skipping AI grading", mimeType, submissionId);
                failWithReason(submissionId, "暂不支持此类文件的 AI 评估（" + mimeType + "）。支持的格式：PDF、Word(.doc/.docx)、纯文本、CSV、Markdown。");
                return;
            }

            String text = extractText(file, mimeType);
            if (text.isBlank()) {
                log.info("No extractable text for submission {}, mime={}", submissionId, mimeType);
                failWithReason(submissionId, "文件内容为空或无法提取文本，请检查文件是否损坏");
                return;
            }

            float[] embedding = aiClientService.generateEmbedding(text);
            saveEmbedding(submissionId, embedding);

            boolean plagiarized = checkPlagiarism(submission, embedding);
            if (plagiarized) {
                FileSubmission updateEntity = new FileSubmission();
                updateEntity.setId(submissionId);
                updateEntity.setAiStatus(AI_STATUS_COMPLETED);
                submissionMapper.updateById(updateEntity);
                log.info("Submission {} flagged as plagiarized, skipping AI evaluation", submissionId);
                return;
            }

            String taskTitle = getTaskTitle(submission.getTaskId());
            String prompt = customPrompt != null ? customPrompt : getTaskPrompt(submission.getTaskId());
            CollectionTask taskEntity = taskMapper.selectByIdString(submission.getTaskId());
            List<java.util.Map<String, Object>> customDims = taskEntity != null ? taskEntity.getCustomDimensions() : null;
            AiEvaluationResult evaluation = aiClientService.evaluate(text, taskTitle, prompt, customDims);

            FileSubmission updateEntity = new FileSubmission();
            updateEntity.setId(submissionId);
            updateEntity.setAiStatus(AI_STATUS_COMPLETED);
            updateEntity.setAiEvaluation(evaluation);
            submissionMapper.updateById(updateEntity);

            try {
                AiEvaluationHistory history = new AiEvaluationHistory();
                history.setSubmissionId(submissionId);
                history.setScore(evaluation.getScore());
                history.setDimensions(evaluation.getDimensions());
                history.setFeedback(evaluation.getFeedback());
                history.setSummary(evaluation.getSummary());
                history.setEvaluatedAt(java.time.LocalDateTime.now());
                historyMapper.insert(history);
            } catch (Exception historyEx) {
                log.warn("Failed to save evaluation history for submission {}: {}", submissionId, historyEx.getMessage());
            }

            log.info("AI grading completed for submission {}: score={}", submissionId, evaluation.getScore());
            AiProgressSseController.broadcast(submission.getTaskId(), submissionId, AI_STATUS_COMPLETED, evaluation.getScore());

            try {
                boolean emailEnabled = "true".equals(configService.getSystemConfigValue("ai.email_notification"));
                if (emailEnabled && emailService != null
                        && submission.getSubmitterEmail() != null && !submission.getSubmitterEmail().isBlank()) {
                    String grade = evaluation.getScore() >= 90 ? "S"
                            : evaluation.getScore() >= 80 ? "A"
                            : evaluation.getScore() >= 70 ? "B"
                            : evaluation.getScore() >= 60 ? "C" : "D";
                    emailService.sendAiGradingNotification(
                            submission.getSubmitterEmail(), taskTitle,
                            submission.getSubmitterName(), evaluation.getScore(), grade);
                    log.info("AI grading notification sent to {} for submission {}", submission.getSubmitterEmail(), submissionId);
                }
            } catch (Exception emailEx) {
                log.warn("Failed to send AI grading notification for submission {}: {}", submissionId, emailEx.getMessage());
            }

        } catch (AiClientService.AiServiceException e) {
            log.error("AI service error for submission {}: {}", submissionId, e.getMessage());
            failWithReason(submissionId, "AI 服务异常：" + e.getMessage());
            AiProgressSseController.broadcast(submission.getTaskId(), submissionId, AI_STATUS_FAILED, null);
        } catch (Exception e) {
            log.error("Unexpected error processing submission {}", submissionId, e);
            failWithReason(submissionId, "评估过程中发生未知错误：" + e.getMessage());
            AiProgressSseController.broadcast(submission.getTaskId(), submissionId, AI_STATUS_FAILED, null);
        }
    }

    /** 标记失败并写入失败原因 */
    private void failWithReason(String submissionId, String reason) {
        AiEvaluationResult errorResult = new AiEvaluationResult();
        errorResult.setError(reason);
        FileSubmission updateEntity = new FileSubmission();
        updateEntity.setId(submissionId);
        updateEntity.setAiStatus(AI_STATUS_FAILED);
        updateEntity.setAiEvaluation(errorResult);
        submissionMapper.updateById(updateEntity);
    }

    private String extractText(File file, String resolvedMimeType) {
        try (InputStream is = storageService.downloadFile(file.getStoragePath())) {
            return documentExtractService.extractText(is, resolvedMimeType);
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

    private void saveEmbedding(String submissionId, float[] embedding) {
        if (embedding == null || embedding.length == 0) return;
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(embedding[i]);
        }
        sb.append(']');
        try {
            submissionMapper.updateReportVector(submissionId, sb.toString());
        } catch (Exception e) {
            log.warn("Failed to save embedding for submission {}: {}", submissionId, e.getMessage());
        }
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

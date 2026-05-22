package com.engipilot.util;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

@Aspect @Component @Slf4j
public class AuditLogger {

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint pjp, Auditable auditable) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            log.info("[AUDIT] {} | user:{} | {}ms",
                auditable.action(),
                SecurityUtils.getCurrentUserId(),
                System.currentTimeMillis() - start);
            return result;
        } catch (Exception e) {
            log.warn("[AUDIT] {} FAILED | user:{} | error:{}",
                auditable.action(), SecurityUtils.getCurrentUserId(), e.getMessage());
            throw e;
        }
    }
}

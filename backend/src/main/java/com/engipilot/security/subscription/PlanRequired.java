package com.engipilot.security.subscription;
import com.engipilot.domain.PlanType;
import java.lang.annotation.*;
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PlanRequired {
    PlanType value() default PlanType.TRIAL;
    String resource() default "";
}

package com.engipilot.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.UUID;

public class SecurityUtils {

    public static UUID getCurrentUserId() {
        var auth = getAuth();
        if (auth == null) return null;
        return UUID.fromString(auth.getName());
    }

    public static UUID getCurrentOrganisationId() {
        var auth = getAuth();
        if (auth == null) return null;
        var details = auth.getDetails();
        if (details instanceof EngipilotUserDetails ud) return ud.getOrganisationId();
        return null;
    }

    public static String getCurrentRole() {
        var auth = getAuth();
        if (auth == null) return null;
        return auth.getAuthorities().stream()
            .findFirst().map(a -> a.getAuthority().replace("ROLE_", "")).orElse(null);
    }

    private static Authentication getAuth() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
}

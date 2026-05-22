package com.engipilot.dto.response;

import com.engipilot.domain.User;
import lombok.Builder;

@Builder
public record AuthResponse(
    String  token,
    String  tokenType,
    UserDTO user
) {
    public static AuthResponse of(String token, User u) {
        return AuthResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .user(UserDTO.from(u))
            .build();
    }
}

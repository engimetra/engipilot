package com.engipilot.dto.response;

import com.engipilot.domain.User;
import lombok.Builder;

import java.util.UUID;

@Builder
public record UserDTO(
    UUID      id,
    String    email,
    String    fullName,
    User.Role role,
    UUID      organisationId
) {
    public static UserDTO from(User u) {
        return UserDTO.builder()
            .id(u.getId())
            .email(u.getEmail())
            .fullName(u.getFullName())
            .role(u.getRole())
            .organisationId(u.getOrganisation().getId())
            .build();
    }
}

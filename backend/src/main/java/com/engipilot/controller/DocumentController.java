package com.engipilot.controller;

import com.engipilot.service.MinioService;
import com.engipilot.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoint d'upload vers MinIO.
 * Retourne uniquement l'URL et le chemin — la persistance en base
 * est gérée côté Next.js via Prisma pour éviter les conflits de schéma.
 */
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final MinioService minioService;

    private static final List<String> TYPES_ACCEPTES = List.of(
        "application/pdf",
        "image/png", "image/jpeg",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip", "application/x-zip-compressed",
        "application/dwg", "application/dxf",
        "application/octet-stream"   // DWG selon les navigateurs
    );

    private static final long TAILLE_MAX = 50L * 1024 * 1024; // 50 Mo

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> upload(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "projectId", required = false) String projectId
    ) {
        String nom = file.getOriginalFilename() != null ? file.getOriginalFilename() : "fichier";
        String contentType = file.getContentType() != null ? file.getContentType() : "";
        String ext = nom.contains(".") ? nom.substring(nom.lastIndexOf('.') + 1).toLowerCase() : "";

        boolean typeValide = TYPES_ACCEPTES.contains(contentType)
            || List.of("dwg", "dxf", "pdf", "png", "jpg", "jpeg", "xlsx", "zip").contains(ext);

        if (!typeValide) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Type de fichier non accepté: " + contentType));
        }

        if (file.getSize() > TAILLE_MAX) {
            return ResponseEntity.status(413)
                .body(Map.of("error", "Fichier trop lourd (max 50 Mo)"));
        }

        UUID orgId = SecurityUtils.getCurrentOrganisationId();
        String orgPart = orgId != null ? orgId.toString() : "shared";
        String projPart = projectId != null ? projectId : "general";
        String path = String.format("plans/%s/%s/%s_%s", orgPart, projPart,
            System.currentTimeMillis(), nom);

        String url = minioService.upload(file, path);

        return ResponseEntity.ok(Map.of(
            "url",  url,
            "path", path,
            "name", nom,
            "size", file.getSize(),
            "mimeType", contentType
        ));
    }
}

package com.engipilot.controller;

import lombok.extern.slf4j.Slf4j;
import net.sf.mpxj.ProjectFile;
import net.sf.mpxj.Task;
import net.sf.mpxj.reader.UniversalProjectReader;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZoneId;
import java.util.*;

/**
 * Parse un fichier MS Project (.mpp, .mpt, .xml) via MPXJ
 * et retourne la liste des tâches en JSON.
 * Aucune persistance en base — la création des tâches est gérée
 * côté Next.js via Prisma.
 */
@RestController
@RequestMapping("/api/v1/ms-project")
@Slf4j
public class MsProjectController {

    @PostMapping("/parse")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> parse(
        @RequestParam("file") MultipartFile file
    ) {
        String nom = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String ext = nom.contains(".") ? nom.substring(nom.lastIndexOf('.') + 1).toLowerCase() : "";

        if (!List.of("mpp", "mpt", "xml").contains(ext)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Format non supporté. Utiliser .mpp, .mpt ou .xml"
            ));
        }

        try {
            UniversalProjectReader reader = new UniversalProjectReader();
            ProjectFile project = reader.read(file.getInputStream());

            List<Map<String, Object>> taches = new ArrayList<>();

            for (Task task : project.getTasks()) {
                if (task.getName() == null || task.getName().isBlank()) continue;
                if (Boolean.TRUE.equals(task.getSummary())) continue; // lignes de groupe

                Map<String, Object> t = new LinkedHashMap<>();
                t.put("title",    task.getName());
                t.put("progress", task.getPercentageComplete() != null
                    ? task.getPercentageComplete().intValue() : 0);

                if (task.getStart() != null) {
                    t.put("startDate", task.getStart().toInstant()
                        .atZone(ZoneId.systemDefault()).toLocalDate().toString());
                }
                if (task.getFinish() != null) {
                    t.put("endDate", task.getFinish().toInstant()
                        .atZone(ZoneId.systemDefault()).toLocalDate().toString());
                }
                if (task.getDuration() != null) {
                    t.put("durationDays", (int) task.getDuration().getDuration());
                }
                if (task.getNotes() != null && !task.getNotes().isBlank()) {
                    t.put("notes", task.getNotes());
                }
                taches.add(t);
            }

            String projectName = project.getProjectProperties().getName();

            return ResponseEntity.ok(Map.of(
                "projectName", projectName != null ? projectName : nom,
                "tasks",  taches,
                "count",  taches.size()
            ));

        } catch (Exception e) {
            log.error("Erreur parsing MS Project [{}]: {}", nom, e.getMessage());
            return ResponseEntity.status(422).body(Map.of(
                "error", "Impossible de lire le fichier: " + e.getMessage()
            ));
        }
    }
}

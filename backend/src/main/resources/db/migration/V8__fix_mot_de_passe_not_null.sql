-- V8__fix_mot_de_passe_not_null.sql
-- La colonne mot_de_passe (schéma V1/Prisma) est remplacée par password_hash (V6, JPA).
-- Hibernate n'insère jamais mot_de_passe → contrainte NOT NULL viole chaque INSERT utilisateur.
-- Solution : rendre la colonne nullable (données historiques conservées).

ALTER TABLE utilisateurs ALTER COLUMN mot_de_passe DROP NOT NULL;

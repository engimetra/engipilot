# ═══════════════════════════════════════════════════════
# ENGIPILOT — Infrastructure as Code (Terraform + AWS)
# ═══════════════════════════════════════════════════════
terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket = "engipilot-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "eu-west-1"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags { tags = { Project = "ENGIPILOT", Environment = var.env } }
}

variable "aws_region" { default = "eu-west-1" }
variable "env"        { default = "prod" }
variable "db_password" { sensitive = true }

# ── VPC ─────────────────────────────────────────────
resource "aws_vpc" "engipilot" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "engipilot-vpc" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.engipilot.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "engipilot-private-${count.index}" }
}

data "aws_availability_zones" "available" {}

# ── RDS PostgreSQL ───────────────────────────────────
resource "aws_db_instance" "engipilot_postgres" {
  identifier        = "engipilot-${var.env}"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.medium"
  allocated_storage = 100
  storage_type      = "gp3"
  storage_encrypted = true
  db_name           = "engipilot"
  username          = "admin"
  password          = var.db_password
  multi_az          = var.env == "prod"
  backup_retention_period = 7
  deletion_protection     = var.env == "prod"
  skip_final_snapshot     = var.env != "prod"
  tags = { Name = "engipilot-rds" }
}

# ── ElastiCache Redis ────────────────────────────────
resource "aws_elasticache_cluster" "engipilot_redis" {
  cluster_id           = "engipilot-redis"
  engine               = "redis"
  node_type            = "cache.t3.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  tags = { Name = "engipilot-redis" }
}

# ── ECS Fargate — Backend ────────────────────────────
resource "aws_ecs_cluster" "engipilot" {
  name = "engipilot-${var.env}"
  setting { name = "containerInsights", value = "enabled" }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "engipilot-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  container_definitions = jsonencode([{
    name  = "backend"
    image = "engipilot/backend:latest"
    portMappings = [{ containerPort = 8080, hostPort = 8080 }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
      { name = "SPRING_DATASOURCE_URL",  value = "jdbc:postgresql://${aws_db_instance.engipilot_postgres.endpoint}/engipilot" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"  = "/ecs/engipilot-backend"
        "awslogs-region" = var.aws_region
      }
    }
  }])
}

# ── S3 pour documents MinIO ──────────────────────────
resource "aws_s3_bucket" "documents" {
  bucket = "engipilot-documents-${var.env}"
  tags   = { Name = "engipilot-documents" }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration { status = "Enabled" }
}

# ── Outputs ──────────────────────────────────────────
output "rds_endpoint"   { value = aws_db_instance.engipilot_postgres.endpoint }
output "redis_endpoint" { value = aws_elasticache_cluster.engipilot_redis.cache_nodes[0].address }
output "s3_bucket"      { value = aws_s3_bucket.documents.id }

# ═══════════════════════════════════════════════════════════════
#  ENGIPILOT — Infrastructure as Code (Terraform + AWS ECS Fargate)
# ═══════════════════════════════════════════════════════════════

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

# ── Variables ────────────────────────────────────────────────
variable "aws_region"      { default = "eu-west-1" }
variable "env"             { default = "prod" }
variable "domain"          { default = "engipilot.ma" }
variable "db_password"     { sensitive = true }
variable "jwt_secret"      { sensitive = true }
variable "frontend_image"  { default = "engipilot/frontend:latest" }
variable "backend_image"   { default = "engipilot/backend:latest" }
variable "openai_api_key"  { sensitive = true; default = "" }

data "aws_availability_zones" "available" {}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NETWORKING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "aws_vpc" "engipilot" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "engipilot-vpc" }
}

# Sous-réseaux privés (ECS tasks, RDS, Redis)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.engipilot.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "engipilot-private-${count.index}" }
}

# Sous-réseaux publics (ALB)
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.engipilot.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "engipilot-public-${count.index}" }
}

# Internet Gateway (trafic entrant/sortant pour les subnets publics)
resource "aws_internet_gateway" "engipilot" {
  vpc_id = aws_vpc.engipilot.id
  tags   = { Name = "engipilot-igw" }
}

# Elastic IP pour NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "engipilot-nat-eip" }
}

# NAT Gateway (permet aux tâches ECS privées d'accéder à internet)
resource "aws_nat_gateway" "engipilot" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = "engipilot-nat" }
  depends_on    = [aws_internet_gateway.engipilot]
}

# Table de routage publique → IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.engipilot.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.engipilot.id
  }
  tags = { Name = "engipilot-rt-public" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Table de routage privée → NAT Gateway
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.engipilot.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.engipilot.id
  }
  tags = { Name = "engipilot-rt-private" }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECURITY GROUPS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ALB — accepte HTTP(80) et HTTPS(443) depuis internet
resource "aws_security_group" "alb" {
  name   = "engipilot-alb-sg"
  vpc_id = aws_vpc.engipilot.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "engipilot-alb-sg" }
}

# Frontend ECS — accepte uniquement depuis l'ALB sur port 3000
resource "aws_security_group" "frontend" {
  name   = "engipilot-frontend-sg"
  vpc_id = aws_vpc.engipilot.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "engipilot-frontend-sg" }
}

# Backend ECS — accepte depuis l'ALB sur port 8080
resource "aws_security_group" "backend" {
  name   = "engipilot-backend-sg"
  vpc_id = aws_vpc.engipilot.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "engipilot-backend-sg" }
}

# RDS — accepte uniquement depuis le backend ECS
resource "aws_security_group" "rds" {
  name   = "engipilot-rds-sg"
  vpc_id = aws_vpc.engipilot.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }
  tags = { Name = "engipilot-rds-sg" }
}

# Redis — accepte uniquement depuis le backend ECS
resource "aws_security_group" "redis" {
  name   = "engipilot-redis-sg"
  vpc_id = aws_vpc.engipilot.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }
  tags = { Name = "engipilot-redis-sg" }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CERTIFICAT TLS (ACM) + ROUTE53
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Zone hébergée Route53 pour engipilot.ma
resource "aws_route53_zone" "engipilot" {
  name = var.domain
  tags = { Name = "engipilot-zone" }
}

# Certificat wildcard couvrant engipilot.ma + *.engipilot.ma
resource "aws_acm_certificate" "engipilot" {
  domain_name               = var.domain
  subject_alternative_names = ["*.${var.domain}"]
  validation_method         = "DNS"
  lifecycle { create_before_destroy = true }
  tags = { Name = "engipilot-cert" }
}

# Enregistrement DNS pour valider le certificat ACM
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.engipilot.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }
  zone_id         = aws_route53_zone.engipilot.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "engipilot" {
  certificate_arn         = aws_acm_certificate.engipilot.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# Enregistrement A → ALB pour engipilot.ma
resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.engipilot.zone_id
  name    = var.domain
  type    = "A"
  alias {
    name                   = aws_lb.engipilot.dns_name
    zone_id                = aws_lb.engipilot.zone_id
    evaluate_target_health = true
  }
}

# Enregistrement A → ALB pour api.engipilot.ma
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.engipilot.zone_id
  name    = "api.${var.domain}"
  type    = "A"
  alias {
    name                   = aws_lb.engipilot.dns_name
    zone_id                = aws_lb.engipilot.zone_id
    evaluate_target_health = true
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# APPLICATION LOAD BALANCER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "aws_lb" "engipilot" {
  name               = "engipilot-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  tags               = { Name = "engipilot-alb" }
}

# Listener HTTP → redirect 301 vers HTTPS
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.engipilot.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Listener HTTPS — règles de routage par Host header
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.engipilot.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.engipilot.certificate_arn

  # Par défaut → frontend
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# Règle HTTPS : api.engipilot.ma → backend
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  condition {
    host_header { values = ["api.${var.domain}"] }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# Target Group frontend (Next.js :3000)
resource "aws_lb_target_group" "frontend" {
  name        = "engipilot-frontend-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.engipilot.id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 10
  }
  tags = { Name = "engipilot-frontend-tg" }
}

# Target Group backend (Spring Boot :8080)
resource "aws_lb_target_group" "backend" {
  name        = "engipilot-backend-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.engipilot.id
  target_type = "ip"

  health_check {
    path                = "/actuator/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 10
  }
  tags = { Name = "engipilot-backend-tg" }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# IAM — ECS Task Execution Role
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "engipilot-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
  tags               = { Name = "engipilot-ecs-execution-role" }
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CLOUDWATCH LOG GROUPS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/engipilot-frontend"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/engipilot-backend"
  retention_in_days = 30
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ECS CLUSTER + TASK DEFINITIONS + SERVICES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "aws_ecs_cluster" "engipilot" {
  name = "engipilot-${var.env}"
  setting { name = "containerInsights", value = "enabled" }
}

# ── Frontend Task Definition ─────────────────────────────────
resource "aws_ecs_task_definition" "frontend" {
  family                   = "engipilot-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name  = "frontend"
    image = var.frontend_image
    portMappings = [{ containerPort = 3000, hostPort = 3000, protocol = "tcp" }]
    environment = [
      { name = "NEXT_PUBLIC_API_URL",  value = "https://api.${var.domain}/api/v1" },
      { name = "NEXT_PUBLIC_APP_URL",  value = "https://${var.domain}" },
      { name = "NEXT_PUBLIC_APP_NAME", value = "ENGIPILOT" },
      { name = "NODE_ENV",             value = "production" },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "frontend"
      }
    }
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
      interval    = 30
      timeout     = 10
      retries     = 3
      startPeriod = 60
    }
  }])
}

# ── Backend Task Definition ──────────────────────────────────
resource "aws_ecs_task_definition" "backend" {
  family                   = "engipilot-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name  = "backend"
    image = var.backend_image
    portMappings = [{ containerPort = 8080, hostPort = 8080, protocol = "tcp" }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
      { name = "SPRING_DATASOURCE_URL",
        value = "jdbc:postgresql://${aws_db_instance.engipilot_postgres.endpoint}/engipilot" },
      { name = "CORS_ALLOWED_ORIGINS",
        value = "https://${var.domain}" },
    ]
    secrets = [
      { name = "SPRING_DATASOURCE_PASSWORD", valueFrom = aws_secretsmanager_secret.db_password.arn },
      { name = "JWT_SECRET",                 valueFrom = aws_secretsmanager_secret.jwt_secret.arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "backend"
      }
    }
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]
      interval    = 30
      timeout     = 10
      retries     = 3
      startPeriod = 60
    }
  }])
}

# ── ECS Service Frontend ─────────────────────────────────────
resource "aws_ecs_service" "frontend" {
  name            = "engipilot-frontend"
  cluster         = aws_ecs_cluster.engipilot.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.frontend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https]
  lifecycle { ignore_changes = [desired_count] }
}

# ── ECS Service Backend ──────────────────────────────────────
resource "aws_ecs_service" "backend" {
  name            = "engipilot-backend"
  cluster         = aws_ecs_cluster.engipilot.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]
  lifecycle { ignore_changes = [desired_count] }
}

# ── Auto Scaling Backend ─────────────────────────────────────
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.engipilot.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "engipilot-backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECRETS MANAGER (remplace les variables sensibles en clair)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "engipilot/${var.env}/db-password"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "engipilot/${var.env}/jwt-secret"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

# Permission pour ECS de lire les secrets
resource "aws_iam_role_policy" "ecs_secrets" {
  name = "engipilot-ecs-secrets"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_secretsmanager_secret.db_password.arn,
        aws_secretsmanager_secret.jwt_secret.arn,
      ]
    }]
  })
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RDS POSTGRESQL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "aws_db_subnet_group" "engipilot" {
  name       = "engipilot-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "engipilot-db-subnet-group" }
}

resource "aws_db_instance" "engipilot_postgres" {
  identifier             = "engipilot-${var.env}"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  max_allocated_storage  = 500
  storage_type           = "gp3"
  storage_encrypted      = true
  db_name                = "engipilot"
  username               = "engipilot_admin"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.engipilot.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = var.env == "prod"
  backup_retention_period = 7
  deletion_protection     = var.env == "prod"
  skip_final_snapshot     = var.env != "prod"
  tags = { Name = "engipilot-rds" }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ELASTICACHE REDIS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "aws_elasticache_subnet_group" "engipilot" {
  name       = "engipilot-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "engipilot_redis" {
  cluster_id           = "engipilot-redis"
  engine               = "redis"
  node_type            = "cache.t3.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.engipilot.name
  security_group_ids   = [aws_security_group.redis.id]
  tags                 = { Name = "engipilot-redis" }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# S3 — STOCKAGE DOCUMENTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "aws_s3_bucket" "documents" {
  bucket = "engipilot-documents-${var.env}"
  tags   = { Name = "engipilot-documents" }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OUTPUTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output "alb_dns_name" {
  description = "DNS name de l'ALB (à utiliser pour tester avant DNS)"
  value       = aws_lb.engipilot.dns_name
}

output "frontend_url" {
  description = "URL publique de l'application"
  value       = "https://${var.domain}"
}

output "api_url" {
  description = "URL publique de l'API Spring Boot"
  value       = "https://api.${var.domain}/api/v1"
}

output "rds_endpoint" {
  description = "Endpoint RDS PostgreSQL"
  value       = aws_db_instance.engipilot_postgres.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Endpoint ElastiCache Redis"
  value       = aws_elasticache_cluster.engipilot_redis.cache_nodes[0].address
  sensitive   = true
}

output "s3_bucket" {
  description = "Nom du bucket S3 pour les documents"
  value       = aws_s3_bucket.documents.id
}

output "route53_nameservers" {
  description = "Nameservers à configurer chez votre registrar .ma"
  value       = aws_route53_zone.engipilot.name_servers
}

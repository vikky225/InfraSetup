provider "aws" {
  region = var.aws_region
}

# S3 Bucket
resource "aws_s3_bucket" "weather_bucket" {
  bucket = var.s3_bucket_name
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "lambda_weather_role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      }
    }
  ]
}
EOF
}

# IAM policy for accessing S3
resource "aws_iam_role_policy" "s3_policy" {
  role = aws_iam_role.lambda_role.id
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:s3:::${var.s3_bucket_name}/*"
    }
  ]
}
EOF
}

# Lambda Function: Current Weather
resource "aws_lambda_function" "current_weather" {
  function_name = "current_weather"
  role          = aws_iam_role.lambda_role.arn
  handler       = "dist/weather.handler"
  runtime       = "nodejs18.x"
  filename      = "/Users/vikasmalviya/weather-api/weather_lambda.zip"  # Path to your zipped lambda function
  environment {
    variables = {
      OPENWEATHER_API_KEY = var.openweather_api_key  # Using provided API key
      S3_BUCKET_NAME      = aws_s3_bucket.weather_bucket.id
    }
  }
}

# API Gateway for Current Weather
resource "aws_apigatewayv2_api" "weather_api" {
  name          = "weather_api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.weather_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.current_weather.arn
}

resource "aws_apigatewayv2_route" "current_weather_route" {
  api_id    = aws_apigatewayv2_api.weather_api.id
  route_key = "GET /weather/{city}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"


}

# Output the API URL
output "api_url" {
  value = aws_apigatewayv2_api.weather_api.api_endpoint
}

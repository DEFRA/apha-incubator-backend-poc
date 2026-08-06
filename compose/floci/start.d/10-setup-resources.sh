#!/bin/bash

# S3 buckets
#aws s3 mb s3://my-bucket

# SQS queues
#aws sqs create-queue --queue-name my-queue

# SNS topics
aws sns create-topic --name holding-events

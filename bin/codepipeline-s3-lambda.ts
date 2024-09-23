#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodepipelineS3LambdaStack } from '../lib/codepipeline-s3-lambda-stack';
import { S3Stack } from '../lib/s3-stack';
import { LambdaStack } from '../lib/lambda-stack';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as fs from 'fs';
import * as path from 'path';

const app = new cdk.App();

// Define the environment
const environment = app.node.tryGetContext('env') || 'test';

// Load configuration specific to the environment
const configFilePath = path.join(__dirname, `../config/config-${environment}.json`);
const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));


// Create the S3 stack
const s3Stack = new S3Stack(app, `CodepipelineS3Stack-${environment}`, {
  sourceBucketName: config.sourceBucketName,
  destinationBucketName: config.destinationBucketName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },

});

// Define the source stage with GitHub integration for CodePipeline
const sourceOutput = new codepipeline.Artifact();
const sourceAction = new codepipeline_actions.GitHubSourceAction({
  actionName: 'GitHub_Source',
  owner: 'chinnachaitanya',
  repo: 'cdk-codepipeline-actions-s3-lambda',
  oauthToken: cdk.SecretValue.secretsManager('github-token1'),  // Use a secret manager for GitHub token
  output: sourceOutput,
  branch: 'main',  // Change if using a different branch
});

// Create the CodePipeline stack
const pipelineStack = new CodepipelineS3LambdaStack(app, `CodepipelineS3LambdaStack-${environment}`, {
  sourceAction: sourceAction,  // Pass sourceAction
  sourceOutput: sourceOutput,  // Pass sourceOutput
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Create the Lambda stack
const lambdaStack = new LambdaStack(app, `CodepipelineLambdaStack-${environment}`, {
  sourceBucketName: config.sourceBucketName,
  destinationBucketName: config.destinationBucketName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Ensure the Lambda stack is deployed after the S3 and Pipeline stacks
lambdaStack.addDependency(s3Stack);
lambdaStack.addDependency(pipelineStack);
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

interface PipelineStackProps extends cdk.StackProps {
  sourceAction: codepipeline_actions.Action;
  sourceOutput: codepipeline.Artifact;
}

export class CodepipelineS3LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { sourceAction, sourceOutput } = props;

    // Define the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'MyPipelineActions', {
      pipelineName: 'MyS3LambdaPipelineCDK',
    });

    // Add the source stage to the pipeline (GitHub)
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Define the build stage (optional, if Lambda assets need building)
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: 0.2,
        phases: {
          install: {
            'runtime-versions': {nodejs: '14',},
            commands: ['npm install', 'npm install -g aws-cdk '],
          },
          build: {
            commands: ['npm run build', 'cdk synth --output ./cdk.out',],
          },
        },
        artifacts: {
          'base-directory': 'cdk.out',
          files: ['**/*'],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_6_0, // Use managed image standard 6.0
      },
    });

    // Add build stage to the pipeline
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
        }),
      ],
    });

    
    // Define the deploy stage for Lambda and S3 stacks
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'S3_Stack_Deploy_CDK',
          stackName: 'S3StackCDK-test',
          templatePath: sourceOutput.atPath('cdk.out/CodepipelineS3Stack-test.template.json'),
          adminPermissions: true,
        }),
        
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'Lambda_Stack_Deploy_CDK',
          stackName: 'LambdaStackCDK-test',
          templatePath: sourceOutput.atPath('cdk.out/CodepipelineS3LambdaStack-test.template.json'),
          adminPermissions: true,
        }),
      ],
    });
  }
}

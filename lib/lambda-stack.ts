import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

interface LambdaStackProps extends cdk.StackProps {
  sourceBucketName: string;
  destinationBucketName: string;
  }

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // // You can now use the buckets directly
    // const sourceBucket = props.sourceBucket;
    // const destinationBucket = props.destinationBucket;
    const sourceBucket = s3.Bucket.fromBucketName(this, 'SourceBucket', props.sourceBucketName);
    const destinationBucket = s3.Bucket.fromBucketName(this, 'DestinationBucket', props.destinationBucketName);

    // Create Lambda function
    const lambdaFunction = new lambda.Function(this, 'S3LambdaHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'handler.handler',
      environment: {
        DESTINATION_BUCKET: destinationBucket.bucketName,
      },
    });

    // Attach permissions to Lambda
    lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: [
        `arn:aws:s3:::${sourceBucket.bucketName}/*`,
        `arn:aws:s3:::${destinationBucket.bucketName}/*`
      ],
    }));

    // Grant S3 access to Lambda
    sourceBucket.grantRead(lambdaFunction);
    destinationBucket.grantWrite(lambdaFunction);

    // Set up event notification for Lambda
    sourceBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(lambdaFunction));
  }
}

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface S3StackProps extends cdk.StackProps {
  sourceBucketName: string;
  destinationBucketName: string;
}

export class S3Stack extends cdk.Stack {
  public readonly sourceBucket: s3.IBucket;
  public readonly destinationBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    // Create Source S3 bucket
    this.sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: props.sourceBucketName,
    });

    // Create Destination S3 bucket
    this.destinationBucket = new s3.Bucket(this, 'DestinationBucket', {
      bucketName: props.destinationBucketName,
    });

    // Export bucket names
    new cdk.CfnOutput(this, 'SourceBucketNameOutput', {
      value: this.sourceBucket.bucketName,
      exportName: 'SrcBucketName',
    });

    new cdk.CfnOutput(this, 'DestinationBucketNameOutput', {
      value: this.destinationBucket.bucketName,
      exportName: 'DestBucketName',
    });
  }
}

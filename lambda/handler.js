const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const s3 = new S3Client();

exports.handler = async function(event) {
  console.log("Event received:", JSON.stringify(event, null, 2));
  const version = new Date().toISOString();
  console.log("Deployment version:", version);
  const sourceBucket = event.Records[0].s3.bucket.name;
  const objectKey = event.Records[0].s3.object.key;

  console.log("Source bucket:", sourceBucket);
  console.log("Object key:", objectKey);

  try {
    // Get the object from the source bucket
    const getObjectCommand = new GetObjectCommand({
      Bucket: sourceBucket,
      Key: objectKey,
    });
    const getObjectResponse = await s3.send(getObjectCommand);

    console.log("really really really Object successfully retrieved from source bucket:", getObjectResponse);

    // Upload object to destination bucket
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.DESTINATION_BUCKET,
        Key: objectKey,
        Body: getObjectResponse.Body,
      },
    });

    await upload.done();
    console.log("Successfully copied object to destination bucket:", process.env.DESTINATION_BUCKET);
  } catch (error) {
    console.error("Error occurred while copying object:", error);
  }
};

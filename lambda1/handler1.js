const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const s3 = new S3Client();

exports.handler1 = async function(event) {
  console.log("Event received:", JSON.stringify(event, null, 2));
};

// app.config.js
import "dotenv/config";

export default ({ config }) => ({
  ...config,
  extra: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    awsRegion: process.env.AWS_REGION,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    dynamodbTableName: process.env.DYNAMODB_TABLE_NAME,
    s3BucketName: process.env.S3_BUCKET_NAME,
  },
});

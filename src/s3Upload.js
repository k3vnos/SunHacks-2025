import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Constants from 'expo-constants';
import { readAsStringAsync } from 'expo-file-system/legacy';

// Initialize S3 client
const s3Client = new S3Client({
  region: Constants.expoConfig?.extra?.awsRegion || process.env.AWS_REGION,
  credentials: {
    accessKeyId: Constants.expoConfig?.extra?.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: Constants.expoConfig?.extra?.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = Constants.expoConfig?.extra?.s3BucketName || process.env.S3_BUCKET_NAME || 'flagit-images';

/**
 * Upload an image to S3
 * @param {string} imageUri - Local file URI of the image
 * @param {string} reportId - Unique report ID for organizing images
 * @returns {Promise<string>} - S3 URL of the uploaded image
 */
export const uploadImageToS3 = async (imageUri, reportId) => {
  try {
    console.log('Uploading image to S3:', imageUri);

    // Read the file as base64
    const base64 = await readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Convert base64 to binary
    const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${reportId}/${timestamp}.jpg`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: 'image/jpeg',
    });

    await s3Client.send(command);

    // Construct S3 URL
    const s3Url = `https://${BUCKET_NAME}.s3.${Constants.expoConfig?.extra?.awsRegion || process.env.AWS_REGION}.amazonaws.com/${filename}`;

    console.log('Image uploaded successfully to:', s3Url);
    return s3Url;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw error;
  }
};

/**
 * Upload multiple images to S3
 * @param {string[]} imageUris - Array of local file URIs
 * @param {string} reportId - Unique report ID for organizing images
 * @returns {Promise<string[]>} - Array of S3 URLs
 */
export const uploadImagesToS3 = async (imageUris, reportId) => {
  try {
    console.log(`Uploading ${imageUris.length} images to S3...`);

    const uploadPromises = imageUris.map(uri => uploadImageToS3(uri, reportId));
    const s3Urls = await Promise.all(uploadPromises);

    console.log('All images uploaded successfully');
    return s3Urls;
  } catch (error) {
    console.error('Error uploading images to S3:', error);
    throw error;
  }
};

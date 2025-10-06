import 'react-native-get-random-values';
import '@azure/core-asynciterator-polyfill';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import Constants from 'expo-constants';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: Constants.expoConfig?.extra?.awsRegion || process.env.AWS_REGION,
  credentials: {
    accessKeyId: Constants.expoConfig?.extra?.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: Constants.expoConfig?.extra?.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = Constants.expoConfig?.extra?.dynamodbTableName || process.env.DYNAMODB_TABLE_NAME || 'Hazard_flags';

/**
 * Save a hazard report to DynamoDB
 * @param {Object} report - The report object containing title, description, images, location, etc.
 * @returns {Promise<Object>} - The saved report
 */
export const saveReport = async (report) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        Hazard_id: report.id,                    // Partition key
        time: report.timestamp,                   // Sort key
        title: report.title,
        description: report.description,
        images: report.images || [],
        latitude: report.latitude,
        longitude: report.longitude,
        category: report.category || 'other',
        status: 'active',                         // active, resolved, false_report
        upvotes: 0,
        downvotes: 0,
        comments: [],
      },
    };

    await docClient.send(new PutCommand(params));
    console.log('Report saved to DynamoDB:', report.id);
    return params.Item;
  } catch (error) {
    console.error('Error saving report to DynamoDB:', error);
    throw error;
  }
};

/**
 * Get all reports from DynamoDB
 * @returns {Promise<Array>} - Array of all reports
 */
export const getAllReports = async () => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };

    const result = await docClient.send(new ScanCommand(params));
    console.log(`Retrieved ${result.Items?.length || 0} reports from DynamoDB`);

    // Transform DynamoDB items to match app format
    const reports = (result.Items || []).map(item => ({
      id: item.Hazard_id,
      title: item.title,
      description: item.description,
      images: item.images || [],
      latitude: item.latitude,
      longitude: item.longitude,
      timestamp: item.time,
      category: item.category,
      upvotes: item.upvotes || 0,
      downvotes: item.downvotes || 0,
      comments: item.comments || [],
      status: item.status || 'active',
    }));

    return reports;
  } catch (error) {
    console.error('Error getting reports from DynamoDB:', error);
    throw error;
  }
};

/**
 * Get a specific report by ID
 * @param {string} reportId - The report ID
 * @param {string} timestamp - The timestamp (sort key)
 * @returns {Promise<Object>} - The report object
 */
export const getReport = async (reportId, timestamp) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        Hazard_id: reportId,
        time: timestamp,
      },
    };

    const result = await docClient.send(new GetCommand(params));

    if (!result.Item) {
      return null;
    }

    // Transform to app format
    return {
      id: result.Item.Hazard_id,
      title: result.Item.title,
      description: result.Item.description,
      images: result.Item.images || [],
      latitude: result.Item.latitude,
      longitude: result.Item.longitude,
      timestamp: result.Item.time,
      category: result.Item.category,
      upvotes: result.Item.upvotes || 0,
      downvotes: result.Item.downvotes || 0,
      comments: result.Item.comments || [],
      status: result.Item.status || 'active',
    };
  } catch (error) {
    console.error('Error getting report from DynamoDB:', error);
    throw error;
  }
};

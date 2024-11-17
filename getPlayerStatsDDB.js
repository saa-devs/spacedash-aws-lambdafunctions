/**
 * AWS Lambda function to retrieve player statistics from a DynamoDB table.
 *
 * This function is triggered by an API Gateway GET request. It accepts a query parameter `username`,
 * retrieves the corresponding player's stats from the `player-stats` DynamoDB table, and returns the data.
 * If the user is not found or the request is invalid, it returns an appropriate error response.
 *
 * @async
 * @function handler
 * @param {Object} event - The API Gateway event object.
 * @param {string} event.httpMethod - The HTTP method of the request (must be GET).
 * @param {Object} [event.queryStringParameters] - Query parameters included in the request.
 * @param {string} [event.queryStringParameters.username] - The username of the player whose stats are to be retrieved.
 * @returns {Promise<Object>} - The HTTP response object.
 * 
 * @throws {Error} - Logs an error and returns a 500 response if the DynamoDB operation fails.
 */

import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocument.from(new DynamoDB());
const TABLE_NAME = "player-stats";

export const handler = async (event) => {
    try {
        // Extract query parameters from the event
        const { username } = event.queryStringParameters || {};

        // Validate required fields
        if (!username) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Username is required." }),
            };
        }

        // Prepare DynamoDB get parameters
        const params = {
            TableName: TABLE_NAME,
            Key: { username },
        };

        // Fetch the player stats from DynamoDB
        const result = await dynamo.get(params);

        // Check if the player exists
        if (!result.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Player not found." }),
            };
        }

        // Return a success response with the player's stats
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            },
            body: JSON.stringify({
                message: "Player stats retrieved successfully.",
                data: result.Item,
            }),
        };
    } catch (error) {
        console.error("Error retrieving player stats:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to retrieve player stats.", error }),
        };
    }
};

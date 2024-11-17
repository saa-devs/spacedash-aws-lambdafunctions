/**
 * @fileoverview AWS Lambda function to update or overwrite player statistics in a DynamoDB table.
 */

import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocument.from(new DynamoDB());
const TABLE_NAME = "player-stats";

/**
 * AWS Lambda handler to update or overwrite player stats in the DynamoDB table.
 *
 * @param {object} event - The Lambda event object, containing query string parameters.
 * @param {object} [event.queryStringParameters] - The query parameters from the HTTP request.
 * @param {string} [event.queryStringParameters.username] - The username of the player (required).
 * @param {string} [event.queryStringParameters.coinsCollected] - The number of coins collected by the player.
 * @param {string} [event.queryStringParameters.enemiesDefeated] - The number of enemies defeated by the player.
 * @param {string} [event.queryStringParameters.levelsCompleted] - JSON string of levels completed by the player.
 * @param {string} [event.queryStringParameters.fastestTimes] - JSON string of the player's fastest times for levels.
 *
 * @returns {Promise<object>} - The HTTP response object with status code, headers, and body.
 *
 * @throws {Error} - Returns a 500 status code with an error message if the operation fails.
 */
export const handler = async (event) => {
    try {
        // Extract query parameters from the event
        const {
            username,
            coinsCollected,
            enemiesDefeated,
            levelsCompleted,
            fastestTimes,
        } = event.queryStringParameters || {};

        // Validate required fields
        if (!username) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Username is required." }),
            };
        }

        // Parse levelsCompleted and fastestTimes
        const parsedLevels = JSON.parse(levelsCompleted || "[]");
        const parsedFastestTimes = JSON.parse(fastestTimes || "{}");

        // Prepare the item to be saved
        const item = {
            username, // Partition key
            "coins-collected": parseInt(coinsCollected) || 0,
            "enemies-defeated": parseInt(enemiesDefeated) || 0,
            "levels-completed": parsedLevels,
            "fastest-times": parsedFastestTimes,
        };

        // Save the item to DynamoDB (overwriting existing data)
        await dynamo.put({
            TableName: TABLE_NAME,
            Item: item,
        });

        // Return a success response
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            },
            body: JSON.stringify({
                message: "Player stats overwritten successfully.",
                data: item,
            }),
        };
    } catch (error) {
        console.error("Error updating player stats:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to update player stats.", error }),
        };
    }
};

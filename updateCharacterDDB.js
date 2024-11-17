/**
 * AWS Lambda function to update the character associated with a user in a DynamoDB table.
 * This function is triggered by an API Gateway and supports `GET` and `OPTIONS` HTTP methods.
 *
 * @param {Object} event - The API Gateway event object.
 * @param {string} event.httpMethod - The HTTP method of the request (e.g., `GET`, `OPTIONS`).
 * @param {Object} [event.queryStringParameters] - Query parameters sent in the request.
 * @param {string} [event.queryStringParameters.username] - The username of the user to update.
 * @param {string} [event.queryStringParameters.colour] - The colour of the character to associate with the user.
 * @returns {Promise<Object>} - An HTTP response object.
 * 
 * @throws {Error} - Returns an error message for unsupported methods or missing/invalid parameters.
 */
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocument.from(new DynamoDB());

export const handler = async (event) => {
    let body;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    try {
        if (event.httpMethod === 'GET') {
            const { username, colour } = event.queryStringParameters;
            
            // Update the 'character' field for the item with the given 'username' in the 'spacedash-user' table
            body = await dynamo.update({
                TableName: 'spacedash-user',
                Key: { username },
                UpdateExpression: 'set #character = :colour',
                ExpressionAttributeNames: {
                    '#character': 'character'
                },
                ExpressionAttributeValues: {
                    ':colour': colour
                },
                ReturnValues: 'UPDATED_NEW'
            });
        } else if (event.httpMethod === 'OPTIONS') {
            // Handle pre-flight requests
            statusCode = '204';
            body = '';
        } else {
            throw new Error(`Unsupported method "${event.httpMethod}"`);
        }
    } catch (err) {
        statusCode = '400';
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers,
    };
};

/**
 * AWS Lambda function to retrieve user information from a DynamoDB table.
 * 
 * This function handles HTTP GET requests sent through API Gateway. It requires a `username`
 * query parameter to fetch user information from the `spacedash-user` table in DynamoDB.
 * 
 * @param {Object} event - The event object passed by AWS Lambda.
 * @param {string} event.httpMethod - The HTTP method of the request (only `GET` is supported).
 * @param {Object} [event.queryStringParameters] - Query parameters included in the request.
 * @param {string} [event.queryStringParameters.username] - The username to retrieve from DynamoDB.
 * @returns {Promise<Object>} - A response object containing the HTTP status code, headers, and body.
 * 
 * Possible responses:
 * - 200: Successfully retrieved user information or user not found.
 * - 400: Bad request due to missing query parameter or unsupported HTTP method.
 * 
 * @throws {Error} - Returns an error message for missing username or unsupported methods.
 */
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocument.from(new DynamoDB());

export const handler = async (event) => {
    let body;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "GET, OPTIONS",          
        "Access-Control-Allow-Headers": "Content-Type"           
    };

    try {
        switch (event.httpMethod) {
            case 'GET':
                if (!event.queryStringParameters || !event.queryStringParameters.username) {
                    throw new Error("Username query parameter is required");
                }
                const { username } = event.queryStringParameters;
                const params = {
                    TableName: 'spacedash-user', 
                    Key: { username }
                };
                const result = await dynamo.get(params);
                body = result.Item ? result.Item : { message: "User not found" };
                break;
                
            default:
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

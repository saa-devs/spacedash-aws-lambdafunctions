/**
 * AWS Lambda function to fetch the CloudFront URL of a spritesheet file from an S3 bucket 
 * based on a `characterColour` query parameter. The 'colourCharacter' query parameter is the 
 * chosen colour by the player, and the spritesheet with the same filename as this colour is retrieved
 * and used by Phaser.js to render graphics and animation of the main character. 
 *
 * @param {Object} event - The API Gateway event object.
 * @param {Object} event.queryStringParameters - Query parameters sent in the API request.
 * @param {string} event.queryStringParameters.characterColour - The name of the character colour to search for.
 * @returns {Promise<Object>} - A response object with a status code, headers, and a JSON body.
 * 
 * Possible responses:
 * - 200: Success with the CloudFront URL of the matching spritesheet.
 * - 400: Missing the required `characterColour` query parameter.
 * - 404: Spritesheet not found or no files in the folder.
 * - 500: Internal server error during file retrieval.
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1' });
const bucketName = 'spacedash';
const cloudfrontDomain = 'https://d3vva0g6vi1eo1.cloudfront.net';

export const handler = async (event) => {
    const { queryStringParameters } = event;
    const searchCharacterColour = queryStringParameters?.characterColour; // Extract query parameter

    if (!searchCharacterColour) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required query parameter: characterColour" }),
        };
    }

    try {
        // List all objects in the 'spritesheets/' folder
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'spritesheets/', // Folder prefix
        });
        const response = await s3Client.send(command);
        const { Contents } = response;

        if (Contents && Contents.length > 0) {
            // Filter out folder-like objects (keys ending with '/')
            const validFiles = Contents.filter(({ Key }) => Key && !Key.endsWith('/'));

            // Look for the file matching the query parameter (characterColour)
            const matchingFile = validFiles.find(({ Key }) =>
                Key.split('/').pop().split('.').shift() === searchCharacterColour
            );

            if (matchingFile) {
                const fileURL = `${cloudfrontDomain}/${matchingFile.Key}`;
                return {
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET",
                        "Access-Control-Allow-Headers": "Content-Type",
                    },
                    body: JSON.stringify({ characterColour: searchCharacterColour, url: fileURL }),
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: `Spritesheet for characterColour "${searchCharacterColour}" not found.` }),
                };
            }
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "No files found in the spritesheets folder." }),
            };
        }
    } catch (error) {
        console.error('Error listing spritesheet images:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error retrieving spritesheet URLs' }),
        };
    }
};

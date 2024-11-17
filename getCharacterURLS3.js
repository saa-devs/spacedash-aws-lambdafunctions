/**
 * AWS Lambda function to fetch all character images from an S3 bucket, generate CloudFront URLs for them, 
 * and return the URLs in a JSON response. These character images are rendered on the user's profile
 * for selection.
 *
 * @returns {Promise<Object>} - A response object containing a JSON with character colours as keys and 
 * their corresponding CloudFront URLs as values.
 *
 * Possible responses:
 * - 200: Success with a list of CloudFront URLs for all valid character images.
 * - 500: Internal server error during file retrieval.
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1' });
const bucketName = 'spacedash';
const cloudfrontDomain = 'https://d3vva0g6vi1eo1.cloudfront.net';

export const handler = async (event) => {
    const characterURLs = {};

    try {
        // List all objects in the 'characters/' folder
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'characters/', // Folder prefix
        });
        const response = await s3Client.send(command);
        const { Contents } = response;

        if (Contents && Contents.length > 0) {
            // Filter out folder-like objects (keys ending with '/')
            const validFiles = Contents.filter(({ Key }) => Key && !Key.endsWith('/'));

            // Construct CloudFront URLs for each valid object
            validFiles.forEach(({ Key }) => {
                const colour = Key.split('/').pop().split('.').shift(); // Extract 'blue' from 'characters/blue.png'
                const characterURL = `${cloudfrontDomain}/${Key}`; // Direct CloudFront URL
                characterURLs[colour] = characterURL;
            });
        } else {
            console.warn("No objects found in the specified folder.");
        }

        // Return response with CORS headers
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: JSON.stringify(characterURLs),
        };

    } catch (error) {
        console.error('Error listing character images:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error retrieving character URLs' }),
        };
    }
};

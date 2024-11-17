/**
 * @fileoverview AWS Lambda function to retrieve leaderboard stats from a DynamoDB table,
 * including top 10 players for coins and enemies defeated, and all fastest times for all levels for all users.
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
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    try {
        switch (event.httpMethod) {
            case 'GET':
                // Define parameters to scan the "player-stats" table
                const params = {
                    TableName: 'player-stats'
                };
                const data = await dynamo.scan(params);

                // Throw an error if no data is found
                if (!data.Items) {
                    throw new Error("No data found in DynamoDB");
                }

                const players = data.Items;

                /**
                 * Top 10 players with the most coins collected.
                 * @type {Array}
                 */
                const topCoins = players
                    .sort((a, b) => (b['coins-collected'] || 0) - (a['coins-collected'] || 0))
                    .slice(0, 10)
                    .map((player) => ({
                        username: player.username,
                        coins: player['coins-collected'] || 0
                    }));

                /**
                 * Top 10 players with the most enemies defeated.
                 * @type {Array}
                 */
                const topEnemies = players
                    .sort((a, b) => (b['enemies-defeated'] || 0) - (a['enemies-defeated'] || 0))
                    .slice(0, 10)
                    .map((player) => ({
                        username: player.username,
                        enemies: player['enemies-defeated'] || 0
                    }));

                /**
                 * All fastest times for all levels for all users.
                 * @type {Array}
                 */
                const allFastestTimes = players.map((player) => {
                    const fastestTimes = {};
                    const times = player['fastest-times'];

                    if (times && typeof times === 'object') {
                        for (const level in times) {
                            if (times[level]?.L) {
                                const levelTimes = times[level].L
                                    .map((timeObj) => parseFloat(timeObj.N)) // Extract numbers stored as "N"
                                    .filter((time) => !isNaN(time));

                                // Store the sorted times for the level
                                fastestTimes[level] = levelTimes.sort((a, b) => a - b);
                            }
                        }
                    }

                    return {
                        username: player.username,
                        fastestTimes: fastestTimes
                    };
                });

                // Combine results into the response body
                body = {
                    topCoins,
                    topEnemies,
                    allFastestTimes
                };
                break;

            default:
                throw new Error(`Unsupported method "${event.httpMethod}"`);
        }
    } catch (err) {
        statusCode = '400';
        body = { error: err.message };
    } finally {
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers,
    };
};

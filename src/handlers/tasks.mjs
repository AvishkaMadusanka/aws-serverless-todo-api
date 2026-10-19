import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const endpoint = process.env.DYNAMODB_ENDPOINT;
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(endpoint
    ? {
        endpoint,
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      }
    : {}),
});
const db = DynamoDBDocumentClient.from(client);
const tableName = process.env.TASKS_TABLE || 'TasksTable';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

function response(statusCode, data) {
  return {
    statusCode,
    headers: corsHeaders,
    body: data === undefined ? '' : JSON.stringify(data),
  };
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return null;
  }
}

export const handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const id = event.pathParameters?.id;

  if (method === 'OPTIONS') return response(200, { message: 'OK' });

  try {
    if (method === 'POST' && !id) {
      const body = parseBody(event);
      if (!body) return response(400, { message: 'Request body must be valid JSON' });
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title) return response(400, { message: 'Task title is required' });

      const now = new Date().toISOString();
      const task = {
        id: randomUUID(),
        title,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      await db.send(new PutCommand({ TableName: tableName, Item: task }));
      return response(201, task);
    }

    if (method === 'GET' && !id) {
      const result = await db.send(new ScanCommand({ TableName: tableName }));
      const tasks = (result.Items || []).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
      return response(200, tasks);
    }

    if (method === 'GET' && id) {
      const result = await db.send(
        new GetCommand({ TableName: tableName, Key: { id } })
      );
      return result.Item
        ? response(200, result.Item)
        : response(404, { message: 'Task not found' });
    }

    if (method === 'PUT' && id) {
      const body = parseBody(event);
      if (!body) return response(400, { message: 'Request body must be valid JSON' });

      const current = await db.send(
        new GetCommand({ TableName: tableName, Key: { id } })
      );
      if (!current.Item) return response(404, { message: 'Task not found' });

      const title =
        typeof body.title === 'string' ? body.title.trim() : current.Item.title;
      if (!title) return response(400, { message: 'Task title cannot be empty' });

      const task = {
        ...current.Item,
        title,
        completed:
          typeof body.completed === 'boolean'
            ? body.completed
            : current.Item.completed,
        updatedAt: new Date().toISOString(),
      };

      await db.send(new PutCommand({ TableName: tableName, Item: task }));
      return response(200, task);
    }

    if (method === 'DELETE' && id) {
      const result = await db.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { id },
          ReturnValues: 'ALL_OLD',
        })
      );
      return result.Attributes
        ? response(200, { message: 'Task deleted', id })
        : response(404, { message: 'Task not found' });
    }

    return response(404, { message: 'Route not found' });
  } catch (error) {
    console.error('Tasks API error:', error);
    return response(500, { message: 'Internal server error' });
  }
};

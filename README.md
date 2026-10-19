# AWS Serverless To-Do CRUD API

A full-stack To-Do application built with AWS SAM, AWS Lambda (Node.js), API Gateway, DynamoDB Local, and React.

## Features

- Create, list, read, update, complete, and delete tasks
- REST API implemented with an AWS Lambda function
- DynamoDB as the task store
- DynamoDB Local for development and testing
- React + Vite frontend

## Requirements

- Node.js 24+
- AWS SAM CLI
- AWS CLI
- Docker Desktop
- Git

## Local setup

### 1. Start DynamoDB Local

```bash
docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -inMemory
```

If the container already exists, start it with `docker start dynamodb-local`.

### 2. Create the local table

In Windows Command Prompt, set dummy credentials for DynamoDB Local:

```cmd
set AWS_ACCESS_KEY_ID=local
set AWS_SECRET_ACCESS_KEY=local
set AWS_DEFAULT_REGION=us-east-1
```

Then create the table:

```cmd
aws dynamodb create-table --table-name TasksTable --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000 --region us-east-1
```

### 3. Configure SAM local environment

Copy `env.example.json` to `env.json` in the project root. The local endpoint uses `host.docker.internal` so Lambda's Docker container can reach DynamoDB Local on the Windows host.

### 4. Run the API

From the project root:

```bash
sam build
sam local start-api --env-vars env.json
```

The API runs at `http://127.0.0.1:3000`.

### 5. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | List tasks |
| POST | `/tasks` | Create a task; JSON body: `{"title":"Example task"}` |
| GET | `/tasks/{id}` | Get one task |
| PUT | `/tasks/{id}` | Update title and/or completion status |
| DELETE | `/tasks/{id}` | Delete a task |

## Example requests

```bash
curl http://127.0.0.1:3000/tasks
curl -X POST http://127.0.0.1:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Learn AWS SAM\"}"
```

## Notes

- DynamoDB Local stores data in memory with the command above; restarting/removing its container clears the local tasks.
- This repository is configured for local development. Deploying to AWS requires AWS credentials and may incur charges.
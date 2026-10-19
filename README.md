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

## Local setup (Windows Command Prompt)

### 1. Clone the repository

Clone into a new folder so your existing SAM project folder is not overwritten:

```cmd
cd %USERPROFILE%\Documents
git clone https://github.com/AvishkaMadusanka/aws-serverless-todo-api.git aws-serverless-todo-api-github
cd aws-serverless-todo-api-github
```

### 2. Start DynamoDB Local

Start Docker Desktop, then run:

```cmd
docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -inMemory
```

If you already created the `dynamodb-local` container, run `docker start dynamodb-local` instead.

### 3. Create the local table

In the same Command Prompt window, set dummy credentials for DynamoDB Local:

```cmd
set AWS_ACCESS_KEY_ID=local
set AWS_SECRET_ACCESS_KEY=local
set AWS_DEFAULT_REGION=us-east-1
```

Create the table:

```cmd
aws dynamodb create-table --table-name TasksTable --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000 --region us-east-1
```

If the table already exists, that is fine; confirm it with:

```cmd
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1
```

### 4. Configure and run the API

Copy the example environment file:

```cmd
copy env.example.json env.json
```

Then build and start the local API from the repository root:

```cmd
sam validate
sam build
sam local start-api --env-vars env.json
```

The API runs at `http://127.0.0.1:3000`. Keep this terminal open.

### 5. Run the frontend

Open a second Command Prompt window and run:

```cmd
cd %USERPROFILE%\Documents\aws-serverless-todo-api-github\frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Use the page to create, complete, edit, and delete tasks.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | List tasks |
| POST | `/tasks` | Create a task; JSON body: `{"title":"Example task"}` |
| GET | `/tasks/{id}` | Get one task |
| PUT | `/tasks/{id}` | Update title and/or completion status |
| DELETE | `/tasks/{id}` | Delete a task |

## Test the API from Command Prompt

With `sam local start-api` running, open another Command Prompt:

```cmd
curl http://127.0.0.1:3000/tasks
curl -X POST http://127.0.0.1:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Learn AWS SAM\"}"
```

The POST response includes the task `id`; use it to test read, update, and delete:

```cmd
curl http://127.0.0.1:3000/tasks/TASK_ID
curl -X PUT http://127.0.0.1:3000/tasks/TASK_ID -H "Content-Type: application/json" -d "{\"title\":\"Finish To-Do API\",\"completed\":true}"
curl -X DELETE http://127.0.0.1:3000/tasks/TASK_ID
```

Replace `TASK_ID` with the actual ID returned by POST.

## Notes

- DynamoDB Local stores data in memory with the command above; restarting/removing its container clears the local tasks.
- This repository is configured for local development. Deploying to AWS requires AWS credentials and may incur charges.

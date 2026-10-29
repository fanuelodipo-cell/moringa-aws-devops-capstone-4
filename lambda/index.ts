import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({});

export const handler = async () => {
  const response = await ssm.send(
    new GetParameterCommand({
      Name: process.env.PARAMETER_NAME,
    })
  );

  const greeting = response.Parameter?.Value;

  if (!greeting) {
    throw new Error("Greeting parameter was empty or not found.");
  }

  console.log("Retrieved greeting from SSM:", greeting);

  return {
    statusCode: 200,
    message: greeting,
  };
};

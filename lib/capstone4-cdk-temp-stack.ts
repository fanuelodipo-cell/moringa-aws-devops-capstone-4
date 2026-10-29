import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as esbuild from 'esbuild';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

export class Capstone4CdkTempStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const greetingParameter = new ssm.StringParameter(this, 'GreetingParameter', {
      parameterName: '/app/config/greeting',
      stringValue: 'Hello from Capstone 4!',
      description: 'Greeting configuration for the Capstone 4 Lambda function',
    });

    const bundledLambda = path.join(__dirname, '..', 'lambda-bundle');

    esbuild.buildSync({
      entryPoints: [path.join(__dirname, '..', 'lambda', 'index.ts')],
      outfile: path.join(bundledLambda, 'index.js'),
      bundle: true,
      platform: 'node',
      target: 'node22',
      format: 'cjs',
    });

    const greetingFunction = new lambda.Function(this, 'GreetingFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(bundledLambda),
      environment: {
        PARAMETER_NAME: greetingParameter.parameterName,
      },
      timeout: cdk.Duration.seconds(15),
    });

    greetingFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [greetingParameter.parameterArn],
    }));

    const invokeGreeting = new tasks.LambdaInvoke(this, 'ReadGreetingFromSSM', {
      lambdaFunction: greetingFunction,
      outputPath: '$.Payload',
    });

    invokeGreeting.addRetry({
      errors: [
        'Lambda.ServiceException',
        'Lambda.AWSLambdaException',
        'Lambda.SdkClientException',
        'States.TaskFailed',
      ],
      interval: cdk.Duration.seconds(2),
      maxAttempts: 3,
      backoffRate: 2,
    });

    invokeGreeting.addCatch(
      new sfn.Pass(this, 'HandleGreetingFailure', {
        result: sfn.Result.fromString('Greeting retrieval failed after retries'),
        resultPath: '$.error',
      }),
      { resultPath: '$.caughtError' },
    );

    const definition = new sfn.Pass(this, 'StartWorkflow').next(invokeGreeting);

    new sfn.StateMachine(this, 'GreetingStateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(2),
    });
  }
}

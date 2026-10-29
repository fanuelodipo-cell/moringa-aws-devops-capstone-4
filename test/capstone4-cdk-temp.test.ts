import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Capstone4CdkTempStack } from '../lib/capstone4-cdk-temp-stack';

describe('Capstone 4 Infrastructure', () => {
  const app = new cdk.App();
  const stack = new Capstone4CdkTempStack(app, 'TestCapstone4Stack');
  const template = Template.fromStack(stack);

  test('creates the required SSM greeting parameter', () => {
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/app/config/greeting',
      Type: 'String',
      Value: 'Hello from Capstone 4!',
    });
  });

  test('creates a Lambda function using Node.js 22', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Handler: 'index.handler',
      Timeout: 15,
    });
  });

  test('grants Lambda permission to read the SSM parameter', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'ssm:GetParameter',
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });

  test('creates a Step Functions state machine', () => {
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
  });
});
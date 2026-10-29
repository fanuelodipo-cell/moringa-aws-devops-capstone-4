#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { Capstone4CdkTempStack } from '../lib/capstone4-cdk-temp-stack';

const app = new cdk.App();

new Capstone4CdkTempStack(app, 'Capstone4CdkTempStack', {
  env: {
    account: '325657596892',
    region: 'eu-west-2',
  },
});

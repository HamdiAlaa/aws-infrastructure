import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Output } from "@pulumi/pulumi";

import * as __size from './_size';
const _config = require('../config/aws_nodes.json');
const stackConfig = new pulumi.Config();
let ipAddressesList: Output<string>[] = [];
let dnsList: Output<string>[] = [];


// Get the id for the latest Amazon Linux AMI
let ami = stackConfig.get('ami') || pulumi.output(aws.getAmi({
    filters: [
        { name: "name", values: ["amzn-ami-hvm-*-x86_64-ebs"] },
    ],
    owners: ["137112412989"], // Amazon
    mostRecent: true,
})).apply(result => result.id);

// create a new security group for port 80
let securityGroup = new aws.ec2.SecurityGroup("web-secgrp", {
    ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    ],

});
const nodeKey = new aws.ec2.KeyPair('key', {
    keyName: 'node',
    publicKey: _config.publicKey
});
let userData =
    `#!/bin/bash
        echo "Hello, World it Me!" > index.html
        nohup python -m SimpleHTTPServer 80 &` || stackConfig.get('script');
//Begin LOOP
for (let index = 1; index <= _config.vmNumber; index++) {
    let server = new aws.ec2.Instance(`node-${index}`, {
        instanceType: __size.getSize(),
        securityGroups: [securityGroup.name],
        ami: _config.ami,
        userData: _config.userData,
        keyName: nodeKey.keyName
    });
    ipAddressesList.push(server.publicIp);
    dnsList.push(server.publicDns);
}//END LOOP

//EXPORTS
export const ips = ipAddressesList;
export const dns = dnsList;
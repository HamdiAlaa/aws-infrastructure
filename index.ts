import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Output } from "@pulumi/pulumi";

import * as __size from './_size';
const __ = require('../config/aws_nodes.json');
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
let securityGroup = new aws.ec2.SecurityGroup(`${__.params.type}--scrtgrp`, {
    ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    ],

});
const nodeKey = new aws.ec2.KeyPair(`${__.params.type}--keyPair`, {
    keyName: `${__.params.type}-key-name`,
    publicKey: __.params.public_key
});
let userData =
    '' || stackConfig.get('script');
//Begin LOOP
for (let index = 1; index <= __.params.node_number; index++) {
    let server = new aws.ec2.Instance(`${__.params.type}--node--${index}`, {
        instanceType: __size.getSize(),
        securityGroups: [securityGroup.name],
        ami: __.params.ami,
        //userData: userData,
        keyName: nodeKey.keyName
    });
    ipAddressesList.push(server.publicIp);
    dnsList.push(server.publicDns);
}//END LOOP

//EXPORTS
export const ips = ipAddressesList;
export const dns = dnsList;

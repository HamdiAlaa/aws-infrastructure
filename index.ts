import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Output } from "@pulumi/pulumi";

import * as __size from './_size';
const __ = new pulumi.Config();
let ipAddressesList: Output<string>[] = [];
let dnsList: Output<string>[] = [];
let public_key:string = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCU3nkTvuHaCSJ2uKE8KWo23+5JqUG8VokNKlXjrWA2DxK9ioNpKVJ8nnCoEHz1Qr6MwhDG9rN5e3fwCbYVDRtTeFBP01bKCzRdAhvixu3xDqvyPnMYdTeOmj2CuTNKngdRfXzgMIqzyQPkn3ZC/WSPsbQb44RBzRnZYbSxPCAhj4soOu5EWcWK8xPzK4ukBniUknNeD8CZ7GRgwNsheF2rATFLGEy/wuGwn+nJlfSlQtKfeBrEF76TDgcpCOVTwp4rdAp1PWiCh0RLgaXfRUbYlx5lrapNaSRuzfrlkuqXUedjs6vEM/BgAp7KYHDjJF+fABxZBZLhMPPRZW8NA94J alaa@alaa";

// Get the id for the latest Amazon Linux AMI
let ami = __.get('ami') || pulumi.output(aws.getAmi({
    filters: [
        { name: "name", values: ["amzn-ami-hvm-*-x86_64-ebs"] },
    ],
    owners: ["137112412989"], // Amazon
    mostRecent: true,
})).apply(result => result.id);

// create a new security group for port 80
let securityGroup = new aws.ec2.SecurityGroup(`${__.get('type')}--scrtgrp`, {
    ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    ],

});
const nodeKey = new aws.ec2.KeyPair(`${__.get('type')}--keyPair`, {
    keyName: `${__.get('type')}-key-name`,
    publicKey: public_key
});
// let userData =
//     '' || __.require('script');
//Begin LOOP
for (let index = 1; index <= +__.require('node_number'); index++) {
    let server = new aws.ec2.Instance(`${__.get('type')}--node--${index}`, {
        instanceType: __size.getSize(),
        securityGroups: [securityGroup.name],
        ami: ami,
        //userData: userData,
        keyName: nodeKey.keyName
    });
    ipAddressesList.push(server.publicIp);
    dnsList.push(server.publicDns);
}//END LOOP

//EXPORTS
export const ips = ipAddressesList;
export const dns = dnsList;

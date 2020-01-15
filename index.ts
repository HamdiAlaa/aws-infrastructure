import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx"
import { Output } from "@pulumi/pulumi";

import * as __size from './_size';
const __ = new pulumi.Config();
let ipAddressesList: Output<string>[] = [];
let privateIpAddressesList: Output<string>[] = [];
let dnsList: Output<string>[] = [];
let public_key:string = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCPr8URNZnLcR+sSVxcUg3ir0X7V+4EuqF4hkCsVJZ2z8HQXtVSPkANkVW28uwPPrt2o83Pouq2GdCsDu7X7xaVgSw7i2Cwi4x4ZiMNpMGTRuvGgbXt0gI7reolfaOWh51wJcjOXdTlH1cXCq4gEZoSecfh3XY6K7ND/YcRpLKsEtKHQoxHrAa80abd/VskRV+WicfJgbHyZ+qdRdyb73Tvh52cHDLo1iYIV/l+YEc70EGpn0LG4v1vIPUSWmYYp75jZNnHHntZjbDcQ/pT5M1Ov6Lwr6xF9vS54uKPCyNQRJcTzbvgVPu/j3lsKAJQscy6ccA+uPrDKDZ0V/zdUjSB"
// Get the id for the latest Amazon Linux AMI
let ami = pulumi.output(aws.getAmi({
    filters: [
        { name: "name", values: ["ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-20191002"] },
    ],
    owners: ["099720109477"], // Amazon
    mostRecent: true,
})).apply(result => result.id);

// create a new security group for port 80
let securityGroup = new aws.ec2.SecurityGroup(`${__.require('type')}--scrtgrp`, {
    ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 0, toPort: 65535, cidrBlocks: ["0.0.0.0/0"]} 
        ],
    egress:[
        {protocol:"-1",fromPort:0,toPort:0,cidrBlocks:["0.0.0.0/0"]}
    ],
    revokeRulesOnDelete:true,
    
});

const nodeKey = new aws.ec2.KeyPair(`${__.require('type')}--keyPair`, {
    keyName: `${__.require('type')}-key-name`,
    publicKey: public_key,
});


let userData =
`#!/bin/bash
sudo apt-get update
sudo apt-get install apt-transport-https ca-certificates curl gnupg-agent software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install docker-ce=5:18.09.9~3-0~ubuntu-bionic docker-ce-cli=5:18.09.9~3-0~ubuntu-bionic containerd.io -y
echo "Hello, World!" > index.html
sudo usermod -aG docker ubuntu &`;
//Begin LOOP
for (let index = 1; index <= +__.require('node_number'); index++) {
    let server = new aws.ec2.Instance(`${__.require('type')}--node--${index}`, {
        instanceType: __size.getSize(),
        securityGroups: [securityGroup.name],
        ami: ami,
        userData: userData,
        keyName: nodeKey.keyName,
    });
    
    ipAddressesList.push(server.publicIp);
    dnsList.push(server.publicDns);
    privateIpAddressesList.push(server.privateIp);
}//END LOOP

//EXPORTS
export const ips = ipAddressesList;
export const dns = dnsList;
export const privateIps=privateIpAddressesList;
